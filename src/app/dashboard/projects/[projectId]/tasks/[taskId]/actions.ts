"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentWorkspace, verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

const taskDetailsSchema = z.object({
  projectId: z.string().min(1),
  taskId: z.string().min(1),
  title: z.string().trim().min(2, "Use at least 2 characters.").max(120, "Use 120 characters or fewer."),
  description: z.string().trim().max(2000, "Use 2,000 characters or fewer."),
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  assigneeId: z.string().optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date.").optional(),
});

const commentSchema = z.object({
  projectId: z.string().min(1),
  taskId: z.string().min(1),
  body: z.string().trim().min(1, "Write a comment first.").max(2000, "Use 2,000 characters or fewer."),
});

const labelColorSchema = z.enum(["ZINC", "BLUE", "EMERALD", "AMBER", "RED", "VIOLET"]);

const createLabelSchema = z.object({
  projectId: z.string().min(1),
  taskId: z.string().min(1),
  name: z.string().trim().min(2, "Use at least 2 characters.").max(24, "Use 24 characters or fewer."),
  color: labelColorSchema,
});

const updateLabelSchema = z.object({
  projectId: z.string().min(1),
  taskId: z.string().min(1),
  labelId: z.string().min(1),
  operation: z.enum(["add", "remove"]),
});

export type TaskDetailsState = {
  error?: string;
  success?: boolean;
  fieldErrors?: {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    assigneeId?: string;
    dueDate?: string;
  };
};

export type CommentState = {
  error?: string;
  success?: boolean;
  fieldErrors?: { body?: string };
};

export type LabelState = {
  error?: string;
  success?: boolean;
  fieldErrors?: { name?: string; color?: string };
};

const statusLabel = { TODO: "Todo", IN_PROGRESS: "In progress", REVIEW: "Review", DONE: "Done" } as const;
const priorityLabel = { LOW: "Low", MEDIUM: "Medium", HIGH: "High", URGENT: "Urgent" } as const;

function refreshTask(projectId: string, taskId: string) {
  revalidatePath(`/dashboard/projects/${projectId}/tasks/${taskId}`);
  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard");
}

async function findWorkspaceTask(workspaceId: string, projectId: string, taskId: string) {
  return prisma.task.findFirst({
    where: { id: taskId, projectId, project: { workspaceId } },
    select: { id: true },
  });
}

export async function updateTaskDetails(_state: TaskDetailsState, formData: FormData): Promise<TaskDetailsState> {
  const [{ userId }, membership] = await Promise.all([verifySession(), getCurrentWorkspace()]);
  if (!membership) return { error: "Workspace not found." };

  const parsed = taskDetailsSchema.safeParse({
    projectId: formData.get("projectId"),
    taskId: formData.get("taskId"),
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    status: formData.get("status"),
    priority: formData.get("priority"),
    assigneeId: formData.get("assigneeId") || undefined,
    dueDate: formData.get("dueDate") || undefined,
  });

  if (!parsed.success) {
    const fields = parsed.error.flatten().fieldErrors;
    return { fieldErrors: {
      title: fields.title?.[0],
      description: fields.description?.[0],
      status: fields.status?.[0],
      priority: fields.priority?.[0],
      assigneeId: fields.assigneeId?.[0],
      dueDate: fields.dueDate?.[0],
    } };
  }

  const task = await prisma.task.findFirst({
    where: {
      id: parsed.data.taskId,
      projectId: parsed.data.projectId,
      project: { workspaceId: membership.workspace.id },
    },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      assigneeId: true,
      dueDate: true,
    },
  });
  if (!task) return { error: "Task not found." };

  if (parsed.data.assigneeId) {
    const assignee = await prisma.member.findFirst({
      where: { id: parsed.data.assigneeId, workspaceId: membership.workspace.id },
      select: { id: true },
    });
    if (!assignee) return { fieldErrors: { assigneeId: "Choose a member from this workspace." } };
  }

  const nextDueDate = parsed.data.dueDate ? new Date(`${parsed.data.dueDate}T12:00:00.000Z`) : null;
  const detailsChanged = task.title !== parsed.data.title
    || (task.description || "") !== parsed.data.description
    || task.assigneeId !== (parsed.data.assigneeId || null)
    || (task.dueDate?.toISOString().slice(0, 10) || "") !== (parsed.data.dueDate || "");
  const priorityChanged = task.priority !== parsed.data.priority;
  const statusChanged = task.status !== parsed.data.status;

  const activities: Array<{ type: "UPDATED" | "STATUS_CHANGED"; message: string }> = [];
  if (detailsChanged) activities.push({ type: "UPDATED", message: "updated the task details" });
  if (priorityChanged) activities.push({ type: "UPDATED", message: `changed priority from ${priorityLabel[task.priority]} to ${priorityLabel[parsed.data.priority]}` });
  if (statusChanged) activities.push({ type: "STATUS_CHANGED", message: `moved the task from ${statusLabel[task.status]} to ${statusLabel[parsed.data.status]}` });

  try {
    await prisma.$transaction(async (tx) => {
      let position = undefined;
      if (statusChanged) {
        const lastTask = await tx.task.findFirst({
          where: { projectId: parsed.data.projectId, status: parsed.data.status },
          orderBy: { position: "desc" },
          select: { position: true },
        });
        position = (lastTask?.position ?? -1) + 1;
      }

      await tx.task.update({
        where: { id: task.id },
        data: {
          title: parsed.data.title,
          description: parsed.data.description || null,
          status: parsed.data.status,
          priority: parsed.data.priority,
          assigneeId: parsed.data.assigneeId || null,
          dueDate: nextDueDate,
          ...(position === undefined ? {} : { position }),
        },
      });

      if (activities.length) {
        await tx.taskActivity.createMany({
          data: activities.map((activity) => ({ ...activity, taskId: task.id, actorId: userId })),
        });
      }
    });
  } catch {
    return { error: "We could not update the task. Try again." };
  }

  refreshTask(parsed.data.projectId, task.id);
  return { success: true };
}

export async function addTaskComment(_state: CommentState, formData: FormData): Promise<CommentState> {
  const [{ userId }, membership] = await Promise.all([verifySession(), getCurrentWorkspace()]);
  if (!membership) return { error: "Workspace not found." };

  const parsed = commentSchema.safeParse({
    projectId: formData.get("projectId"),
    taskId: formData.get("taskId"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { fieldErrors: { body: parsed.error.flatten().fieldErrors.body?.[0] } };

  const task = await prisma.task.findFirst({
    where: {
      id: parsed.data.taskId,
      projectId: parsed.data.projectId,
      project: { workspaceId: membership.workspace.id },
    },
    select: { id: true },
  });
  if (!task) return { error: "Task not found." };

  try {
    await prisma.$transaction([
      prisma.taskComment.create({ data: { body: parsed.data.body, taskId: task.id, authorId: userId } }),
      prisma.taskActivity.create({ data: { type: "COMMENTED", message: "added a comment", taskId: task.id, actorId: userId } }),
    ]);
  } catch {
    return { error: "We could not add the comment. Try again." };
  }

  refreshTask(parsed.data.projectId, task.id);
  return { success: true };
}

export async function createTaskLabel(_state: LabelState, formData: FormData): Promise<LabelState> {
  const [{ userId }, membership] = await Promise.all([verifySession(), getCurrentWorkspace()]);
  if (!membership) return { error: "Workspace not found." };
  if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
    return { error: "Only workspace owners and admins can create labels." };
  }

  const parsed = createLabelSchema.safeParse({
    projectId: formData.get("projectId"),
    taskId: formData.get("taskId"),
    name: formData.get("name"),
    color: formData.get("color"),
  });
  if (!parsed.success) {
    const fields = parsed.error.flatten().fieldErrors;
    return { fieldErrors: { name: fields.name?.[0], color: fields.color?.[0] } };
  }

  const task = await findWorkspaceTask(membership.workspace.id, parsed.data.projectId, parsed.data.taskId);
  if (!task) return { error: "Task not found." };

  const existing = await prisma.taskLabel.findFirst({
    where: { workspaceId: membership.workspace.id, name: { equals: parsed.data.name, mode: "insensitive" } },
    select: { id: true },
  });
  if (existing) return { fieldErrors: { name: "A label with this name already exists." } };

  try {
    await prisma.$transaction(async (tx) => {
      const label = await tx.taskLabel.create({
        data: { name: parsed.data.name, color: parsed.data.color, workspaceId: membership.workspace.id },
      });
      await tx.taskLabelAssignment.create({ data: { taskId: task.id, labelId: label.id } });
      await tx.taskActivity.create({
        data: { type: "UPDATED", message: `created and added the ${label.name} label`, taskId: task.id, actorId: userId },
      });
    });
  } catch {
    return { error: "We could not create the label. Try another name." };
  }

  refreshTask(parsed.data.projectId, task.id);
  return { success: true };
}

export async function updateTaskLabel(_state: LabelState, formData: FormData): Promise<LabelState> {
  const [{ userId }, membership] = await Promise.all([verifySession(), getCurrentWorkspace()]);
  if (!membership) return { error: "Workspace not found." };

  const parsed = updateLabelSchema.safeParse({
    projectId: formData.get("projectId"),
    taskId: formData.get("taskId"),
    labelId: formData.get("labelId"),
    operation: formData.get("operation"),
  });
  if (!parsed.success) return { error: "Invalid label request." };

  const [task, label] = await Promise.all([
    findWorkspaceTask(membership.workspace.id, parsed.data.projectId, parsed.data.taskId),
    prisma.taskLabel.findFirst({
      where: { id: parsed.data.labelId, workspaceId: membership.workspace.id },
      select: { id: true, name: true },
    }),
  ]);
  if (!task || !label) return { error: "Task or label not found." };

  try {
    await prisma.$transaction(async (tx) => {
      if (parsed.data.operation === "add") {
        const existing = await tx.taskLabelAssignment.findUnique({
          where: { taskId_labelId: { taskId: task.id, labelId: label.id } },
          select: { taskId: true },
        });
        if (existing) return;
        await tx.taskLabelAssignment.create({ data: { taskId: task.id, labelId: label.id } });
        await tx.taskActivity.create({
          data: { type: "UPDATED", message: `added the ${label.name} label`, taskId: task.id, actorId: userId },
        });
        return;
      }

      const removed = await tx.taskLabelAssignment.deleteMany({ where: { taskId: task.id, labelId: label.id } });
      if (removed.count) {
        await tx.taskActivity.create({
          data: { type: "UPDATED", message: `removed the ${label.name} label`, taskId: task.id, actorId: userId },
        });
      }
    });
  } catch {
    return { error: "We could not update the label. Try again." };
  }

  refreshTask(parsed.data.projectId, task.id);
  return { success: true };
}

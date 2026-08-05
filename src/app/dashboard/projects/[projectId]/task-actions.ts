"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentWorkspace, verifySession } from "@/lib/dal";
import { buildTaskNotifications, taskHref } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

const taskSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().trim().min(2, "Use at least 2 characters.").max(120, "Use 120 characters or fewer."),
  description: z.string().trim().max(500, "Use 500 characters or fewer."),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  assigneeId: z.string().optional(),
});

const boardUpdateSchema = z.object({
  projectId: z.string().min(1),
  updates: z.array(z.object({
    id: z.string().min(1),
    status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]),
    position: z.number().int().min(0),
  })).min(1).max(500),
});

export type TaskFormState = {
  error?: string;
  success?: boolean;
  fieldErrors?: { title?: string; description?: string; priority?: string; assigneeId?: string };
};

export async function createTask(_state: TaskFormState, formData: FormData): Promise<TaskFormState> {
  const [{ userId }, membership] = await Promise.all([verifySession(), getCurrentWorkspace()]);
  if (!membership) return { error: "Choose a workspace before creating tasks." };

  const parsed = taskSchema.safeParse({
    projectId: formData.get("projectId"),
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    priority: formData.get("priority"),
    assigneeId: formData.get("assigneeId") || undefined,
  });

  if (!parsed.success) {
    const fields = parsed.error.flatten().fieldErrors;
    return { fieldErrors: { title: fields.title?.[0], description: fields.description?.[0], priority: fields.priority?.[0], assigneeId: fields.assigneeId?.[0] } };
  }

  const project = await prisma.project.findFirst({
    where: { id: parsed.data.projectId, workspaceId: membership.workspace.id },
    select: { id: true, key: true },
  });
  if (!project) return { error: "Project not found." };

  let assigneeUserId: string | null = null;
  if (parsed.data.assigneeId) {
    const assignee = await prisma.member.findFirst({
      where: { id: parsed.data.assigneeId, workspaceId: membership.workspace.id },
      select: { id: true, userId: true },
    });
    if (!assignee) return { fieldErrors: { assigneeId: "Choose a member from this workspace." } };
    assigneeUserId = assignee.userId;
  }

  try {
    await prisma.$transaction(async (tx) => {
      const numberedProject = await tx.project.update({
        where: { id: project.id },
        data: { nextTaskNumber: { increment: 1 } },
        select: { nextTaskNumber: true },
      });
      const lastTask = await tx.task.findFirst({
        where: { projectId: project.id, status: "TODO" },
        orderBy: { position: "desc" },
        select: { position: true },
      });

      const task = await tx.task.create({
        data: {
          number: numberedProject.nextTaskNumber - 1,
          title: parsed.data.title,
          description: parsed.data.description || null,
          priority: parsed.data.priority,
          position: (lastTask?.position ?? -1) + 1,
          projectId: project.id,
          assigneeId: parsed.data.assigneeId || null,
          createdById: userId,
          activities: {
            create: {
              type: "CREATED",
              message: "created the task",
              actorId: userId,
            },
          },
        },
      });

      if (assigneeUserId) {
        const notifications = buildTaskNotifications({
          type: "TASK_ASSIGNED",
          title: `${project.key}-${task.number} assigned to you`,
          message: `assigned you “${task.title}”`,
          href: taskHref(project.id, task.id),
          recipientIds: [assigneeUserId],
          actorId: userId,
          workspaceId: membership.workspace.id,
          taskId: task.id,
        });
        if (notifications.length) await tx.notification.createMany({ data: notifications });
      }
    });
  } catch {
    return { error: "We could not create the task. Try again." };
  }

  revalidatePath(`/dashboard/projects/${project.id}`);
  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateTaskBoard(projectId: string, updates: Array<{ id: string; status: string; position: number }>) {
  const [{ userId }, membership] = await Promise.all([verifySession(), getCurrentWorkspace()]);
  if (!membership) return { error: "Workspace not found." };

  const parsed = boardUpdateSchema.safeParse({ projectId, updates });
  if (!parsed.success) return { error: "The board update is invalid." };

  const uniqueIds = [...new Set(parsed.data.updates.map((update) => update.id))];
  if (uniqueIds.length !== parsed.data.updates.length) return { error: "The board update contains duplicate tasks." };

  const project = await prisma.project.findFirst({
    where: { id: parsed.data.projectId, workspaceId: membership.workspace.id },
    select: { id: true, key: true },
  });
  if (!project) return { error: "Project not found." };

  const ownedTasks = await prisma.task.findMany({
    where: { id: { in: uniqueIds }, projectId: project.id },
    select: {
      id: true,
      status: true,
      title: true,
      number: true,
      createdById: true,
      assignee: { select: { userId: true } },
    },
  });
  if (ownedTasks.length !== uniqueIds.length) return { error: "One or more tasks do not belong to this project." };

  const previousStatus = new Map(ownedTasks.map((task) => [task.id, task.status]));
  const statusLabel = { TODO: "Todo", IN_PROGRESS: "In progress", REVIEW: "Review", DONE: "Done" } as const;
  const statusChanges = parsed.data.updates.filter((update) => previousStatus.get(update.id) !== update.status);
  const taskById = new Map(ownedTasks.map((task) => [task.id, task]));
  const notifications = statusChanges.flatMap((update) => {
    const task = taskById.get(update.id)!;
    return buildTaskNotifications({
      type: "STATUS_CHANGED",
      title: `${project.key}-${task.number} moved to ${statusLabel[update.status]}`,
      message: `moved “${task.title}” from ${statusLabel[task.status]} to ${statusLabel[update.status]}`,
      href: taskHref(project.id, task.id),
      recipientIds: [task.assignee?.userId, task.createdById],
      actorId: userId,
      workspaceId: membership.workspace.id,
      taskId: task.id,
    });
  });

  try {
    await prisma.$transaction([
      ...parsed.data.updates.map((update) => prisma.task.update({
        where: { id: update.id },
        data: { status: update.status, position: update.position },
      })),
      ...(statusChanges.length ? [prisma.taskActivity.createMany({
        data: statusChanges.map((update) => ({
          taskId: update.id,
          actorId: userId,
          type: "STATUS_CHANGED",
          message: `moved the task from ${statusLabel[previousStatus.get(update.id)!]} to ${statusLabel[update.status]}`,
        })),
      })] : []),
      ...(notifications.length ? [prisma.notification.createMany({ data: notifications })] : []),
    ]);
  } catch {
    return { error: "We could not save the board order. Try again." };
  }

  revalidatePath(`/dashboard/projects/${project.id}`);
  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard");
  return { success: true };
}

import { prisma } from "@/lib/prisma";

export type TaskNotificationType = "TASK_ASSIGNED" | "COMMENT_ADDED" | "STATUS_CHANGED";

type TaskNotificationInput = {
  actorId: string;
  href: string;
  message: string;
  recipientIds: Array<string | null | undefined>;
  taskId: string;
  title: string;
  type: TaskNotificationType;
  workspaceId: string;
};

export function taskHref(projectId: string, taskId: string) {
  return `/dashboard/projects/${projectId}/tasks/${taskId}`;
}

export async function eligibleNotificationRecipients({
  actorId,
  candidateIds,
  type,
  workspaceId,
}: {
  actorId: string;
  candidateIds: Array<string | null | undefined>;
  type: TaskNotificationType;
  workspaceId: string;
}) {
  const uniqueIds = [...new Set(candidateIds.filter((candidateId): candidateId is string => Boolean(candidateId)))]
    .filter((candidateId) => candidateId !== actorId);
  if (!uniqueIds.length) return [];

  const preference = type === "TASK_ASSIGNED"
    ? { notifyTaskAssigned: true }
    : type === "COMMENT_ADDED"
      ? { notifyComments: true }
      : { notifyStatusChanges: true };

  const members = await prisma.member.findMany({
    where: { workspaceId, userId: { in: uniqueIds }, ...preference },
    select: { userId: true },
  });
  return members.map((member) => member.userId);
}

export function buildTaskNotifications(input: TaskNotificationInput) {
  const recipients = [...new Set(input.recipientIds.filter((recipientId): recipientId is string => Boolean(recipientId)))]
    .filter((recipientId) => recipientId !== input.actorId);

  return recipients.map((recipientId) => ({
    type: input.type,
    title: input.title,
    message: input.message,
    href: input.href,
    recipientId,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    taskId: input.taskId,
  }));
}

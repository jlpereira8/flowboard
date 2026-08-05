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

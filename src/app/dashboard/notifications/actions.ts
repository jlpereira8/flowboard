"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentWorkspace, verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

const notificationSchema = z.object({ notificationId: z.string().min(1) });

function refreshNotifications() {
  revalidatePath("/dashboard/notifications");
}

export async function markNotificationRead(formData: FormData) {
  const [{ userId }, membership] = await Promise.all([verifySession(), getCurrentWorkspace()]);
  if (!membership) return;

  const parsed = notificationSchema.safeParse({ notificationId: formData.get("notificationId") });
  if (!parsed.success) return;

  await prisma.notification.updateMany({
    where: {
      id: parsed.data.notificationId,
      recipientId: userId,
      workspaceId: membership.workspace.id,
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  refreshNotifications();
}

export async function markAllNotificationsRead() {
  const [{ userId }, membership] = await Promise.all([verifySession(), getCurrentWorkspace()]);
  if (!membership) return;

  await prisma.notification.updateMany({
    where: { recipientId: userId, workspaceId: membership.workspace.id, readAt: null },
    data: { readAt: new Date() },
  });

  refreshNotifications();
}

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentWorkspace, verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Use at least 2 characters.").max(60, "Use 60 characters or fewer."),
});

const workspaceSchema = z.object({
  name: z.string().trim().min(2, "Use at least 2 characters.").max(60, "Use 60 characters or fewer."),
});

const appearanceSchema = z.object({ theme: z.enum(["SYSTEM", "LIGHT", "DARK"]) });

export type SettingsState = {
  error?: string;
  success?: string;
  fieldErrors?: { name?: string; theme?: string };
};

function refreshSettings() {
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
}

export async function updateProfile(_state: SettingsState, formData: FormData): Promise<SettingsState> {
  const { userId } = await verifySession();
  const parsed = profileSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { fieldErrors: { name: parsed.error.flatten().fieldErrors.name?.[0] } };

  try {
    await prisma.user.update({ where: { id: userId }, data: { name: parsed.data.name } });
  } catch {
    return { error: "We could not update your profile. Try again." };
  }

  refreshSettings();
  return { success: "Profile updated." };
}

export async function updateWorkspace(_state: SettingsState, formData: FormData): Promise<SettingsState> {
  const membership = await getCurrentWorkspace();
  if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
    return { error: "Only workspace owners and admins can change these details." };
  }

  const parsed = workspaceSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { fieldErrors: { name: parsed.error.flatten().fieldErrors.name?.[0] } };

  try {
    await prisma.workspace.update({ where: { id: membership.workspace.id }, data: { name: parsed.data.name } });
  } catch {
    return { error: "We could not update the workspace. Try again." };
  }

  refreshSettings();
  return { success: "Workspace updated." };
}

export async function updateNotificationPreferences(_state: SettingsState, formData: FormData): Promise<SettingsState> {
  const membership = await getCurrentWorkspace();
  if (!membership) return { error: "Workspace not found." };

  try {
    await prisma.member.update({
      where: { id: membership.id },
      data: {
        notifyTaskAssigned: formData.get("notifyTaskAssigned") === "on",
        notifyComments: formData.get("notifyComments") === "on",
        notifyStatusChanges: formData.get("notifyStatusChanges") === "on",
      },
    });
  } catch {
    return { error: "We could not update your notification preferences." };
  }

  refreshSettings();
  return { success: "Notification preferences updated." };
}

export async function updateAppearance(_state: SettingsState, formData: FormData): Promise<SettingsState> {
  const membership = await getCurrentWorkspace();
  if (!membership) return { error: "Workspace not found." };

  const parsed = appearanceSchema.safeParse({ theme: formData.get("theme") });
  if (!parsed.success) return { fieldErrors: { theme: "Choose a valid theme." } };

  try {
    await prisma.member.update({ where: { id: membership.id }, data: { theme: parsed.data.theme } });
  } catch {
    return { error: "We could not update the appearance." };
  }

  refreshSettings();
  return { success: "Appearance updated." };
}

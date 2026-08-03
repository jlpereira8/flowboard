"use server";

import { createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";

import { signIn } from "@/auth";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

const tokenSchema = z.string().min(40).max(128).regex(/^[A-Za-z0-9_-]+$/);

export async function signInForInvitation(formData: FormData) {
  const parsed = tokenSchema.safeParse(formData.get("token"));
  if (!parsed.success) redirect("/login");
  await signIn("github", { redirectTo: `/invite/${parsed.data}` });
}

export async function acceptInvitation(formData: FormData) {
  const { userId, user } = await verifySession();
  const parsed = tokenSchema.safeParse(formData.get("token"));
  if (!parsed.success || !user.email) return;

  const tokenHash = createHash("sha256").update(parsed.data).digest("hex");
  const invitation = await prisma.workspaceInvitation.findUnique({ where: { tokenHash } });

  if (!invitation || invitation.acceptedAt || invitation.expiresAt <= new Date()) return;
  if (invitation.email.toLowerCase() !== user.email.toLowerCase()) return;

  await prisma.$transaction(async (transaction) => {
    const existingMembership = await transaction.member.findUnique({
      where: { userId_workspaceId: { userId, workspaceId: invitation.workspaceId } },
      select: { id: true },
    });

    if (!existingMembership) {
      await transaction.member.create({
        data: { userId, workspaceId: invitation.workspaceId, role: invitation.role },
      });
    }

    await transaction.workspaceInvitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    });
  });

  redirect("/dashboard");
}

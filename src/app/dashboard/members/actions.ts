"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentWorkspace, verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

const invitationSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  role: z.enum(["ADMIN", "MEMBER"]),
});

const roleSchema = z.object({
  memberId: z.string().min(1),
  role: z.enum(["ADMIN", "MEMBER"]),
});

export type InvitationState = {
  error?: string;
  invitePath?: string;
  invitedEmail?: string;
  fieldErrors?: { email?: string; role?: string };
};

export async function createInvitation(_state: InvitationState, formData: FormData): Promise<InvitationState> {
  const [{ userId }, membership] = await Promise.all([verifySession(), getCurrentWorkspace()]);

  if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
    return { error: "Only workspace owners and admins can invite members." };
  }

  const parsed = invitationSchema.safeParse({ email: formData.get("email"), role: formData.get("role") });
  if (!parsed.success) {
    const fields = parsed.error.flatten().fieldErrors;
    return { fieldErrors: { email: fields.email?.[0], role: fields.role?.[0] } };
  }

  if (parsed.data.role === "ADMIN" && membership.role !== "OWNER") {
    return { fieldErrors: { role: "Only the workspace owner can invite admins." } };
  }

  const existingMember = await prisma.member.findFirst({
    where: { workspaceId: membership.workspace.id, user: { email: { equals: parsed.data.email, mode: "insensitive" } } },
    select: { id: true },
  });

  if (existingMember) {
    return { fieldErrors: { email: "This person is already a workspace member." } };
  }

  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const pendingInvitation = await prisma.workspaceInvitation.findFirst({
    where: { workspaceId: membership.workspace.id, email: parsed.data.email, acceptedAt: null, expiresAt: { gt: new Date() } },
    select: { id: true },
  });

  if (pendingInvitation) {
    await prisma.workspaceInvitation.update({
      where: { id: pendingInvitation.id },
      data: { role: parsed.data.role, tokenHash, expiresAt, invitedById: userId },
    });
  } else {
    await prisma.workspaceInvitation.create({
      data: { email: parsed.data.email, role: parsed.data.role, tokenHash, expiresAt, workspaceId: membership.workspace.id, invitedById: userId },
    });
  }

  revalidatePath("/dashboard/members");
  return { invitePath: `/invite/${token}`, invitedEmail: parsed.data.email };
}

export async function updateMemberRole(formData: FormData) {
  const membership = await getCurrentWorkspace();
  if (!membership || membership.role !== "OWNER") return;

  const parsed = roleSchema.safeParse({ memberId: formData.get("memberId"), role: formData.get("role") });
  if (!parsed.success) return;

  const target = await prisma.member.findFirst({
    where: { id: parsed.data.memberId, workspaceId: membership.workspace.id },
    select: { id: true, role: true },
  });

  if (!target || target.role === "OWNER") return;

  await prisma.member.update({ where: { id: target.id }, data: { role: parsed.data.role } });
  revalidatePath("/dashboard/members");
}

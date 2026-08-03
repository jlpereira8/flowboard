"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

const workspaceSchema = z.object({
  name: z.string().trim().min(2, "Use at least 2 characters.").max(60, "Use 60 characters or fewer."),
});

export type OnboardingState = {
  error?: string;
};

export async function createWorkspace(
  _state: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const { userId } = await verifySession();
  const parsed = workspaceSchema.safeParse({ name: formData.get("name") });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a workspace name." };
  }

  const existingMembership = await prisma.member.findFirst({ where: { userId } });

  if (existingMembership) {
    redirect("/dashboard");
  }

  const baseSlug = parsed.data.name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "workspace";
  const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 6)}`;

  await prisma.$transaction(async (transaction) => {
    const workspace = await transaction.workspace.create({
      data: {
        name: parsed.data.name,
        slug,
        ownerId: userId,
      },
    });

    await transaction.member.create({
      data: {
        userId,
        workspaceId: workspace.id,
        role: "OWNER",
      },
    });
  });

  redirect("/dashboard");
}

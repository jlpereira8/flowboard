"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentWorkspace } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

const teamSchema = z.object({
  name: z.string().trim().min(2, "Use at least 2 characters.").max(60, "Use 60 characters or fewer."),
  key: z.string().trim().toUpperCase().min(2, "Use at least 2 letters.").max(6, "Use 6 characters or fewer.").regex(/^[A-Z][A-Z0-9]*$/, "Start with a letter and use only letters or numbers."),
  description: z.string().trim().max(180, "Use 180 characters or fewer."),
});

export type TeamFormState = {
  success?: string;
  error?: string;
  fieldErrors?: { name?: string; key?: string; description?: string };
};

export async function createTeam(_state: TeamFormState, formData: FormData): Promise<TeamFormState> {
  const membership = await getCurrentWorkspace();

  if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
    return { error: "Only workspace owners and admins can create teams." };
  }

  const parsed = teamSchema.safeParse({
    name: formData.get("name"),
    key: formData.get("key"),
    description: formData.get("description") ?? "",
  });

  if (!parsed.success) {
    const fields = parsed.error.flatten().fieldErrors;
    return { fieldErrors: { name: fields.name?.[0], key: fields.key?.[0], description: fields.description?.[0] } };
  }

  try {
    await prisma.$transaction(async (transaction) => {
      const team = await transaction.team.create({
        data: {
          name: parsed.data.name,
          key: parsed.data.key,
          description: parsed.data.description || null,
          workspaceId: membership.workspace.id,
        },
      });

      await transaction.teamMember.create({ data: { teamId: team.id, memberId: membership.id } });
    });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
      return { fieldErrors: { key: "That team key is already in use." } };
    }

    return { error: "We could not create the team. Try again." };
  }

  revalidatePath("/dashboard/teams");
  return { success: `${parsed.data.name} was created.` };
}

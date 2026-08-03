"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getCurrentWorkspace, verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

const projectSchema = z.object({
  name: z.string().trim().min(2, "Use at least 2 characters.").max(80, "Use 80 characters or fewer."),
  key: z
    .string()
    .trim()
    .toUpperCase()
    .min(2, "Use at least 2 letters.")
    .max(6, "Use 6 characters or fewer.")
    .regex(/^[A-Z][A-Z0-9]*$/, "Start with a letter and use only letters or numbers."),
  description: z.string().trim().max(240, "Use 240 characters or fewer."),
});

export type ProjectFormState = {
  error?: string;
  fieldErrors?: {
    name?: string;
    key?: string;
    description?: string;
  };
};

export async function createProject(_state: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const [{ userId }, membership] = await Promise.all([verifySession(), getCurrentWorkspace()]);

  if (!membership) {
    redirect("/onboarding");
  }

  if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
    return { error: "Only workspace owners and admins can create projects." };
  }

  const parsed = projectSchema.safeParse({
    name: formData.get("name"),
    key: formData.get("key"),
    description: formData.get("description") ?? "",
  });

  if (!parsed.success) {
    const fields = parsed.error.flatten().fieldErrors;
    return {
      fieldErrors: {
        name: fields.name?.[0],
        key: fields.key?.[0],
        description: fields.description?.[0],
      },
    };
  }

  const slugBase = parsed.data.name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "project";

  try {
    await prisma.project.create({
      data: {
        name: parsed.data.name,
        key: parsed.data.key,
        description: parsed.data.description || null,
        slug: `${slugBase}-${crypto.randomUUID().slice(0, 6)}`,
        workspaceId: membership.workspace.id,
        createdById: userId,
      },
    });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
      return { fieldErrors: { key: "That project key is already in use." } };
    }

    return { error: "We could not create the project. Try again." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  redirect("/dashboard/projects");
}

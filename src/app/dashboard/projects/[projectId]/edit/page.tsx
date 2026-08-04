import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getCurrentWorkspace, verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

import { ProjectEditForm } from "./project-edit-form";

export default async function EditProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const [{ projectId }, { user }, membership] = await Promise.all([params, verifySession(), getCurrentWorkspace()]);
  if (!membership) redirect("/onboarding");
  if (membership.role !== "OWNER" && membership.role !== "ADMIN") redirect(`/dashboard/projects/${projectId}`);

  const [project, teams] = await Promise.all([
    prisma.project.findFirst({ where: { id: projectId, workspaceId: membership.workspace.id }, select: { id: true, name: true, key: true, description: true, status: true, teamId: true } }),
    prisma.team.findMany({ where: { workspaceId: membership.workspace.id }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!project) notFound();

  return <AppShell action={null} activeItem="projects" title="Edit project" user={user} workspace={membership.workspace}><main className="px-5 py-8 lg:px-8 lg:py-10"><div className="mx-auto max-w-2xl"><p className="text-sm text-zinc-500">Update ownership and project details.</p><h2 className="mt-1 text-3xl font-semibold tracking-[-0.035em]">Edit {project.name}</h2><section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8"><ProjectEditForm project={project} teams={teams} /></section></div></main></AppShell>;
}

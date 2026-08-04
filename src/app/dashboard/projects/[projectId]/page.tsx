import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getCurrentWorkspace, verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

import { KanbanBoard } from "./kanban-board";
import { NewTaskForm } from "./new-task-form";

export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const [{ projectId }, { user }, membership] = await Promise.all([params, verifySession(), getCurrentWorkspace()]);

  if (!membership) redirect("/onboarding");

  const [project, members] = await Promise.all([
    prisma.project.findFirst({
      where: { id: projectId, workspaceId: membership.workspace.id },
      include: {
        team: { select: { name: true, key: true } },
        tasks: {
          orderBy: [{ status: "asc" }, { position: "asc" }, { createdAt: "asc" }],
          select: {
            id: true,
            number: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            position: true,
            assignee: { select: { user: { select: { name: true, email: true } } } },
          },
        },
      },
    }),
    prisma.member.findMany({
      where: { workspaceId: membership.workspace.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, user: { select: { name: true, email: true } } },
    }),
  ]);

  if (!project) notFound();

  return (
    <AppShell activeItem="projects" title={project.name} user={user} workspace={membership.workspace}>
      <main className="px-5 py-8 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-6xl">
          <Link className="text-xs font-medium text-zinc-400 transition hover:text-zinc-700" href="/dashboard/projects">← Projects</Link>
          <div className="mt-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-zinc-950 px-2.5 py-1 text-xs font-semibold text-white">{project.key}</span>
                <span className="text-xs capitalize text-zinc-400">{project.status.toLowerCase()}</span>
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em]">{project.name}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">{project.description || "Add a project description to give the team more context."}</p>
            </div>
            {membership.role === "OWNER" || membership.role === "ADMIN" ? <Link className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-600 transition hover:border-zinc-300" href={`/dashboard/projects/${project.id}/edit`}>Edit project</Link> : null}
          </div>

          <section className="mt-8 grid gap-4 lg:grid-cols-[1fr_280px]">
            <NewTaskForm members={members.map((member) => ({ id: member.id, name: member.user.name || "", email: member.user.email || "" }))} projectId={project.id} />
            <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold">Project details</h3>
              <dl className="mt-4 grid grid-cols-2 gap-4 text-xs lg:grid-cols-1">
                <div><dt className="text-zinc-400">Status</dt><dd className="mt-1 font-medium capitalize">{project.status.toLowerCase()}</dd></div>
                <div><dt className="text-zinc-400">Project key</dt><dd className="mt-1 font-medium">{project.key}</dd></div>
                <div><dt className="text-zinc-400">Team</dt><dd className="mt-1 font-medium">{project.team ? `${project.team.name} (${project.team.key})` : "No team"}</dd></div>
                <div><dt className="text-zinc-400">Tasks</dt><dd className="mt-1 font-medium">{project.tasks.length}</dd></div>
              </dl>
            </article>
          </section>

          <KanbanBoard initialTasks={project.tasks} projectId={project.id} projectKey={project.key} />
        </div>
      </main>
    </AppShell>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getCurrentWorkspace, verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

const statusStyles = {
  PLANNED: "bg-blue-50 text-blue-700",
  ACTIVE: "bg-emerald-50 text-emerald-700",
  PAUSED: "bg-amber-50 text-amber-700",
  COMPLETED: "bg-zinc-100 text-zinc-600",
} as const;

export default async function ProjectsPage() {
  const [{ user }, membership] = await Promise.all([verifySession(), getCurrentWorkspace()]);

  if (!membership) redirect("/onboarding");

  const projects = await prisma.project.findMany({
    where: { workspaceId: membership.workspace.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <AppShell activeItem="projects" title="Projects" user={user} workspace={membership.workspace}>
      <main className="px-5 py-8 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-6xl">
          <div>
            <p className="text-sm text-zinc-500">Plan outcomes and keep work moving.</p>
            <h2 className="mt-1 text-3xl font-semibold tracking-[-0.035em]">Projects</h2>
          </div>

          {projects.length ? (
            <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <Link className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md" href={`/dashboard/projects/${project.id}`} key={project.id}>
                  <div className="flex items-start justify-between gap-4">
                    <span className="grid size-10 place-items-center rounded-xl bg-zinc-950 text-xs font-semibold text-white">{project.key.slice(0, 2)}</span>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${statusStyles[project.status]}`}>{project.status.toLowerCase()}</span>
                  </div>
                  <h3 className="mt-5 text-base font-semibold">{project.name}</h3>
                  <p className="mt-2 min-h-10 text-xs leading-5 text-zinc-400">{project.description || "No description yet."}</p>
                  <p className="mt-5 text-[11px] font-medium text-zinc-400 transition group-hover:text-zinc-700">{project.key} · Open project →</p>
                </Link>
              ))}
            </section>
          ) : (
            <section className="mt-8 grid min-h-96 place-items-center rounded-2xl border border-dashed border-zinc-300 bg-white text-center">
              <div className="max-w-sm px-6">
                <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-zinc-100 text-xl text-zinc-500">+</span>
                <h3 className="mt-5 text-base font-semibold">Create your first project</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">Give an initiative a clear home before adding tasks and milestones.</p>
                <Link className="mt-6 inline-block rounded-xl bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white" href="/dashboard/projects/new">New project</Link>
              </div>
            </section>
          )}
        </div>
      </main>
    </AppShell>
  );
}

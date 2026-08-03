import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getCurrentWorkspace, verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

import { TeamForm } from "./team-form";

export default async function TeamsPage() {
  const [{ user }, membership] = await Promise.all([verifySession(), getCurrentWorkspace()]);
  if (!membership) redirect("/onboarding");

  const teams = await prisma.team.findMany({
    where: { workspaceId: membership.workspace.id },
    orderBy: { name: "asc" },
    include: { _count: { select: { members: true, projects: true } } },
  });

  return (
    <AppShell action={null} activeItem="teams" title="Teams" user={user} workspace={membership.workspace}>
      <main className="px-5 py-8 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-zinc-500">Organize ownership without adding noise.</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-[-0.035em]">Teams</h2>
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
            <section className="space-y-3">
              {teams.length ? teams.map((team) => (
                <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm" key={team.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-3">
                      <span className="grid size-10 place-items-center rounded-xl bg-zinc-950 text-xs font-semibold text-white">{team.key.slice(0, 2)}</span>
                      <div><h3 className="text-sm font-semibold">{team.name}</h3><p className="mt-1 text-xs text-zinc-400">{team.description || "No description yet."}</p></div>
                    </div>
                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-medium text-zinc-500">{team.key}</span>
                  </div>
                  <div className="mt-5 flex gap-5 border-t border-zinc-100 pt-4 text-xs text-zinc-400"><span>{team._count.members} members</span><span>{team._count.projects} projects</span></div>
                </article>
              )) : (
                <div className="grid min-h-72 place-items-center rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center"><div><p className="text-sm font-medium">No teams yet</p><p className="mt-2 text-xs text-zinc-400">Create the first team for this workspace.</p></div></div>
              )}
            </section>
            <TeamForm />
          </div>
        </div>
      </main>
    </AppShell>
  );
}

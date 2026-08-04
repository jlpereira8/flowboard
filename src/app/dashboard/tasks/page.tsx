import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getCurrentWorkspace, verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

export default async function TasksPage() {
  const [{ user }, membership] = await Promise.all([verifySession(), getCurrentWorkspace()]);
  if (!membership) redirect("/onboarding");

  const tasks = await prisma.task.findMany({
    where: { assigneeId: membership.id },
    orderBy: [{ status: "asc" }, { priority: "desc" }, { updatedAt: "desc" }],
    include: { project: { select: { id: true, key: true, name: true } } },
  });

  return (
    <AppShell action={null} activeItem="tasks" title="My tasks" user={user} workspace={membership.workspace}>
      <main className="px-5 py-8 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-zinc-500">A focused view of work assigned to you.</p>
          <div className="mt-1 flex items-end justify-between gap-4"><h2 className="text-3xl font-semibold tracking-[-0.035em]">My tasks</h2><span className="text-xs text-zinc-400">{tasks.length} assigned</span></div>
          {tasks.length ? (
            <section className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              {tasks.map((task) => (
                <Link className="grid gap-3 border-b border-zinc-100 px-5 py-4 transition last:border-0 hover:bg-zinc-50 sm:grid-cols-[100px_1fr_120px_90px] sm:items-center" href={`/dashboard/projects/${task.project.id}`} key={task.id}>
                  <span className="text-xs font-medium text-zinc-400">{task.project.key}-{task.number}</span>
                  <span><span className="block text-sm font-medium text-zinc-800">{task.title}</span><span className="mt-1 block text-[11px] text-zinc-400">{task.project.name}</span></span>
                  <span className="text-xs capitalize text-zinc-500">{task.status.toLowerCase().replace("_", " ")}</span>
                  <span className="text-xs capitalize text-zinc-400">{task.priority.toLowerCase()}</span>
                </Link>
              ))}
            </section>
          ) : (
            <section className="mt-8 grid min-h-96 place-items-center rounded-2xl border border-dashed border-zinc-300 bg-white text-center"><div className="max-w-sm px-6"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-zinc-100 text-zinc-500">✓</span><h3 className="mt-5 text-base font-semibold">No tasks assigned yet</h3><p className="mt-2 text-sm leading-6 text-zinc-400">Assign yourself a task from any project board and it will appear here.</p><Link className="mt-6 inline-block text-sm font-medium text-zinc-700" href="/dashboard/projects">View projects →</Link></div></section>
          )}
        </div>
      </main>
    </AppShell>
  );
}

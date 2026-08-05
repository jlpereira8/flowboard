import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getCurrentWorkspace, verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

const projectStatus = { PLANNED: "Planned", ACTIVE: "Active", PAUSED: "Paused", COMPLETED: "Completed" } as const;

function personName(person: { name: string | null; email: string | null }) {
  return person.name || person.email || "A teammate";
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

function formatDueDate(date: Date) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}

export default async function DashboardPage() {
  const [{ user }, membership] = await Promise.all([verifySession(), getCurrentWorkspace()]);
  if (!membership) redirect("/onboarding");

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const workspaceFilter = { project: { workspaceId: membership.workspace.id } };

  const [projects, activeProjects, openTasks, completedTasks, overdueTasks, memberCount, recentActivities, upcomingTasks] = await Promise.all([
    prisma.project.findMany({
      where: { workspaceId: membership.workspace.id },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { _count: { select: { tasks: true } } },
    }),
    prisma.project.count({ where: { workspaceId: membership.workspace.id, status: "ACTIVE" } }),
    prisma.task.count({ where: { ...workspaceFilter, status: { not: "DONE" } } }),
    prisma.task.count({ where: { ...workspaceFilter, status: "DONE" } }),
    prisma.task.count({ where: { ...workspaceFilter, status: { not: "DONE" }, dueDate: { lt: today } } }),
    prisma.member.count({ where: { workspaceId: membership.workspace.id } }),
    prisma.taskActivity.findMany({
      where: { task: workspaceFilter },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        actor: { select: { name: true, email: true } },
        task: { select: { id: true, number: true, title: true, projectId: true, project: { select: { key: true } } } },
      },
    }),
    prisma.task.findMany({
      where: { ...workspaceFilter, status: { not: "DONE" }, dueDate: { gte: today } },
      orderBy: { dueDate: "asc" },
      take: 5,
      select: {
        id: true,
        number: true,
        title: true,
        dueDate: true,
        projectId: true,
        project: { select: { key: true } },
        assignee: { select: { user: { select: { name: true, email: true } } } },
      },
    }),
  ]);

  const metrics = [
    { label: "Active projects", value: String(activeProjects), detail: `${memberCount} team ${memberCount === 1 ? "member" : "members"}`, tone: "bg-blue-500" },
    { label: "Open tasks", value: String(openTasks), detail: openTasks ? "Across active work" : "Inbox is clear", tone: "bg-amber-500" },
    { label: "Completed tasks", value: String(completedTasks), detail: "All-time completions", tone: "bg-emerald-500" },
    { label: "Overdue", value: String(overdueTasks), detail: overdueTasks ? "Needs attention" : "Nothing overdue", tone: overdueTasks ? "bg-red-500" : "bg-zinc-300" },
  ];

  return (
    <AppShell user={user} workspace={membership.workspace}>
      <main className="px-4 py-7 sm:px-5 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-6xl">
          <div>
            <p className="text-sm text-zinc-500">Good to see you{user.name ? `, ${user.name.split(" ")[0]}` : ""}.</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">Workspace overview</h2>
          </div>

          <section className="mt-7 grid grid-cols-2 gap-3 xl:grid-cols-4">
            {metrics.map((metric) => (
              <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5" key={metric.label}>
                <div className="flex items-center gap-2"><span className={`size-2 rounded-full ${metric.tone}`} /><p className="text-[11px] font-medium text-zinc-500 sm:text-xs">{metric.label}</p></div>
                <p className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">{metric.value}</p>
                <p className="mt-2 truncate text-[10px] text-zinc-400 sm:text-xs">{metric.detail}</p>
              </article>
            ))}
          </section>

          <section className="mt-4 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
            <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-4"><div><h3 className="text-sm font-semibold">Projects</h3><p className="mt-1 text-xs text-zinc-400">Recently updated work</p></div><Link className="text-xs font-medium text-zinc-400 transition hover:text-zinc-700" href="/dashboard/projects">View all</Link></div>
              {projects.length ? (
                <div className="mt-5 divide-y divide-zinc-100">
                  {projects.map((project) => (
                    <Link className="flex items-center justify-between gap-4 py-4 transition hover:opacity-70" href={`/dashboard/projects/${project.id}`} key={project.id}>
                      <div className="min-w-0"><p className="truncate text-sm font-medium">{project.name}</p><p className="mt-1 text-[11px] text-zinc-400">{project.key} · {project._count.tasks} {project._count.tasks === 1 ? "task" : "tasks"}</p></div>
                      <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-medium text-zinc-500">{projectStatus[project.status]}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="grid min-h-64 place-items-center text-center"><div className="max-w-xs"><span className="mx-auto grid size-11 place-items-center rounded-xl bg-zinc-100 text-lg text-zinc-500">+</span><p className="mt-4 text-sm font-medium">No projects yet</p><p className="mt-1 text-xs leading-5 text-zinc-400">Create a project to start organizing milestones and tasks.</p></div></div>
              )}
            </article>

            <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-4"><div><h3 className="text-sm font-semibold">Upcoming</h3><p className="mt-1 text-xs text-zinc-400">Nearest task deadlines</p></div><Link className="text-xs font-medium text-zinc-400 transition hover:text-zinc-700" href="/dashboard/calendar">Calendar</Link></div>
              {upcomingTasks.length ? <div className="mt-5 divide-y divide-zinc-100">{upcomingTasks.map((task) => <Link className="flex items-center gap-3 py-3.5" href={`/dashboard/projects/${task.projectId}/tasks/${task.id}`} key={task.id}><span className="size-2 shrink-0 rounded-full bg-blue-500" /><span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium text-zinc-700">{task.title}</span><span className="mt-1 block truncate text-[10px] text-zinc-400">{task.project.key}-{task.number} · {task.assignee ? personName(task.assignee.user) : "Unassigned"}</span></span><time className="shrink-0 text-[10px] font-medium text-zinc-500">{task.dueDate ? formatDueDate(task.dueDate) : ""}</time></Link>)}</div> : <div className="grid min-h-64 place-items-center px-5 text-center"><div><span className="mx-auto grid size-10 place-items-center rounded-full bg-zinc-100 text-zinc-400">✓</span><p className="mt-4 text-sm font-medium">No upcoming deadlines</p><p className="mt-1 text-xs text-zinc-400">Tasks with due dates will appear here.</p></div></div>}
            </article>
          </section>

          <section className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <div><h3 className="text-sm font-semibold">Recent activity</h3><p className="mt-1 text-xs text-zinc-400">Latest task updates across your workspace</p></div>
            {recentActivities.length ? <ol className="mt-6 grid gap-x-8 gap-y-5 md:grid-cols-2">{recentActivities.map((activity) => <li className="relative pl-5 text-xs before:absolute before:left-0 before:top-1.5 before:size-2 before:rounded-full before:bg-zinc-300" key={activity.id}><Link className="block" href={`/dashboard/projects/${activity.task.projectId}/tasks/${activity.task.id}`}><p className="leading-5 text-zinc-600"><span className="font-medium text-zinc-800">{personName(activity.actor)}</span> {activity.message} <span className="font-medium text-zinc-700">{activity.task.project.key}-{activity.task.number}</span></p><p className="mt-1 truncate text-[10px] text-zinc-400">{activity.task.title} · {formatDateTime(activity.createdAt)}</p></Link></li>)}</ol> : <div className="grid min-h-32 place-items-center text-center text-xs text-zinc-400">Task changes and comments will appear here.</div>}
          </section>
        </div>
      </main>
    </AppShell>
  );
}

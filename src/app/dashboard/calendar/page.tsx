import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import type { Prisma } from "@/generated/prisma/client";
import { getCurrentWorkspace, verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

type CalendarSearchParams = Promise<{
  month?: string | string[];
  project?: string | string[];
  assignee?: string | string[];
  priority?: string | string[];
}>;

type FilterValues = { project?: string; assignee?: string; priority?: string };

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function monthStart(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}-01T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 7) !== value ? null : date;
}

function monthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function addMonths(date: Date, months: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1, 12));
}

function calendarHref(month: string, filters: FilterValues) {
  const query = new URLSearchParams({ month });
  if (filters.project) query.set("project", filters.project);
  if (filters.assignee) query.set("assignee", filters.assignee);
  if (filters.priority) query.set("priority", filters.priority);
  return `/dashboard/calendar?${query.toString()}`;
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}

function taskHref(task: { id: string; project: { id: string } }) {
  return `/dashboard/projects/${task.project.id}/tasks/${task.id}`;
}

const priorityDot = {
  LOW: "bg-zinc-300",
  MEDIUM: "bg-blue-500",
  HIGH: "bg-amber-500",
  URGENT: "bg-red-500",
} as const;

export default async function CalendarPage({ searchParams }: { searchParams: CalendarSearchParams }) {
  const [{ user }, membership, query] = await Promise.all([verifySession(), getCurrentWorkspace(), searchParams]);
  if (!membership) redirect("/onboarding");

  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const selectedMonth = monthStart(firstValue(query.month)) || new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 12));

  const [projects, members] = await Promise.all([
    prisma.project.findMany({
      where: { workspaceId: membership.workspace.id },
      orderBy: { name: "asc" },
      select: { id: true, key: true, name: true },
    }),
    prisma.member.findMany({
      where: { workspaceId: membership.workspace.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, user: { select: { name: true, email: true } } },
    }),
  ]);

  const rawProject = firstValue(query.project);
  const rawAssignee = firstValue(query.assignee);
  const rawPriority = firstValue(query.priority);
  const selectedProject = projects.some((project) => project.id === rawProject) ? rawProject : undefined;
  const selectedAssignee = rawAssignee === "mine"
    ? membership.id
    : members.some((member) => member.id === rawAssignee) ? rawAssignee : undefined;
  const selectedPriority = priorities.includes(rawPriority as (typeof priorities)[number]) ? rawPriority as (typeof priorities)[number] : undefined;
  const firstDayOffset = (selectedMonth.getUTCDay() + 6) % 7;
  const gridStart = addDays(selectedMonth, -firstDayOffset);
  const gridEnd = addDays(gridStart, 42);
  const days = Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));

  const baseWhere: Prisma.TaskWhereInput = {
    project: { workspaceId: membership.workspace.id },
    ...(selectedProject ? { projectId: selectedProject } : {}),
    ...(selectedAssignee ? { assigneeId: selectedAssignee } : {}),
    ...(selectedPriority ? { priority: selectedPriority } : {}),
  };
  const taskSelect = {
    id: true,
    number: true,
    title: true,
    status: true,
    priority: true,
    dueDate: true,
    project: { select: { id: true, key: true, name: true } },
    assignee: { select: { user: { select: { name: true, email: true } } } },
  } satisfies Prisma.TaskSelect;

  const [scheduledTasks, overdueTasks, upcomingTasks] = await Promise.all([
    prisma.task.findMany({
      where: { ...baseWhere, dueDate: { gte: gridStart, lt: gridEnd } },
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }, { createdAt: "asc" }],
      select: taskSelect,
    }),
    prisma.task.findMany({
      where: { ...baseWhere, dueDate: { lt: today }, status: { not: "DONE" } },
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
      take: 6,
      select: taskSelect,
    }),
    prisma.task.findMany({
      where: { ...baseWhere, dueDate: { gte: today }, status: { not: "DONE" } },
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
      take: 8,
      select: taskSelect,
    }),
  ]);

  const tasksByDate = new Map<string, typeof scheduledTasks>();
  for (const task of scheduledTasks) {
    if (!task.dueDate) continue;
    const key = dateKey(task.dueDate);
    tasksByDate.set(key, [...(tasksByDate.get(key) || []), task]);
  }

  const displayFilters: FilterValues = {
    project: selectedProject,
    assignee: rawAssignee === "mine" ? "mine" : selectedAssignee,
    priority: selectedPriority,
  };
  const monthLabel = new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(selectedMonth);
  const currentMonthKey = monthKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 12)));

  return (
    <AppShell action={null} activeItem="calendar" title="Calendar" user={user} workspace={membership.workspace}>
      <main className="px-5 py-8 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-zinc-500">See deadlines and upcoming work across your workspace.</p>
          <div className="mt-1 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div><h2 className="text-3xl font-semibold tracking-[-0.035em]">Calendar</h2><p className="mt-2 text-xs text-zinc-400">{scheduledTasks.length} scheduled in this view</p></div>
            <div className="flex items-center gap-2">
              <Link aria-label="Previous month" className="grid size-10 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-500 transition hover:border-zinc-300" href={calendarHref(monthKey(addMonths(selectedMonth, -1)), displayFilters)}>←</Link>
              <Link className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-medium text-zinc-600 transition hover:border-zinc-300" href={calendarHref(currentMonthKey, displayFilters)}>Today</Link>
              <Link aria-label="Next month" className="grid size-10 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-500 transition hover:border-zinc-300" href={calendarHref(monthKey(addMonths(selectedMonth, 1)), displayFilters)}>→</Link>
            </div>
          </div>

          <form className="mt-7 grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_1fr_1fr_auto]" method="get">
            <input name="month" type="hidden" value={monthKey(selectedMonth)} />
            <label className="text-[11px] font-medium text-zinc-400">Project<select className="mt-1.5 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none focus:border-zinc-400" defaultValue={selectedProject || ""} name="project"><option value="">All projects</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.key} · {project.name}</option>)}</select></label>
            <label className="text-[11px] font-medium text-zinc-400">Assignee<select className="mt-1.5 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none focus:border-zinc-400" defaultValue={rawAssignee === "mine" ? "mine" : selectedAssignee || ""} name="assignee"><option value="">All assignees</option><option value="mine">My tasks</option>{members.map((member) => <option key={member.id} value={member.id}>{member.user.name || member.user.email || "Member"}</option>)}</select></label>
            <label className="text-[11px] font-medium text-zinc-400">Priority<select className="mt-1.5 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm capitalize text-zinc-700 outline-none focus:border-zinc-400" defaultValue={selectedPriority || ""} name="priority"><option value="">All priorities</option>{priorities.map((priority) => <option key={priority} value={priority}>{priority.toLowerCase()}</option>)}</select></label>
            <button className="self-end rounded-xl bg-zinc-950 px-5 py-3 text-xs font-medium text-white" type="submit">Apply filters</button>
          </form>

          <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <header className="flex items-center justify-between border-b border-zinc-100 px-5 py-4"><h3 className="text-base font-semibold">{monthLabel}</h3><div className="flex items-center gap-4 text-[10px] text-zinc-400"><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-red-500" />Urgent</span><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-amber-500" />High</span></div></header>
            <div className="overflow-x-auto">
              <div className="min-w-[840px]">
                <div className="grid grid-cols-7 border-b border-zinc-100 bg-zinc-50/70">{weekDays.map((day) => <div className="px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400" key={day}>{day}</div>)}</div>
                <div className="grid grid-cols-7">
                  {days.map((day) => {
                    const key = dateKey(day);
                    const dayTasks = tasksByDate.get(key) || [];
                    const isCurrentMonth = day.getUTCMonth() === selectedMonth.getUTCMonth();
                    const isToday = key === dateKey(today);
                    return <div className={`min-h-32 border-b border-r border-zinc-100 p-2.5 ${isCurrentMonth ? "bg-white" : "bg-zinc-50/40"}`} key={key}><div className="flex items-center justify-between"><span className={`grid size-7 place-items-center rounded-lg text-xs font-medium ${isToday ? "bg-zinc-950 text-white" : isCurrentMonth ? "text-zinc-700" : "text-zinc-300"}`}>{day.getUTCDate()}</span>{dayTasks.length ? <span className="text-[9px] text-zinc-300">{dayTasks.length}</span> : null}</div><div className="mt-2 space-y-1.5">{dayTasks.slice(0, 3).map((task) => <Link className={`block rounded-lg border border-zinc-100 bg-zinc-50 px-2 py-1.5 transition hover:border-zinc-300 hover:bg-white ${task.status === "DONE" ? "opacity-50" : ""}`} href={taskHref(task)} key={task.id}><span className="flex items-center gap-1.5 text-[9px] font-medium text-zinc-400"><span className={`size-1.5 rounded-full ${priorityDot[task.priority]}`} />{task.project.key}-{task.number}</span><span className={`mt-0.5 block truncate text-[10px] font-medium text-zinc-700 ${task.status === "DONE" ? "line-through" : ""}`}>{task.title}</span></Link>)}{dayTasks.length > 3 ? <p className="px-1 text-[9px] text-zinc-400">+{dayTasks.length - 3} more</p> : null}</div></div>;
                  })}
                </div>
              </div>
            </div>
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <TaskList title="Overdue" description="Open tasks past their due date" tasks={overdueTasks} empty="Nothing overdue. Nice work." tone="overdue" />
            <TaskList title="Upcoming work" description="Your next scheduled deadlines" tasks={upcomingTasks} empty="No upcoming deadlines yet." tone="upcoming" />
          </div>
        </div>
      </main>
    </AppShell>
  );
}

function TaskList({ title, description, tasks, empty, tone }: {
  title: string;
  description: string;
  tasks: Array<{ id: string; number: number; title: string; priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"; dueDate: Date | null; project: { id: string; key: string; name: string }; assignee: { user: { name: string | null; email: string | null } } | null }>;
  empty: string;
  tone: "overdue" | "upcoming";
}) {
  return <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"><header className="border-b border-zinc-100 px-5 py-4"><div className="flex items-center gap-2"><span className={`size-2 rounded-full ${tone === "overdue" ? "bg-red-500" : "bg-blue-500"}`} /><h3 className="text-sm font-semibold">{title}</h3></div><p className="mt-1 text-[11px] text-zinc-400">{description}</p></header>{tasks.length ? <div>{tasks.map((task) => <Link className="flex items-center gap-3 border-b border-zinc-100 px-5 py-3.5 transition last:border-0 hover:bg-zinc-50" href={taskHref(task)} key={task.id}><span className={`size-2 shrink-0 rounded-full ${priorityDot[task.priority]}`} /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-zinc-700">{task.title}</span><span className="mt-0.5 block text-[10px] text-zinc-400">{task.project.key}-{task.number} · {task.assignee?.user.name || task.assignee?.user.email || "Unassigned"}</span></span><span className={`shrink-0 text-[11px] font-medium ${tone === "overdue" ? "text-red-600" : "text-zinc-500"}`}>{task.dueDate ? formatShortDate(task.dueDate) : ""}</span></Link>)}</div> : <div className="grid min-h-36 place-items-center px-6 text-center text-sm text-zinc-400">{empty}</div>}</section>;
}

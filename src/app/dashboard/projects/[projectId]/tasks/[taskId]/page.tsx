import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getCurrentWorkspace, verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

import { CommentForm } from "./comment-form";
import { AttachmentManager } from "./attachment-manager";
import { LabelManager } from "./label-manager";
import { TaskDetailsForm } from "./task-details-form";

function personName(person: { name: string | null; email: string | null }) {
  return person.name || person.email || "FlowBoard member";
}

function initials(person: { name: string | null; email: string | null }) {
  return personName(person).split(/[\s@]/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

const statusStyle = {
  TODO: "bg-zinc-100 text-zinc-600",
  IN_PROGRESS: "bg-blue-50 text-blue-700",
  REVIEW: "bg-amber-50 text-amber-700",
  DONE: "bg-emerald-50 text-emerald-700",
} as const;

const statusLabel = { TODO: "Todo", IN_PROGRESS: "In progress", REVIEW: "Review", DONE: "Done" } as const;

export default async function TaskPage({ params }: { params: Promise<{ projectId: string; taskId: string }> }) {
  const [{ projectId, taskId }, { user, userId }, membership] = await Promise.all([params, verifySession(), getCurrentWorkspace()]);
  if (!membership) redirect("/onboarding");

  const [task, members, workspaceLabels] = await Promise.all([
    prisma.task.findFirst({
      where: { id: taskId, projectId, project: { workspaceId: membership.workspace.id } },
      include: {
        project: { select: { id: true, key: true, name: true } },
        assignee: { select: { user: { select: { name: true, email: true } } } },
        createdBy: { select: { name: true, email: true } },
        comments: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { name: true, email: true } } },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          include: { actor: { select: { name: true, email: true } } },
        },
        labels: {
          orderBy: { createdAt: "asc" },
          include: { label: { select: { id: true, name: true, color: true } } },
        },
        attachments: {
          orderBy: { createdAt: "desc" },
          include: { uploadedBy: { select: { name: true, email: true } } },
        },
      },
    }),
    prisma.member.findMany({
      where: { workspaceId: membership.workspace.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, user: { select: { name: true, email: true } } },
    }),
    prisma.taskLabel.findMany({
      where: { workspaceId: membership.workspace.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true, color: true },
    }),
  ]);

  if (!task) notFound();
  const identifier = `${task.project.key}-${task.number}`;

  return (
    <AppShell action={null} activeItem="projects" title={identifier} user={user} workspace={membership.workspace}>
      <main className="px-5 py-8 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-6xl">
          <Link className="text-xs font-medium text-zinc-400 transition hover:text-zinc-700" href={`/dashboard/projects/${task.project.id}`}>← {task.project.name}</Link>
          <header className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-semibold text-zinc-400">{identifier}</span>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusStyle[task.status]}`}>{statusLabel[task.status]}</span>
              </div>
              <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.035em]">{task.title}</h2>
            </div>
            <span className="text-xs text-zinc-400">Updated {formatDateTime(task.updatedAt)}</span>
          </header>

          <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-6">
              <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-6"><p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">Task details</p><h3 className="mt-1 text-lg font-semibold">Plan and track the work</h3></div>
                <TaskDetailsForm members={members.map((member) => ({ id: member.id, name: member.user.name || "", email: member.user.email || "" }))} task={{ id: task.id, projectId: task.projectId, title: task.title, description: task.description, status: task.status, priority: task.priority, assigneeId: task.assigneeId, dueDate: task.dueDate?.toISOString().slice(0, 10) || "" }} />
              </section>

              <AttachmentManager
                attachments={task.attachments.map((attachment) => ({
                  id: attachment.id,
                  name: attachment.name,
                  contentType: attachment.contentType,
                  size: attachment.size,
                  createdAt: attachment.createdAt.toISOString(),
                  uploader: personName(attachment.uploadedBy),
                  canDelete: attachment.uploadedById === userId || membership.role === "OWNER" || membership.role === "ADMIN",
                }))}
                projectId={task.projectId}
                taskId={task.id}
              />

              <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">Discussion</p><h3 className="mt-1 text-lg font-semibold">Comments</h3></div><span className="text-xs text-zinc-400">{task.comments.length}</span></div>
                {task.comments.length ? <div className="mt-6 space-y-5">{task.comments.map((comment) => <article className="flex gap-3" key={comment.id}><span className="grid size-8 shrink-0 place-items-center rounded-full bg-zinc-100 text-[10px] font-semibold text-zinc-600">{initials(comment.author)}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-baseline gap-x-2"><span className="text-sm font-medium text-zinc-800">{personName(comment.author)}</span><time className="text-[11px] text-zinc-400">{formatDateTime(comment.createdAt)}</time></div><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-zinc-600">{comment.body}</p></div></article>)}</div> : <p className="mt-5 rounded-xl border border-dashed border-zinc-200 px-4 py-6 text-center text-sm text-zinc-400">No comments yet. Start the conversation below.</p>}
                <CommentForm projectId={task.projectId} taskId={task.id} />
              </section>
            </div>

            <aside className="space-y-6">
              <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold">Overview</h3>
                <dl className="mt-5 space-y-4 text-xs">
                  <div><dt className="text-zinc-400">Assignee</dt><dd className="mt-1.5 font-medium text-zinc-700">{task.assignee ? personName(task.assignee.user) : "Unassigned"}</dd></div>
                  <div><dt className="text-zinc-400">Priority</dt><dd className="mt-1.5 font-medium capitalize text-zinc-700">{task.priority.toLowerCase()}</dd></div>
                  <div><dt className="text-zinc-400">Due date</dt><dd className="mt-1.5 font-medium text-zinc-700">{task.dueDate ? formatDate(task.dueDate) : "No due date"}</dd></div>
                  <div><dt className="text-zinc-400">Created by</dt><dd className="mt-1.5 font-medium text-zinc-700">{personName(task.createdBy)}</dd></div>
                  <div><dt className="text-zinc-400">Created</dt><dd className="mt-1.5 font-medium text-zinc-700">{formatDate(task.createdAt)}</dd></div>
                </dl>
              </section>

              <LabelManager
                assigned={task.labels.map(({ label }) => label)}
                available={workspaceLabels}
                canCreate={membership.role === "OWNER" || membership.role === "ADMIN"}
                projectId={task.projectId}
                taskId={task.id}
              />

              <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Activity</h3><span className="text-[11px] text-zinc-400">{task.activities.length}</span></div>
                {task.activities.length ? <ol className="mt-5 space-y-5">{task.activities.map((activity) => <li className="relative pl-5 text-xs before:absolute before:left-0 before:top-1.5 before:size-2 before:rounded-full before:bg-zinc-300" key={activity.id}><p className="leading-5 text-zinc-600"><span className="font-medium text-zinc-800">{personName(activity.actor)}</span> {activity.message}</p><time className="mt-1 block text-[10px] text-zinc-400">{formatDateTime(activity.createdAt)}</time></li>)}</ol> : <p className="mt-5 text-xs leading-5 text-zinc-400">New changes and comments will appear here.</p>}
              </section>
            </aside>
          </div>
        </div>
      </main>
    </AppShell>
  );
}

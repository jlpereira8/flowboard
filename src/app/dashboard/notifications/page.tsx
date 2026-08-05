import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getCurrentWorkspace, verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

import { markAllNotificationsRead, markNotificationRead } from "./actions";

const notificationTone = {
  TASK_ASSIGNED: "bg-blue-500",
  COMMENT_ADDED: "bg-violet-500",
  STATUS_CHANGED: "bg-emerald-500",
} as const;

function personName(person: { name: string | null; email: string | null } | null) {
  return person?.name || person?.email || "A teammate";
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default async function NotificationsPage() {
  const [{ userId, user }, membership] = await Promise.all([verifySession(), getCurrentWorkspace()]);
  if (!membership) redirect("/onboarding");

  const notifications = await prisma.notification.findMany({
    where: { recipientId: userId, workspaceId: membership.workspace.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { actor: { select: { name: true, email: true } } },
  });
  const unreadCount = notifications.filter((notification) => !notification.readAt).length;

  return (
    <AppShell action={null} activeItem="notifications" title="Notifications" user={user} workspace={membership.workspace}>
      <main className="px-5 py-8 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-zinc-500">Assignments, comments, and important task movement.</p>
              <h2 className="mt-1 text-3xl font-semibold tracking-[-0.035em]">Inbox</h2>
            </div>
            {unreadCount ? (
              <form action={markAllNotificationsRead}>
                <button className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-600 shadow-sm transition hover:bg-zinc-50" type="submit">
                  Mark all as read
                </button>
              </form>
            ) : null}
          </div>

          <section className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <header className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold">Recent notifications</h3>
                <p className="mt-1 text-[11px] text-zinc-400">The latest 50 updates for this workspace</p>
              </div>
              <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-medium text-zinc-500">{unreadCount} unread</span>
            </header>

            {notifications.length ? (
              <div className="divide-y divide-zinc-100">
                {notifications.map((notification) => (
                  <article className={`flex gap-4 px-5 py-5 ${notification.readAt ? "bg-white" : "bg-zinc-50/70"}`} key={notification.id}>
                    <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${notificationTone[notification.type]}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <Link className="text-sm font-semibold text-zinc-800 transition hover:text-zinc-500" href={notification.href}>{notification.title}</Link>
                        <time className="text-[10px] text-zinc-400">{formatDateTime(notification.createdAt)}</time>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-zinc-500"><span className="font-medium text-zinc-700">{personName(notification.actor)}</span> {notification.message}</p>
                    </div>
                    {!notification.readAt ? (
                      <form action={markNotificationRead} className="shrink-0">
                        <input name="notificationId" type="hidden" value={notification.id} />
                        <button className="rounded-lg px-2 py-1 text-[10px] font-medium text-zinc-400 transition hover:bg-white hover:text-zinc-700" type="submit">Mark read</button>
                      </form>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <div className="grid min-h-72 place-items-center px-6 text-center">
                <div className="max-w-sm">
                  <span className="mx-auto grid size-11 place-items-center rounded-full bg-zinc-100 text-lg text-zinc-400">✓</span>
                  <p className="mt-4 text-sm font-medium">You’re all caught up</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-400">Task assignments, comments, and status changes will appear here.</p>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </AppShell>
  );
}

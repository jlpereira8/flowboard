import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getCurrentWorkspace, verifySession } from "@/lib/dal";

export default async function CalendarPage() {
  const [{ user }, membership] = await Promise.all([verifySession(), getCurrentWorkspace()]);
  if (!membership) redirect("/onboarding");

  return <AppShell action={null} activeItem="calendar" title="Calendar" user={user} workspace={membership.workspace}><main className="px-5 py-8 lg:px-8 lg:py-10"><div className="mx-auto max-w-6xl"><p className="text-sm text-zinc-500">See deadlines and milestones in one place.</p><h2 className="mt-1 text-3xl font-semibold tracking-[-0.035em]">Calendar</h2><section className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"><div className="border-b border-zinc-100 px-6 py-4"><h3 className="text-sm font-semibold">Upcoming work</h3></div><div className="grid min-h-80 place-items-center p-8 text-center"><div className="max-w-sm"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-zinc-100 text-zinc-500">□</span><h3 className="mt-5 text-base font-semibold">No dates scheduled</h3><p className="mt-2 text-sm leading-6 text-zinc-400">Task due dates and project milestones will populate this view in a later phase.</p></div></div></section></div></main></AppShell>;
}

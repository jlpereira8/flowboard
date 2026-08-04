import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getCurrentWorkspace, verifySession } from "@/lib/dal";

export default async function TasksPage() {
  const [{ user }, membership] = await Promise.all([verifySession(), getCurrentWorkspace()]);
  if (!membership) redirect("/onboarding");

  return <AppShell action={null} activeItem="tasks" title="My tasks" user={user} workspace={membership.workspace}><main className="px-5 py-8 lg:px-8 lg:py-10"><div className="mx-auto max-w-6xl"><p className="text-sm text-zinc-500">A focused view of work assigned to you.</p><h2 className="mt-1 text-3xl font-semibold tracking-[-0.035em]">My tasks</h2><section className="mt-8 grid min-h-96 place-items-center rounded-2xl border border-dashed border-zinc-300 bg-white text-center"><div className="max-w-sm px-6"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-zinc-100 text-zinc-500">✓</span><h3 className="mt-5 text-base font-semibold">No tasks assigned yet</h3><p className="mt-2 text-sm leading-6 text-zinc-400">Tasks will appear here when the Kanban workflow is added in Phase 3.</p><Link className="mt-6 inline-block text-sm font-medium text-zinc-700" href="/dashboard/projects">View projects →</Link></div></section></div></main></AppShell>;
}

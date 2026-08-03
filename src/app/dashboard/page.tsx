import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getCurrentWorkspace, verifySession } from "@/lib/dal";

const metrics = [
  { label: "Active projects", value: "0", detail: "Create your first project" },
  { label: "Open tasks", value: "0", detail: "Nothing assigned yet" },
  { label: "Completed", value: "0", detail: "This month" },
  { label: "Team members", value: "1", detail: "Workspace owner" },
];

export default async function DashboardPage() {
  const [{ user }, membership] = await Promise.all([verifySession(), getCurrentWorkspace()]);

  if (!membership) {
    redirect("/onboarding");
  }

  return (
    <AppShell user={user} workspace={membership.workspace}>
      <main className="px-5 py-8 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-6xl">
          <div>
            <p className="text-sm text-zinc-500">Good to see you{user.name ? `, ${user.name.split(" ")[0]}` : ""}.</p>
            <h2 className="mt-1 text-3xl font-semibold tracking-[-0.035em]">Workspace overview</h2>
          </div>

          <section className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm" key={metric.label}>
                <p className="text-xs font-medium text-zinc-500">{metric.label}</p>
                <p className="mt-4 text-3xl font-semibold tracking-tight">{metric.value}</p>
                <p className="mt-2 text-xs text-zinc-400">{metric.detail}</p>
              </article>
            ))}
          </section>

          <section className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
            <article className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Projects</h3>
                  <p className="mt-1 text-xs text-zinc-400">Your team’s active work</p>
                </div>
              </div>
              <div className="grid min-h-64 place-items-center text-center">
                <div className="max-w-xs">
                  <span className="mx-auto grid size-11 place-items-center rounded-xl bg-zinc-100 text-lg text-zinc-500">+</span>
                  <p className="mt-4 text-sm font-medium">No projects yet</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-400">Create a project to start organizing milestones and tasks.</p>
                </div>
              </div>
            </article>

            <article className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold">Recent activity</h3>
              <p className="mt-1 text-xs text-zinc-400">Updates from your workspace</p>
              <div className="mt-8 flex gap-3">
                <span className="mt-0.5 size-2 rounded-full bg-emerald-500" />
                <div>
                  <p className="text-xs font-medium">Workspace created</p>
                  <p className="mt-1 text-[11px] text-zinc-400">Your FlowBoard is ready.</p>
                </div>
              </div>
            </article>
          </section>
        </div>
      </main>
    </AppShell>
  );
}

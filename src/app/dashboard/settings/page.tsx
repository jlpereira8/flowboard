import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getCurrentWorkspace, verifySession } from "@/lib/dal";

import { AppearanceSettings, NotificationSettings, ProfileSettings, WorkspaceSettings } from "./settings-forms";

function Section({ children, description, title }: { children: React.ReactNode; description: string; title: string }) {
  return <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm"><header className="border-b border-zinc-100 px-6 py-5"><h3 className="text-sm font-semibold">{title}</h3><p className="mt-1 text-xs text-zinc-400">{description}</p></header><div className="p-6">{children}</div></section>;
}

export default async function SettingsPage() {
  const [{ user }, membership] = await Promise.all([verifySession(), getCurrentWorkspace()]);
  if (!membership) redirect("/onboarding");

  return <AppShell action={null} activeItem="settings" title="Settings" user={user} workspace={membership.workspace}><main className="px-5 py-8 lg:px-8 lg:py-10"><div className="mx-auto max-w-4xl"><div><p className="text-sm text-zinc-500">Manage your account and workspace experience.</p><h2 className="mt-1 text-3xl font-semibold tracking-[-0.035em]">Settings</h2></div><div className="mt-8 space-y-5"><Section description="Update how your name appears across FlowBoard." title="Profile"><ProfileSettings email={user.email || ""} name={user.name || ""} /></Section><Section description="Keep your workspace identity current." title="Workspace"><WorkspaceSettings canManage={membership.role === "OWNER" || membership.role === "ADMIN"} name={membership.workspace.name} slug={membership.workspace.slug} /></Section><Section description="Choose which task events should reach your inbox." title="Notifications"><NotificationSettings preferences={{ notifyTaskAssigned: membership.notifyTaskAssigned, notifyComments: membership.notifyComments, notifyStatusChanges: membership.notifyStatusChanges }} /></Section><Section description="Choose the visual mode used across your dashboard." title="Appearance"><AppearanceSettings theme={membership.theme} /></Section></div></div></main></AppShell>;
}

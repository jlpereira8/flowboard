import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getCurrentWorkspace, verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

import { TeamEditForm } from "./team-edit-form";

export default async function EditTeamPage({ params }: { params: Promise<{ teamId: string }> }) {
  const [{ teamId }, { user }, membership] = await Promise.all([params, verifySession(), getCurrentWorkspace()]);
  if (!membership) redirect("/onboarding");
  if (membership.role !== "OWNER" && membership.role !== "ADMIN") redirect("/dashboard/teams");
  const team = await prisma.team.findFirst({ where: { id: teamId, workspaceId: membership.workspace.id }, select: { id: true, name: true, key: true, description: true } });
  if (!team) notFound();
  return <AppShell action={null} activeItem="teams" title="Edit team" user={user} workspace={membership.workspace}><main className="px-5 py-8 lg:px-8 lg:py-10"><div className="mx-auto max-w-xl"><p className="text-sm text-zinc-500">Keep team ownership clear and current.</p><h2 className="mt-1 text-3xl font-semibold tracking-[-0.035em]">Edit {team.name}</h2><section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8"><TeamEditForm team={team} /></section></div></main></AppShell>;
}

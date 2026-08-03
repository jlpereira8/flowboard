import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getCurrentWorkspace, verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

import { updateMemberRole } from "./actions";
import { InvitationForm } from "./invitation-form";

export default async function MembersPage() {
  const [{ user }, membership] = await Promise.all([verifySession(), getCurrentWorkspace()]);
  if (!membership) redirect("/onboarding");

  const [members, invitations] = await Promise.all([
    prisma.member.findMany({
      where: { workspaceId: membership.workspace.id },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      select: { id: true, role: true, user: { select: { name: true, email: true } }, _count: { select: { teams: true } } },
    }),
    prisma.workspaceInvitation.findMany({
      where: { workspaceId: membership.workspace.id, acceptedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, role: true, expiresAt: true },
    }),
  ]);

  const canInvite = membership.role === "OWNER" || membership.role === "ADMIN";

  return (
    <AppShell action={null} activeItem="members" title="Members" user={user} workspace={membership.workspace}>
      <main className="px-5 py-8 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-zinc-500">Manage access and workspace responsibilities.</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-[-0.035em]">Members</h2>
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
            <div className="space-y-6">
              <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                <div className="border-b border-zinc-100 px-5 py-4"><h3 className="text-sm font-semibold">Workspace members</h3><p className="mt-1 text-xs text-zinc-400">{members.length} people have access</p></div>
                <div className="divide-y divide-zinc-100">
                  {members.map((member) => {
                    const initials = (member.user.name || member.user.email || "FB").split(/[\s@]/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
                    return <div className="flex flex-col justify-between gap-4 px-5 py-4 sm:flex-row sm:items-center" key={member.id}>
                      <div className="flex min-w-0 items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-zinc-100 text-[10px] font-semibold text-zinc-600">{initials}</span><div className="min-w-0"><p className="truncate text-sm font-medium">{member.user.name || "FlowBoard user"}</p><p className="truncate text-xs text-zinc-400">{member.user.email} · {member._count.teams} teams</p></div></div>
                      {membership.role === "OWNER" && member.role !== "OWNER" ? <form action={updateMemberRole} className="flex gap-2"><input name="memberId" type="hidden" value={member.id} /><select className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs" defaultValue={member.role} name="role"><option value="MEMBER">Member</option><option value="ADMIN">Admin</option></select><button className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600" type="submit">Save</button></form> : <span className="w-fit rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-medium capitalize text-zinc-500">{member.role.toLowerCase()}</span>}
                    </div>;
                  })}
                </div>
              </section>
              {invitations.length ? <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"><h3 className="text-sm font-semibold">Pending invitations</h3><div className="mt-4 divide-y divide-zinc-100">{invitations.map((invitation) => <div className="flex items-center justify-between gap-4 py-3 text-xs" key={invitation.id}><div><p className="font-medium">{invitation.email}</p><p className="mt-1 text-zinc-400">Expires {invitation.expiresAt.toLocaleDateString("en", { dateStyle: "medium" })}</p></div><span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-medium capitalize text-amber-700">{invitation.role.toLowerCase()}</span></div>)}</div></section> : null}
            </div>
            {canInvite ? <InvitationForm canInviteAdmins={membership.role === "OWNER"} /> : null}
          </div>
        </div>
      </main>
    </AppShell>
  );
}

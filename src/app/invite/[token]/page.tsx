import { createHash } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import { acceptInvitation, signInForInvitation } from "./actions";

export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{40,128}$/.test(token)) notFound();

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const [session, invitation] = await Promise.all([
    auth(),
    prisma.workspaceInvitation.findUnique({
      where: { tokenHash },
      select: { email: true, role: true, expiresAt: true, acceptedAt: true, workspace: { select: { name: true } } },
    }),
  ]);

  if (!invitation) notFound();
  const expired = invitation.expiresAt <= new Date();
  const emailMatches = session?.user?.email?.toLowerCase() === invitation.email.toLowerCase();

  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f7f5] px-6 py-12">
      <section className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-[0_24px_70px_-36px_rgba(24,24,27,0.45)]">
        <span className="mx-auto grid size-11 place-items-center rounded-xl bg-zinc-950 text-sm font-semibold text-white">F</span>
        {invitation.acceptedAt ? <><h1 className="mt-6 text-2xl font-semibold">Invitation accepted</h1><p className="mt-3 text-sm leading-6 text-zinc-500">You already have access to {invitation.workspace.name}.</p><Link className="mt-6 inline-block rounded-xl bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white" href="/dashboard">Open dashboard</Link></> : expired ? <><h1 className="mt-6 text-2xl font-semibold">Invitation expired</h1><p className="mt-3 text-sm leading-6 text-zinc-500">Ask a workspace admin to create a fresh invitation.</p></> : <>
          <p className="mt-6 text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">Workspace invitation</p>
          <h1 className="mt-3 text-2xl font-semibold">Join {invitation.workspace.name}</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500">You were invited as {invitation.role.toLowerCase()} using <span className="font-medium text-zinc-700">{invitation.email}</span>.</p>
          {!session?.user ? <form action={signInForInvitation} className="mt-7"><input name="token" type="hidden" value={token} /><button className="w-full rounded-xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white" type="submit">Continue with GitHub</button></form> : !emailMatches ? <div className="mt-7 rounded-xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">Sign in with the GitHub account that uses {invitation.email}.</div> : <form action={acceptInvitation} className="mt-7"><input name="token" type="hidden" value={token} /><button className="w-full rounded-xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white" type="submit">Accept invitation</button></form>}
        </>}
      </section>
    </main>
  );
}

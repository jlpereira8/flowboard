"use client";

import { useActionState, useState } from "react";

import { createInvitation, type InvitationState } from "./actions";

const initialState: InvitationState = {};

export function InvitationForm({ canInviteAdmins }: { canInviteAdmins: boolean }) {
  const [state, action, pending] = useActionState(createInvitation, initialState);
  const [copied, setCopied] = useState(false);
  const invitePath = state.invitePath ?? "";

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div><h3 className="text-sm font-semibold">Invite a member</h3><p className="mt-1 text-xs leading-5 text-zinc-400">Links expire after seven days and only work for the invited email.</p></div>
      {state.error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{state.error}</p> : null}
      {invitePath ? (
        <div className="rounded-xl bg-emerald-50 p-3">
          <p className="text-xs font-medium text-emerald-800">Invite ready for {state.invitedEmail}</p>
          <div className="mt-2 flex gap-2"><input className="min-w-0 flex-1 rounded-lg border border-emerald-200 bg-white px-2.5 py-2 text-[11px] text-zinc-500" readOnly value={invitePath} /><button className="rounded-lg bg-emerald-700 px-3 text-xs font-medium text-white" onClick={async () => { await navigator.clipboard.writeText(`${window.location.origin}${invitePath}`); setCopied(true); }} type="button">{copied ? "Copied" : "Copy link"}</button></div>
        </div>
      ) : null}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-zinc-600" htmlFor="invite-email">Email address</label>
        <input autoComplete="email" className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100" id="invite-email" name="email" placeholder="teammate@example.com" required type="email" />
        {state.fieldErrors?.email ? <p className="mt-1.5 text-xs text-red-600">{state.fieldErrors.email}</p> : null}
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-zinc-600" htmlFor="invite-role">Role</label>
        <select className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100" defaultValue="MEMBER" id="invite-role" name="role"><option value="MEMBER">Member</option>{canInviteAdmins ? <option value="ADMIN">Admin</option> : null}</select>
        {state.fieldErrors?.role ? <p className="mt-1.5 text-xs text-red-600">{state.fieldErrors.role}</p> : null}
      </div>
      <button className="w-full rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60" disabled={pending} type="submit">{pending ? "Creating invite…" : "Create invite link"}</button>
    </form>
  );
}

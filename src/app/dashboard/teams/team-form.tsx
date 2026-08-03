"use client";

import { useActionState } from "react";

import { createTeam, type TeamFormState } from "./actions";

const initialState: TeamFormState = {};

export function TeamForm() {
  const [state, action, pending] = useActionState(createTeam, initialState);

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div>
        <h3 className="text-sm font-semibold">Create a team</h3>
        <p className="mt-1 text-xs text-zinc-400">Group members around a product area or discipline.</p>
      </div>
      {state.error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{state.error}</p> : null}
      {state.success ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{state.success}</p> : null}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-zinc-600" htmlFor="team-name">Team name</label>
        <input className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100" id="team-name" maxLength={60} name="name" placeholder="Product Engineering" required />
        {state.fieldErrors?.name ? <p className="mt-1.5 text-xs text-red-600">{state.fieldErrors.name}</p> : null}
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-zinc-600" htmlFor="team-key">Team key</label>
        <input className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm uppercase outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100" id="team-key" maxLength={6} name="key" placeholder="ENG" required />
        {state.fieldErrors?.key ? <p className="mt-1.5 text-xs text-red-600">{state.fieldErrors.key}</p> : null}
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-zinc-600" htmlFor="team-description">Description <span className="font-normal text-zinc-400">optional</span></label>
        <textarea className="min-h-20 w-full resize-none rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100" id="team-description" maxLength={180} name="description" placeholder="What does this team own?" />
        {state.fieldErrors?.description ? <p className="mt-1.5 text-xs text-red-600">{state.fieldErrors.description}</p> : null}
      </div>
      <button className="w-full rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60" disabled={pending} type="submit">{pending ? "Creating…" : "Create team"}</button>
    </form>
  );
}

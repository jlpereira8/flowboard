"use client";

import Link from "next/link";
import { useActionState } from "react";

import { updateTeam, type TeamFormState } from "../../actions";

const initialState: TeamFormState = {};

export function TeamEditForm({ team }: { team: { id: string; name: string; key: string; description: string | null } }) {
  const [state, action, pending] = useActionState(updateTeam, initialState);
  return <form action={action} className="space-y-5"><input name="teamId" type="hidden" value={team.id} />{state.error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-xs text-red-700">{state.error}</p> : null}<div><label className="mb-2 block text-sm font-medium text-zinc-700" htmlFor="edit-team-name">Team name</label><input className="h-11 w-full rounded-xl border border-zinc-200 px-3.5 text-sm outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100" defaultValue={team.name} id="edit-team-name" maxLength={60} name="name" required />{state.fieldErrors?.name ? <p className="mt-2 text-xs text-red-600">{state.fieldErrors.name}</p> : null}</div><div><label className="mb-2 block text-sm font-medium text-zinc-700" htmlFor="edit-team-key">Team key</label><input className="h-11 w-full rounded-xl border border-zinc-200 px-3.5 text-sm uppercase outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100" defaultValue={team.key} id="edit-team-key" maxLength={6} name="key" required />{state.fieldErrors?.key ? <p className="mt-2 text-xs text-red-600">{state.fieldErrors.key}</p> : null}</div><div><label className="mb-2 block text-sm font-medium text-zinc-700" htmlFor="edit-team-description">Description</label><textarea className="min-h-24 w-full resize-none rounded-xl border border-zinc-200 px-3.5 py-3 text-sm outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100" defaultValue={team.description || ""} id="edit-team-description" maxLength={180} name="description" />{state.fieldErrors?.description ? <p className="mt-2 text-xs text-red-600">{state.fieldErrors.description}</p> : null}</div><div className="flex justify-end gap-3"><Link className="rounded-xl px-4 py-2.5 text-sm text-zinc-500 hover:bg-zinc-100" href="/dashboard/teams">Cancel</Link><button className="rounded-xl bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60" disabled={pending} type="submit">{pending ? "Saving…" : "Save changes"}</button></div></form>;
}

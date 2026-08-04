"use client";

import Link from "next/link";
import { useActionState } from "react";

import { updateProject, type ProjectFormState } from "../../actions";

const initialState: ProjectFormState = {};

type ProjectEditFormProps = {
  project: { id: string; name: string; key: string; description: string | null; status: "PLANNED" | "ACTIVE" | "PAUSED" | "COMPLETED"; teamId: string | null };
  teams: Array<{ id: string; name: string }>;
};

export function ProjectEditForm({ project, teams }: ProjectEditFormProps) {
  const [state, action, pending] = useActionState(updateProject, initialState);

  return (
    <form action={action} className="space-y-5">
      <input name="projectId" type="hidden" value={project.id} />
      {state.error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-xs text-red-700">{state.error}</p> : null}
      <div className="grid gap-5 sm:grid-cols-[1fr_140px]">
        <div><label className="mb-2 block text-sm font-medium text-zinc-700" htmlFor="project-name">Project name</label><input className="h-11 w-full rounded-xl border border-zinc-200 px-3.5 text-sm outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100" defaultValue={project.name} id="project-name" maxLength={80} name="name" required />{state.fieldErrors?.name ? <p className="mt-2 text-xs text-red-600">{state.fieldErrors.name}</p> : null}</div>
        <div><label className="mb-2 block text-sm font-medium text-zinc-700" htmlFor="project-key">Key</label><input className="h-11 w-full rounded-xl border border-zinc-200 px-3.5 text-sm uppercase outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100" defaultValue={project.key} id="project-key" maxLength={6} name="key" required />{state.fieldErrors?.key ? <p className="mt-2 text-xs text-red-600">{state.fieldErrors.key}</p> : null}</div>
      </div>
      <div><label className="mb-2 block text-sm font-medium text-zinc-700" htmlFor="project-description">Description</label><textarea className="min-h-28 w-full resize-none rounded-xl border border-zinc-200 px-3.5 py-3 text-sm outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100" defaultValue={project.description || ""} id="project-description" maxLength={240} name="description" />{state.fieldErrors?.description ? <p className="mt-2 text-xs text-red-600">{state.fieldErrors.description}</p> : null}</div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div><label className="mb-2 block text-sm font-medium text-zinc-700" htmlFor="project-status">Status</label><select className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100" defaultValue={project.status} id="project-status" name="status"><option value="PLANNED">Planned</option><option value="ACTIVE">Active</option><option value="PAUSED">Paused</option><option value="COMPLETED">Completed</option></select></div>
        <div><label className="mb-2 block text-sm font-medium text-zinc-700" htmlFor="project-team">Team</label><select className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100" defaultValue={project.teamId || ""} id="project-team" name="teamId"><option value="">No team</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select>{state.fieldErrors?.teamId ? <p className="mt-2 text-xs text-red-600">{state.fieldErrors.teamId}</p> : null}</div>
      </div>
      <div className="flex justify-end gap-3 pt-2"><Link className="rounded-xl px-4 py-2.5 text-sm text-zinc-500 hover:bg-zinc-100" href={`/dashboard/projects/${project.id}`}>Cancel</Link><button className="rounded-xl bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60" disabled={pending} type="submit">{pending ? "Saving…" : "Save changes"}</button></div>
    </form>
  );
}

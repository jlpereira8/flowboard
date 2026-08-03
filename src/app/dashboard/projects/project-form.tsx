"use client";

import Link from "next/link";
import { useActionState } from "react";

import { createProject, type ProjectFormState } from "./actions";

const initialState: ProjectFormState = {};

export function ProjectForm() {
  const [state, action, pending] = useActionState(createProject, initialState);

  return (
    <form action={action} className="space-y-5">
      {state.error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-xs text-red-700">{state.error}</p> : null}

      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-700" htmlFor="name">Project name</label>
        <input aria-invalid={Boolean(state.fieldErrors?.name)} autoFocus className="h-11 w-full rounded-xl border border-zinc-200 px-3.5 text-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100" id="name" maxLength={80} name="name" placeholder="Product launch" required />
        {state.fieldErrors?.name ? <p className="mt-2 text-xs text-red-600">{state.fieldErrors.name}</p> : null}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-700" htmlFor="key">Project key</label>
        <input aria-invalid={Boolean(state.fieldErrors?.key)} autoCapitalize="characters" className="h-11 w-full rounded-xl border border-zinc-200 px-3.5 text-sm uppercase outline-none transition placeholder:normal-case focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100" id="key" maxLength={6} name="key" placeholder="WEB" required />
        <p className="mt-2 text-xs text-zinc-400">Used for task IDs, such as WEB-12.</p>
        {state.fieldErrors?.key ? <p className="mt-2 text-xs text-red-600">{state.fieldErrors.key}</p> : null}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-700" htmlFor="description">Description <span className="font-normal text-zinc-400">optional</span></label>
        <textarea aria-invalid={Boolean(state.fieldErrors?.description)} className="min-h-28 w-full resize-none rounded-xl border border-zinc-200 px-3.5 py-3 text-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100" id="description" maxLength={240} name="description" placeholder="What is this project responsible for?" />
        {state.fieldErrors?.description ? <p className="mt-2 text-xs text-red-600">{state.fieldErrors.description}</p> : null}
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Link className="rounded-xl px-4 py-2.5 text-sm text-zinc-500 transition hover:bg-zinc-100" href="/dashboard/projects">Cancel</Link>
        <button className="rounded-xl bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60" disabled={pending} type="submit">
          {pending ? "Creating…" : "Create project"}
        </button>
      </div>
    </form>
  );
}

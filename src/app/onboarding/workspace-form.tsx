"use client";

import { useActionState } from "react";

import { createWorkspace, type OnboardingState } from "./actions";

const initialState: OnboardingState = {};

export function WorkspaceForm() {
  const [state, action, pending] = useActionState(createWorkspace, initialState);

  return (
    <form action={action} className="mt-7 space-y-5">
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-700" htmlFor="name">
          Workspace name
        </label>
        <input
          aria-describedby={state.error ? "workspace-error" : undefined}
          aria-invalid={Boolean(state.error)}
          autoComplete="organization"
          autoFocus
          className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
          id="name"
          maxLength={60}
          name="name"
          placeholder="Acme Engineering"
          required
        />
        {state.error ? (
          <p className="mt-2 text-xs text-red-600" id="workspace-error">
            {state.error}
          </p>
        ) : null}
      </div>

      <button className="w-full rounded-xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60" disabled={pending} type="submit">
        {pending ? "Creating workspace…" : "Create workspace"}
      </button>
    </form>
  );
}

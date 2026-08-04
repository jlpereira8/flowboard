"use client";

import { useActionState, useEffect, useRef } from "react";

import { createTask, type TaskFormState } from "./task-actions";

const initialState: TaskFormState = {};

type NewTaskFormProps = {
  projectId: string;
  members: Array<{ id: string; name: string; email: string }>;
};

export function NewTaskForm({ projectId, members }: NewTaskFormProps) {
  const [state, action, pending] = useActionState(createTask, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <details className="group rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-semibold">
        Create task
        <span className="grid size-7 place-items-center rounded-lg bg-zinc-100 text-zinc-500 transition group-open:rotate-45">+</span>
      </summary>
      <form action={action} className="grid gap-4 border-t border-zinc-100 p-5 md:grid-cols-2" ref={formRef}>
        <input name="projectId" type="hidden" value={projectId} />
        {state.error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-xs text-red-700 md:col-span-2">{state.error}</p> : null}
        {state.success ? <p className="rounded-xl bg-emerald-50 px-4 py-3 text-xs text-emerald-700 md:col-span-2">Task created.</p> : null}
        <label className="text-xs font-medium text-zinc-600 md:col-span-2">
          Title
          <input aria-invalid={Boolean(state.fieldErrors?.title)} className="mt-2 h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100" maxLength={120} name="title" placeholder="Ship the onboarding flow" required />
          {state.fieldErrors?.title ? <span className="mt-1 block text-red-600">{state.fieldErrors.title}</span> : null}
        </label>
        <label className="text-xs font-medium text-zinc-600 md:col-span-2">
          Description <span className="font-normal text-zinc-400">optional</span>
          <textarea aria-invalid={Boolean(state.fieldErrors?.description)} className="mt-2 min-h-20 w-full resize-none rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100" maxLength={500} name="description" placeholder="Add context or acceptance criteria." />
        </label>
        <label className="text-xs font-medium text-zinc-600">
          Priority
          <select className="mt-2 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400" defaultValue="MEDIUM" name="priority">
            <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option>
          </select>
        </label>
        <label className="text-xs font-medium text-zinc-600">
          Assignee
          <select className="mt-2 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400" defaultValue="" name="assigneeId">
            <option value="">Unassigned</option>
            {members.map((member) => <option key={member.id} value={member.id}>{member.name || member.email}</option>)}
          </select>
        </label>
        <div className="flex justify-end md:col-span-2">
          <button className="rounded-xl bg-zinc-950 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60" disabled={pending} type="submit">{pending ? "Creating…" : "Create task"}</button>
        </div>
      </form>
    </details>
  );
}

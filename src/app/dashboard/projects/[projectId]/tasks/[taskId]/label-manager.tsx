"use client";

import { useActionState, useEffect, useRef } from "react";

import { TaskLabelPill, type TaskLabelColor } from "@/components/tasks/task-label";

import { createTaskLabel, type LabelState, updateTaskLabel } from "./actions";

type LabelOption = { id: string; name: string; color: TaskLabelColor };

const initialState: LabelState = {};
const colors: Array<{ value: TaskLabelColor; label: string }> = [
  { value: "ZINC", label: "Gray" },
  { value: "BLUE", label: "Blue" },
  { value: "EMERALD", label: "Green" },
  { value: "AMBER", label: "Amber" },
  { value: "RED", label: "Red" },
  { value: "VIOLET", label: "Violet" },
];

export function LabelManager({ assigned, available, canCreate, projectId, taskId }: { assigned: LabelOption[]; available: LabelOption[]; canCreate: boolean; projectId: string; taskId: string }) {
  const [updateState, updateAction, updatePending] = useActionState(updateTaskLabel, initialState);
  const [createState, createAction, createPending] = useActionState(createTaskLabel, initialState);
  const createFormRef = useRef<HTMLFormElement>(null);
  const unassigned = available.filter((label) => !assigned.some((item) => item.id === label.id));

  useEffect(() => {
    if (createState.success) createFormRef.current?.reset();
  }, [createState]);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Labels</h3><span className="text-[11px] text-zinc-400">{assigned.length}</span></div>

      {updateState.error ? <p className="mt-4 rounded-xl bg-red-50 px-3 py-2.5 text-xs text-red-700">{updateState.error}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {assigned.map((label) => (
          <form action={updateAction} key={label.id}>
            <input name="projectId" type="hidden" value={projectId} />
            <input name="taskId" type="hidden" value={taskId} />
            <input name="labelId" type="hidden" value={label.id} />
            <input name="operation" type="hidden" value="remove" />
            <button aria-label={`Remove ${label.name} label`} className="group rounded-md disabled:opacity-50" disabled={updatePending} title="Remove label" type="submit">
              <TaskLabelPill className="transition group-hover:opacity-60" color={label.color} name={`${label.name} ×`} />
            </button>
          </form>
        ))}
        {assigned.length === 0 ? <p className="text-xs leading-5 text-zinc-400">No labels assigned.</p> : null}
      </div>

      {unassigned.length ? (
        <form action={updateAction} className="mt-4 flex gap-2">
          <input name="projectId" type="hidden" value={projectId} />
          <input name="taskId" type="hidden" value={taskId} />
          <input name="operation" type="hidden" value="add" />
          <label className="sr-only" htmlFor="existing-label">Existing label</label>
          <select className="h-9 min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs text-zinc-600 outline-none focus:border-zinc-400" id="existing-label" name="labelId">
            {unassigned.map((label) => <option key={label.id} value={label.id}>{label.name}</option>)}
          </select>
          <button className="rounded-lg border border-zinc-200 px-3 text-xs font-medium text-zinc-600 transition hover:border-zinc-300 disabled:opacity-50" disabled={updatePending} type="submit">{updatePending ? "Saving…" : "Add"}</button>
        </form>
      ) : available.length ? <p className="mt-4 text-[11px] text-zinc-400">All workspace labels are assigned.</p> : null}

      {canCreate ? (
        <form action={createAction} className="mt-5 border-t border-zinc-100 pt-4" ref={createFormRef}>
          <input name="projectId" type="hidden" value={projectId} />
          <input name="taskId" type="hidden" value={taskId} />
          <p className="text-[11px] font-medium text-zinc-500">Create workspace label</p>
          {createState.error ? <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[11px] text-red-700">{createState.error}</p> : null}
          <div className="mt-2 grid grid-cols-[1fr_88px] gap-2">
            <label className="sr-only" htmlFor="new-label-name">Label name</label>
            <input aria-invalid={Boolean(createState.fieldErrors?.name)} className="h-9 min-w-0 rounded-lg border border-zinc-200 px-2.5 text-xs outline-none focus:border-zinc-400" id="new-label-name" maxLength={24} name="name" placeholder="e.g. Frontend" required />
            <label className="sr-only" htmlFor="new-label-color">Label color</label>
            <select className="h-9 rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-600 outline-none focus:border-zinc-400" defaultValue="ZINC" id="new-label-color" name="color">{colors.map((color) => <option key={color.value} value={color.value}>{color.label}</option>)}</select>
          </div>
          {createState.fieldErrors?.name ? <p className="mt-2 text-[11px] text-red-600">{createState.fieldErrors.name}</p> : null}
          <button className="mt-2.5 w-full rounded-lg bg-zinc-950 px-3 py-2 text-xs font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50" disabled={createPending} type="submit">{createPending ? "Creating…" : "Create and add"}</button>
        </form>
      ) : null}
    </section>
  );
}

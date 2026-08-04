"use client";

import { useActionState } from "react";

import { updateTaskDetails, type TaskDetailsState } from "./actions";

type MemberOption = { id: string; name: string; email: string };
type TaskDetails = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  assigneeId: string | null;
  dueDate: string;
};

const initialState: TaskDetailsState = {};

export function TaskDetailsForm({ members, task }: { members: MemberOption[]; task: TaskDetails }) {
  const [state, action, pending] = useActionState(updateTaskDetails, initialState);
  const inputClass = "h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100";

  return (
    <form action={action} className="space-y-6">
      <input name="projectId" type="hidden" value={task.projectId} />
      <input name="taskId" type="hidden" value={task.id} />
      {state.error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-xs text-red-700">{state.error}</p> : null}
      {state.success ? <p className="rounded-xl bg-emerald-50 px-4 py-3 text-xs text-emerald-700">Task saved.</p> : null}

      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-700" htmlFor="task-title">Title</label>
        <input aria-invalid={Boolean(state.fieldErrors?.title)} className={inputClass} defaultValue={task.title} id="task-title" maxLength={120} name="title" required />
        {state.fieldErrors?.title ? <p className="mt-2 text-xs text-red-600">{state.fieldErrors.title}</p> : null}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-700" htmlFor="task-description">Description</label>
        <textarea aria-invalid={Boolean(state.fieldErrors?.description)} className="min-h-44 w-full resize-y rounded-xl border border-zinc-200 px-3.5 py-3 text-sm leading-6 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100" defaultValue={task.description || ""} id="task-description" maxLength={2000} name="description" placeholder="Add context, requirements, or acceptance criteria." />
        {state.fieldErrors?.description ? <p className="mt-2 text-xs text-red-600">{state.fieldErrors.description}</p> : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700" htmlFor="task-status">Status</label>
          <select className={inputClass} defaultValue={task.status} id="task-status" name="status"><option value="TODO">Todo</option><option value="IN_PROGRESS">In progress</option><option value="REVIEW">Review</option><option value="DONE">Done</option></select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700" htmlFor="task-priority">Priority</label>
          <select className={inputClass} defaultValue={task.priority} id="task-priority" name="priority"><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700" htmlFor="task-assignee">Assignee</label>
          <select className={inputClass} defaultValue={task.assigneeId || ""} id="task-assignee" name="assigneeId"><option value="">Unassigned</option>{members.map((member) => <option key={member.id} value={member.id}>{member.name || member.email}</option>)}</select>
          {state.fieldErrors?.assigneeId ? <p className="mt-2 text-xs text-red-600">{state.fieldErrors.assigneeId}</p> : null}
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700" htmlFor="task-due-date">Due date</label>
          <input className={inputClass} defaultValue={task.dueDate} id="task-due-date" name="dueDate" type="date" />
          {state.fieldErrors?.dueDate ? <p className="mt-2 text-xs text-red-600">{state.fieldErrors.dueDate}</p> : null}
        </div>
      </div>

      <div className="flex justify-end">
        <button className="rounded-xl bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60" disabled={pending} type="submit">{pending ? "Saving…" : "Save changes"}</button>
      </div>
    </form>
  );
}

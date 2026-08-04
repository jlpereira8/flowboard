"use client";

import { useActionState, useEffect, useRef } from "react";

import { addTaskComment, type CommentState } from "./actions";

const initialState: CommentState = {};

export function CommentForm({ projectId, taskId }: { projectId: string; taskId: string }) {
  const [state, action, pending] = useActionState(addTaskComment, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <form action={action} className="mt-5" ref={formRef}>
      <input name="projectId" type="hidden" value={projectId} />
      <input name="taskId" type="hidden" value={taskId} />
      {state.error ? <p className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-xs text-red-700">{state.error}</p> : null}
      <label className="sr-only" htmlFor="task-comment">Add a comment</label>
      <textarea aria-invalid={Boolean(state.fieldErrors?.body)} className="min-h-24 w-full resize-y rounded-xl border border-zinc-200 px-3.5 py-3 text-sm leading-6 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100" id="task-comment" maxLength={2000} name="body" placeholder="Share an update or ask a question…" required />
      {state.fieldErrors?.body ? <p className="mt-2 text-xs text-red-600">{state.fieldErrors.body}</p> : null}
      <div className="mt-3 flex justify-end"><button className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-60" disabled={pending} type="submit">{pending ? "Posting…" : "Post comment"}</button></div>
    </form>
  );
}

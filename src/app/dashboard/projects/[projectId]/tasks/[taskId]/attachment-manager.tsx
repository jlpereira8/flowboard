"use client";

import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import { useActionState, useRef, useState } from "react";

import { ALLOWED_ATTACHMENT_TYPES, attachmentPrefix, MAX_ATTACHMENT_SIZE, safeAttachmentFilename } from "@/lib/task-attachments";

import { type AttachmentState, deleteTaskAttachment } from "./actions";

type Attachment = {
  id: string;
  name: string;
  contentType: string;
  size: number;
  createdAt: string;
  uploader: string;
  canDelete: boolean;
};

const initialState: AttachmentState = {};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export function AttachmentManager({ attachments, projectId, taskId }: { attachments: Attachment[]; projectId: string; taskId: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [deleteState, deleteAction, deleting] = useActionState(deleteTaskAttachment, initialState);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = formRef.current?.elements.namedItem("file");
    const file = input instanceof HTMLInputElement ? input.files?.[0] : undefined;
    if (!file) return setError("Choose a file first.");
    if (file.size > MAX_ATTACHMENT_SIZE) return setError("Files must be 10 MB or smaller.");
    if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type as (typeof ALLOWED_ATTACHMENT_TYPES)[number])) {
      return setError("This file type is not supported.");
    }

    setUploading(true);
    setProgress(0);
    setError(undefined);
    setMessage(undefined);

    try {
      await upload(`${attachmentPrefix(taskId)}${safeAttachmentFilename(file.name)}`, file, {
        access: "private",
        handleUploadUrl: "/api/task-attachments/upload",
        clientPayload: JSON.stringify({ projectId, taskId, name: file.name }),
        onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
      });
      formRef.current?.reset();
      setMessage("Upload complete. The attachment is being added to the task.");
      router.refresh();
      window.setTimeout(() => router.refresh(), 1200);
    } catch {
      setError("We could not upload the file. Try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div><p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">Files</p><h3 className="mt-1 text-lg font-semibold">Attachments</h3></div>
        <span className="text-xs text-zinc-400">{attachments.length} {attachments.length === 1 ? "file" : "files"}</span>
      </div>

      {attachments.length ? (
        <div className="mt-6 divide-y divide-zinc-100 rounded-xl border border-zinc-200">
          {attachments.map((attachment) => (
            <article className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center" key={attachment.id}>
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-zinc-100 text-xs font-semibold text-zinc-500">{attachment.name.split(".").pop()?.slice(0, 3).toUpperCase() || "FILE"}</span>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-zinc-700">{attachment.name}</p><p className="mt-1 text-[11px] text-zinc-400">{formatSize(attachment.size)} · {attachment.uploader} · {formatDate(attachment.createdAt)}</p></div>
              <div className="flex items-center gap-2">
                <a className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 transition hover:border-zinc-300" href={`/api/task-attachments/${attachment.id}`}>Download</a>
                {attachment.canDelete ? (
                  <form action={deleteAction} onSubmit={(event) => { if (!window.confirm(`Remove ${attachment.name}?`)) event.preventDefault(); }}>
                    <input name="projectId" type="hidden" value={projectId} />
                    <input name="taskId" type="hidden" value={taskId} />
                    <input name="attachmentId" type="hidden" value={attachment.id} />
                    <button className="rounded-lg px-3 py-2 text-xs font-medium text-zinc-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50" disabled={deleting} type="submit">Remove</button>
                  </form>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : <p className="mt-6 rounded-xl border border-dashed border-zinc-200 px-4 py-7 text-center text-sm text-zinc-400">No attachments yet. Add designs, documents, or supporting files.</p>}

      {deleteState.error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-xs text-red-700">{deleteState.error}</p> : null}
      {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-xs text-red-700">{error}</p> : null}
      {message ? <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-xs text-emerald-700">{message}</p> : null}

      <form className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center" onSubmit={handleSubmit} ref={formRef}>
        <label className="sr-only" htmlFor="task-attachment">Choose attachment</label>
        <input accept={ALLOWED_ATTACHMENT_TYPES.join(",")} className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-500 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-zinc-600" disabled={uploading} id="task-attachment" name="file" required type="file" />
        <button className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60" disabled={uploading} type="submit">{uploading ? `Uploading ${progress}%` : "Upload file"}</button>
      </form>
      <p className="mt-2 text-[11px] text-zinc-400">Images, PDF, Office, text, CSV, or ZIP · 10 MB maximum</p>
    </section>
  );
}

"use client";

import { DndContext, PointerSensor, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { useState, useTransition } from "react";

import { TaskLabelPill, type TaskLabelColor } from "@/components/tasks/task-label";

import { updateTaskBoard } from "./task-actions";

const columns = [
  { id: "TODO", label: "Todo", accent: "bg-zinc-400" },
  { id: "IN_PROGRESS", label: "In Progress", accent: "bg-blue-500" },
  { id: "REVIEW", label: "Review", accent: "bg-amber-500" },
  { id: "DONE", label: "Done", accent: "bg-emerald-500" },
] as const;

type TaskStatus = (typeof columns)[number]["id"];
type TaskCard = {
  id: string;
  number: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  position: number;
  assignee: { user: { name: string | null; email: string | null } } | null;
  labels: Array<{ id: string; name: string; color: TaskLabelColor }>;
};

const priorityStyle = {
  LOW: "bg-zinc-100 text-zinc-500",
  MEDIUM: "bg-blue-50 text-blue-700",
  HIGH: "bg-amber-50 text-amber-700",
  URGENT: "bg-red-50 text-red-700",
} as const;

function initials(task: TaskCard) {
  const value = task.assignee?.user.name || task.assignee?.user.email || "";
  return value.split(/[\s@]/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

function SortableTask({ projectId, projectKey, task, onStep }: { projectId: string; projectKey: string; task: TaskCard; onStep: (taskId: string, direction: -1 | 1) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const columnIndex = columns.findIndex((column) => column.id === task.status);

  return (
    <article className={`rounded-xl border border-zinc-200 bg-white p-3.5 shadow-sm transition ${isDragging ? "z-10 opacity-60 shadow-lg" : "hover:border-zinc-300"}`} ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-zinc-400">{projectKey}-{task.number}</span>
        <div className="flex items-center gap-1.5">
          <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-semibold ${priorityStyle[task.priority]}`}>{task.priority.toLowerCase()}</span>
          <button aria-label={`Drag ${projectKey}-${task.number}`} className="cursor-grab rounded-md px-1.5 py-0.5 text-xs text-zinc-300 transition hover:bg-zinc-100 hover:text-zinc-500 active:cursor-grabbing" type="button" {...attributes} {...listeners}>⠿</button>
        </div>
      </div>
      <Link className="group block" href={`/dashboard/projects/${projectId}/tasks/${task.id}`}>
        <h4 className="mt-2 text-sm font-medium leading-5 text-zinc-800">{task.title}</h4>
        {task.description ? <p className="mt-1.5 line-clamp-2 text-[11px] leading-4 text-zinc-400">{task.description}</p> : null}
        {task.labels.length ? <div className="mt-2 flex flex-wrap gap-1">{task.labels.slice(0, 2).map((label) => <TaskLabelPill color={label.color} key={label.id} name={label.name} />)}{task.labels.length > 2 ? <span className="self-center text-[9px] text-zinc-400">+{task.labels.length - 2}</span> : null}</div> : null}
        <span className="mt-2 block text-[10px] font-medium text-zinc-300 transition group-hover:text-zinc-500">Open task →</span>
      </Link>
      <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2.5">
        {task.assignee ? <span className="grid size-6 place-items-center rounded-full bg-zinc-100 text-[9px] font-semibold text-zinc-600" title={task.assignee.user.name || task.assignee.user.email || "Assigned"}>{initials(task)}</span> : <span className="text-[10px] text-zinc-300">Unassigned</span>}
        <div className="flex gap-1">
          <button aria-label={`Move ${projectKey}-${task.number} left`} className="rounded-md px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-100 disabled:opacity-25" disabled={columnIndex === 0} onClick={() => onStep(task.id, -1)} type="button">←</button>
          <button aria-label={`Move ${projectKey}-${task.number} right`} className="rounded-md px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-100 disabled:opacity-25" disabled={columnIndex === columns.length - 1} onClick={() => onStep(task.id, 1)} type="button">→</button>
        </div>
      </div>
    </article>
  );
}

function Column({ children, count, id, label, accent }: { children: React.ReactNode; count: number; id: TaskStatus; label: string; accent: string }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return <section className={`min-h-80 rounded-2xl border bg-zinc-50/80 p-3 transition ${isOver ? "border-zinc-400 bg-zinc-100" : "border-zinc-200"}`} ref={setNodeRef}><header className="mb-3 flex items-center gap-2 px-1"><span className={`size-2 rounded-full ${accent}`} /><h3 className="text-xs font-semibold">{label}</h3><span className="ml-auto rounded-md bg-white px-1.5 py-0.5 text-[10px] text-zinc-400 shadow-sm">{count}</span></header>{children}</section>;
}

export function KanbanBoard({ initialTasks, projectId, projectKey }: { initialTasks: TaskCard[]; projectId: string; projectKey: string }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function persist(nextTasks: TaskCard[], previousTasks: TaskCard[]) {
    setTasks(nextTasks);
    setError(undefined);
    startTransition(async () => {
      const result = await updateTaskBoard(projectId, nextTasks.map((task) => ({ id: task.id, status: task.status, position: task.position })));
      if (result.error) {
        setTasks(previousTasks);
        setError(result.error);
      }
    });
  }

  function normalized(next: TaskCard[]) {
    return columns.flatMap((column) => next.filter((task) => task.status === column.id).map((task, position) => ({ ...task, position })));
  }

  function onStep(taskId: string, direction: -1 | 1) {
    const previous = tasks;
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;
    const currentIndex = columns.findIndex((column) => column.id === task.status);
    const target = columns[currentIndex + direction];
    if (!target) return;
    persist(normalized(tasks.map((item) => item.id === taskId ? { ...item, status: target.id, position: Number.MAX_SAFE_INTEGER } : item)), previous);
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const previous = tasks;
    const activeIndex = tasks.findIndex((task) => task.id === active.id);
    if (activeIndex < 0) return;
    const activeTask = tasks[activeIndex];
    const overTask = tasks.find((task) => task.id === over.id);
    const targetStatus = overTask?.status || columns.find((column) => column.id === over.id)?.id;
    if (!targetStatus) return;

    let next = [...tasks];
    if (overTask && activeTask.status === targetStatus) {
      next = arrayMove(next, activeIndex, next.findIndex((task) => task.id === overTask.id));
    } else {
      next = next.filter((task) => task.id !== activeTask.id);
      const moved = { ...activeTask, status: targetStatus };
      const overIndex = overTask ? next.findIndex((task) => task.id === overTask.id) : -1;
      if (overIndex >= 0) next.splice(overIndex, 0, moved); else next.push(moved);
    }
    persist(normalized(next), previous);
  }

  return (
    <div className="mt-5">
      {error ? <p className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-xs text-red-700">{error}</p> : null}
      <div className="mb-3 flex items-center justify-between text-[11px] text-zinc-400"><span>Drag cards or use the arrow controls.</span>{pending ? <span>Saving…</span> : <span>Saved</span>}</div>
      <DndContext onDragEnd={onDragEnd} sensors={sensors}>
        <div className="grid gap-3 xl:grid-cols-4">
          {columns.map((column) => {
            const columnTasks = tasks.filter((task) => task.status === column.id).sort((a, b) => a.position - b.position);
            return <Column accent={column.accent} count={columnTasks.length} id={column.id} key={column.id} label={column.label}><SortableContext items={columnTasks.map((task) => task.id)} strategy={verticalListSortingStrategy}><div className="space-y-2">{columnTasks.map((task) => <SortableTask key={task.id} onStep={onStep} projectId={projectId} projectKey={projectKey} task={task} />)}{columnTasks.length === 0 ? <div className="grid min-h-24 place-items-center rounded-xl border border-dashed border-zinc-200 text-[11px] text-zinc-300">Drop tasks here</div> : null}</div></SortableContext></Column>;
          })}
        </div>
      </DndContext>
    </div>
  );
}

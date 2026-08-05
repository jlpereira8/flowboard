export type TaskLabelColor = "ZINC" | "BLUE" | "EMERALD" | "AMBER" | "RED" | "VIOLET";

const labelStyle: Record<TaskLabelColor, string> = {
  ZINC: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  BLUE: "bg-blue-50 text-blue-700 ring-blue-100",
  EMERALD: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  AMBER: "bg-amber-50 text-amber-700 ring-amber-100",
  RED: "bg-red-50 text-red-700 ring-red-100",
  VIOLET: "bg-violet-50 text-violet-700 ring-violet-100",
};

export function TaskLabelPill({ color, name, className = "" }: { color: TaskLabelColor; name: string; className?: string }) {
  return <span className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-medium ring-1 ring-inset ${labelStyle[color]} ${className}`}>{name}</span>;
}

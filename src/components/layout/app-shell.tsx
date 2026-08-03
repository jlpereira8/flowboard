import Link from "next/link";

import { signOutUser } from "@/app/actions/auth";

type AppShellProps = {
  children: React.ReactNode;
  user: {
    name?: string | null;
    email?: string | null;
  };
  workspace: {
    name: string;
    slug: string;
  };
};

const navigation = [
  { label: "Overview", href: "/dashboard", active: true },
  { label: "Projects", href: "/dashboard/projects" },
  { label: "My tasks", href: "/dashboard/tasks" },
  { label: "Calendar", href: "/dashboard/calendar" },
];

export function AppShell({ children, user, workspace }: AppShellProps) {
  const initials = (user.name || user.email || "FB")
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-zinc-950 lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden border-r border-zinc-200 bg-white lg:flex lg:min-h-screen lg:flex-col">
        <div className="flex h-16 items-center gap-2.5 border-b border-zinc-100 px-5 font-semibold tracking-tight">
          <span className="grid size-8 place-items-center rounded-lg bg-zinc-950 text-sm text-white">F</span>
          FlowBoard
        </div>

        <div className="p-3">
          <button className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-left shadow-sm">
            <span className="truncate text-sm font-medium">{workspace.name}</span>
            <span className="text-zinc-400">⌄</span>
          </button>
        </div>

        <nav className="space-y-1 px-3 py-2">
          {navigation.map((item) => (
            <Link
              className={`block rounded-lg px-3 py-2 text-sm transition ${item.active ? "bg-zinc-100 font-medium text-zinc-950" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"}`}
              href={item.href}
              key={item.label}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto border-t border-zinc-100 p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-zinc-100 text-[10px] font-semibold text-zinc-600">{initials}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{user.name || "FlowBoard user"}</p>
              <p className="truncate text-[11px] text-zinc-400">{user.email}</p>
            </div>
            <form action={signOutUser}>
              <button aria-label="Sign out" className="rounded-lg px-2 py-1 text-xs text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700" type="submit">
                Exit
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-5 lg:px-8">
          <div>
            <p className="text-xs text-zinc-400">{workspace.slug}</p>
            <h1 className="text-sm font-semibold">Overview</h1>
          </div>
          <button className="rounded-xl bg-zinc-950 px-4 py-2 text-xs font-medium text-white">New project</button>
        </header>
        {children}
      </div>
    </div>
  );
}

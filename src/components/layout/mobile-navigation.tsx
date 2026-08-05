"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { signOutUser } from "@/app/actions/auth";

type NavigationItem = {
  id: string;
  label: string;
  href: string;
};

type MobileNavigationProps = {
  activeItem: string;
  initials: string;
  items: readonly NavigationItem[];
  unreadNotifications: number;
  user: { name?: string | null; email?: string | null };
  workspace: { name: string; slug: string };
};

export function MobileNavigation({ activeItem, initials, items, unreadNotifications, user, workspace }: MobileNavigationProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <>
      <button aria-controls="mobile-navigation" aria-expanded={open} aria-label="Open navigation" className="relative grid size-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-600 shadow-sm lg:hidden" onClick={() => setOpen(true)} type="button">
        <span aria-hidden className="text-base leading-none">☰</span>
        {unreadNotifications ? <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-zinc-950 px-1 py-0.5 text-center text-[8px] font-semibold text-white">{unreadNotifications > 9 ? "9+" : unreadNotifications}</span> : null}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" id="mobile-navigation" role="dialog" aria-label="Navigation menu" aria-modal="true">
          <button aria-label="Dismiss navigation" className="absolute inset-0 bg-zinc-950/30 backdrop-blur-[2px]" onClick={() => setOpen(false)} type="button" />
          <aside className="absolute inset-y-0 right-0 flex w-[min(88vw,360px)] flex-col border-l border-zinc-200 bg-white shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-zinc-100 px-5">
              <div className="flex items-center gap-2.5 font-semibold tracking-tight"><span className="grid size-8 place-items-center rounded-lg bg-zinc-950 text-sm text-white">F</span>FlowBoard</div>
              <button aria-label="Close navigation" className="grid size-8 place-items-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700" onClick={() => setOpen(false)} type="button">×</button>
            </div>

            <div className="p-4">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3">
                <p className="truncate text-sm font-medium">{workspace.name}</p>
                <p className="mt-1 truncate text-[10px] text-zinc-400">{workspace.slug}</p>
              </div>
            </div>

            <nav className="space-y-1 overflow-y-auto px-4 pb-4">
              {items.map((item) => (
                <Link className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${activeItem === item.id ? "bg-zinc-100 font-medium text-zinc-950" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"}`} href={item.href} key={item.id} onClick={() => setOpen(false)}>
                  <span>{item.label}</span>
                  {item.id === "notifications" && unreadNotifications ? <span className="min-w-5 rounded-full bg-zinc-950 px-1.5 py-0.5 text-center text-[9px] font-semibold text-white">{unreadNotifications > 99 ? "99+" : unreadNotifications}</span> : null}
                </Link>
              ))}
            </nav>

            <div className="mt-auto border-t border-zinc-100 p-4">
              <div className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-zinc-100 text-[10px] font-semibold text-zinc-600">{initials}</span>
                <div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{user.name || "FlowBoard user"}</p><p className="mt-0.5 truncate text-[10px] text-zinc-400">{user.email}</p></div>
                <form action={signOutUser}><button className="rounded-lg px-2 py-1.5 text-xs text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700" type="submit">Exit</button></form>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}

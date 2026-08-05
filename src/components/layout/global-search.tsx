"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type SearchResult = {
  id: string;
  type: string;
  label: string;
  meta: string;
  href: string;
};

const quickLinks: SearchResult[] = [
  { id: "quick-overview", type: "Go to", label: "Overview", meta: "Dashboard", href: "/dashboard" },
  { id: "quick-projects", type: "Go to", label: "Projects", meta: "Workspace projects", href: "/dashboard/projects" },
  { id: "quick-tasks", type: "Go to", label: "My tasks", meta: "Assigned work", href: "/dashboard/tasks" },
  { id: "quick-calendar", type: "Go to", label: "Calendar", meta: "Task deadlines", href: "/dashboard/calendar" },
  { id: "quick-members", type: "Go to", label: "Members", meta: "Workspace people", href: "/dashboard/members" },
  { id: "quick-settings", type: "Go to", label: "Settings", meta: "Preferences", href: "/dashboard/settings" },
];

const typeMark: Record<string, string> = {
  Project: "P",
  Task: "T",
  Team: "TM",
  Member: "M",
  "Go to": "→",
};

export function GlobalSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const visibleResults = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (value.length >= 2) return results;
    return quickLinks.filter((item) => !value || `${item.label} ${item.meta}`.toLowerCase().includes(value));
  }, [query, results]);

  useEffect(() => {
    const openSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSelectedIndex(0);
        setOpen(true);
      }
    };
    window.addEventListener("keydown", openSearch);
    return () => window.removeEventListener("keydown", openSearch);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => inputRef.current?.focus());
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 2) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(value)}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Search failed");
        const data = await response.json() as { results: SearchResult[] };
        setResults(data.results);
        setSelectedIndex(0);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 180);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const close = () => {
    setOpen(false);
    setQuery("");
    setResults([]);
  };

  const openDialog = () => {
    setSelectedIndex(0);
    setOpen(true);
  };

  const updateQuery = (value: string) => {
    setQuery(value);
    setSelectedIndex(0);
    if (value.trim().length < 2) {
      setResults([]);
      setLoading(false);
    }
  };

  const visit = (result: SearchResult) => {
    close();
    router.push(result.href);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((index) => visibleResults.length ? (index + 1) % visibleResults.length : 0);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((index) => visibleResults.length ? (index - 1 + visibleResults.length) % visibleResults.length : 0);
    } else if (event.key === "Enter" && visibleResults[selectedIndex]) {
      event.preventDefault();
      visit(visibleResults[selectedIndex]);
    }
  };

  return (
    <>
      <button aria-label="Search workspace" className="flex h-9 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-2.5 text-xs text-zinc-400 shadow-sm transition hover:border-zinc-300 hover:text-zinc-600 sm:min-w-44 sm:justify-between sm:px-3" onClick={openDialog} type="button">
        <span className="flex items-center gap-2"><span aria-hidden className="text-sm">⌕</span><span className="hidden sm:inline">Search workspace</span></span>
        <kbd className="hidden rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-sans text-[9px] text-zinc-400 sm:inline">⌘ K</kbd>
      </button>

      {open ? (
        <div aria-label="Global search" aria-modal="true" className="fixed inset-0 z-[60] flex items-start justify-center px-3 pt-[10vh] sm:px-6 sm:pt-[14vh]" role="dialog">
          <button aria-label="Close search" className="absolute inset-0 bg-zinc-950/35 backdrop-blur-[2px]" onClick={close} type="button" />
          <section className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl">
            <div className="flex items-center gap-3 border-b border-zinc-100 px-4">
              <span aria-hidden className="text-lg text-zinc-400">⌕</span>
              <input aria-label="Search projects, tasks, teams, and members" autoComplete="off" className="h-14 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400" onChange={(event) => updateQuery(event.target.value)} onKeyDown={handleKeyDown} placeholder="Search projects, tasks, teams, and members…" ref={inputRef} value={query} />
              <button className="rounded-md border border-zinc-200 px-1.5 py-1 text-[9px] text-zinc-400" onClick={close} type="button">ESC</button>
            </div>

            <div className="max-h-[min(60vh,480px)] overflow-y-auto p-2">
              <div className="flex items-center justify-between px-2 pb-2 pt-1"><p className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-400">{query.trim().length >= 2 ? "Search results" : "Quick navigation"}</p>{loading ? <span className="text-[10px] text-zinc-400">Searching…</span> : null}</div>
              {!loading && !visibleResults.length ? <div className="grid min-h-40 place-items-center px-6 text-center"><div><p className="text-sm font-medium">No results found</p><p className="mt-1 text-xs text-zinc-400">Try a project name, task code, team, or member.</p></div></div> : null}
              <div className="space-y-1">
                {visibleResults.map((result, index) => (
                  <button className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${index === selectedIndex ? "bg-zinc-100" : "hover:bg-zinc-50"}`} key={result.id} onClick={() => visit(result)} onMouseEnter={() => setSelectedIndex(index)} type="button">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-zinc-200 bg-white text-[10px] font-semibold text-zinc-500">{typeMark[result.type] || "·"}</span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-zinc-800">{result.label}</span><span className="mt-0.5 block truncate text-[10px] text-zinc-400">{result.meta}</span></span>
                    <span className="shrink-0 text-[10px] text-zinc-400">{result.type}</span>
                  </button>
                ))}
              </div>
            </div>

            <footer className="hidden items-center gap-4 border-t border-zinc-100 bg-zinc-50/70 px-4 py-2.5 text-[9px] text-zinc-400 sm:flex"><span>↑↓ Navigate</span><span>↵ Open</span><span>Esc Close</span></footer>
          </section>
        </div>
      ) : null}
    </>
  );
}

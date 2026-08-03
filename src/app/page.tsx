const tasks = [
  { title: "Refine onboarding", label: "Design", tone: "bg-blue-50 text-blue-700" },
  { title: "Ship billing portal", label: "Backend", tone: "bg-violet-50 text-violet-700" },
  { title: "Review launch copy", label: "Marketing", tone: "bg-amber-50 text-amber-700" },
];

const columns = ["Backlog", "In progress", "Review"];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f7f5] text-zinc-950">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 lg:px-8">
        <a className="flex items-center gap-2.5 font-semibold tracking-tight" href="#">
          <span className="grid size-8 place-items-center rounded-lg bg-zinc-950 text-sm text-white">F</span>
          FlowBoard
        </a>
        <span className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 shadow-sm">
          Early access
        </span>
      </nav>

      <section className="mx-auto grid max-w-6xl items-center gap-14 px-6 pb-20 pt-16 lg:grid-cols-[0.85fr_1.15fr] lg:px-8 lg:pb-28 lg:pt-24">
        <div>
          <p className="mb-5 text-sm font-medium text-zinc-500">Built for focused engineering teams</p>
          <h1 className="max-w-xl text-5xl font-semibold leading-[1.05] tracking-[-0.045em] sm:text-6xl">
            Move work forward without the noise.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-zinc-600">
            FlowBoard brings projects, tasks, and team momentum into one calm workspace.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <button className="rounded-xl bg-zinc-950 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800">
              Coming soon
            </button>
            <a className="rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-zinc-300" href="https://github.com/jlpereira8/flowboard">
              View on GitHub
            </a>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white p-3 shadow-[0_24px_70px_-30px_rgba(24,24,27,0.35)]">
          <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-2.5">
            <div>
              <p className="text-xs font-medium text-zinc-400">Workspace</p>
              <p className="mt-0.5 text-sm font-semibold">Product launch</p>
            </div>
            <div className="flex -space-x-2">
              {["JP", "AR", "MK"].map((member) => (
                <span key={member} className="grid size-7 place-items-center rounded-full border-2 border-white bg-zinc-100 text-[9px] font-semibold text-zinc-600">
                  {member}
                </span>
              ))}
            </div>
          </div>
          <div className="grid gap-3 p-3 sm:grid-cols-3">
            {columns.map((column, index) => (
              <section key={column} className="min-h-44 rounded-xl bg-zinc-50 p-2.5">
                <div className="mb-3 flex items-center justify-between px-1 text-xs font-medium text-zinc-500">
                  <span>{column}</span>
                  <span>{index + 1}</span>
                </div>
                <article className="rounded-lg border border-zinc-200/80 bg-white p-3 shadow-sm">
                  <span className={`rounded-md px-2 py-1 text-[10px] font-medium ${tasks[index].tone}`}>
                    {tasks[index].label}
                  </span>
                  <h2 className="mt-3 text-sm font-medium leading-5">{tasks[index].title}</h2>
                  <div className="mt-5 flex items-center justify-between text-[10px] text-zinc-400">
                    <span>FB-{12 + index}</span>
                    <span className="size-5 rounded-full bg-zinc-100" />
                  </div>
                </article>
              </section>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-200/80 bg-white/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <span>FlowBoard — modern project management.</span>
          <span>Next.js · TypeScript · Prisma · PostgreSQL</span>
        </div>
      </footer>
    </main>
  );
}

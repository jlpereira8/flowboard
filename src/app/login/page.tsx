import Link from "next/link";

import { signInWithGitHub } from "@/app/actions/auth";

function GitHubIcon() {
  return (
    <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .7a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2.23c-3.24.7-3.92-1.38-3.92-1.38-.53-1.35-1.29-1.71-1.29-1.71-1.05-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.72 1.27 3.39.97.1-.75.4-1.27.74-1.56-2.58-.29-5.3-1.29-5.3-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.47.11-3.05 0 0 .97-.31 3.16 1.18a10.94 10.94 0 0 1 5.76 0c2.19-1.49 3.16-1.18 3.16-1.18.63 1.58.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.72 5.39-5.31 5.68.42.36.79 1.07.79 2.16v3.26c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z" />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f7f5] px-6 py-12">
      <div className="w-full max-w-sm">
        <Link className="mx-auto mb-10 flex w-fit items-center gap-2.5 font-semibold tracking-tight" href="/">
          <span className="grid size-9 place-items-center rounded-xl bg-zinc-950 text-sm text-white">F</span>
          FlowBoard
        </Link>

        <section className="rounded-2xl border border-zinc-200 bg-white p-7 shadow-[0_24px_70px_-36px_rgba(24,24,27,0.45)]">
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-[-0.025em]">Welcome to FlowBoard</h1>
            <p className="mt-2 text-sm leading-6 text-zinc-500">Sign in to organize projects, tasks, and your team.</p>
          </div>

          <form action={signInWithGitHub} className="mt-7">
            <button className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800" type="submit">
              <GitHubIcon />
              Continue with GitHub
            </button>
          </form>

          <p className="mt-6 text-center text-xs leading-5 text-zinc-400">
            By continuing, you agree to use FlowBoard for this early-access preview.
          </p>
        </section>
      </div>
    </main>
  );
}

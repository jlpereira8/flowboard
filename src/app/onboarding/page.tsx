import { redirect } from "next/navigation";

import { getCurrentWorkspace, verifySession } from "@/lib/dal";

import { WorkspaceForm } from "./workspace-form";

export default async function OnboardingPage() {
  const { user } = await verifySession();
  const membership = await getCurrentWorkspace();

  if (membership) {
    redirect("/dashboard");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f7f5] px-6 py-12">
      <section className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-[0_24px_70px_-36px_rgba(24,24,27,0.45)]">
        <span className="grid size-10 place-items-center rounded-xl bg-zinc-950 text-sm font-semibold text-white">1</span>
        <h1 className="mt-6 text-3xl font-semibold tracking-[-0.035em]">Create your workspace</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-500">
          Welcome{user.name ? `, ${user.name.split(" ")[0]}` : ""}. Give your team a home for projects and tasks.
        </p>
        <WorkspaceForm />
      </section>
    </main>
  );
}

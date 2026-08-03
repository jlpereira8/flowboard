import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getCurrentWorkspace, verifySession } from "@/lib/dal";

import { ProjectForm } from "../project-form";

export default async function NewProjectPage() {
  const [{ user }, membership] = await Promise.all([verifySession(), getCurrentWorkspace()]);

  if (!membership) redirect("/onboarding");

  return (
    <AppShell activeItem="projects" title="New project" user={user} workspace={membership.workspace}>
      <main className="px-5 py-8 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-2xl">
          <p className="text-sm text-zinc-500">Set the identity for a new stream of work.</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-[-0.035em]">Create a project</h2>
          <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
            <ProjectForm />
          </section>
        </div>
      </main>
    </AppShell>
  );
}

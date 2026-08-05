"use client";

import { useActionState } from "react";

import {
  type SettingsState,
  updateAppearance,
  updateNotificationPreferences,
  updateProfile,
  updateWorkspace,
} from "./actions";

const initialState: SettingsState = {};
const inputClass = "h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100";

function Result({ state }: { state: SettingsState }) {
  if (state.error) return <p className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-xs text-red-700">{state.error}</p>;
  if (state.success) return <p className="mb-5 rounded-xl bg-emerald-50 px-4 py-3 text-xs text-emerald-700">{state.success}</p>;
  return null;
}

function SubmitButton({ label, pending }: { label: string; pending: boolean }) {
  return <button className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60" disabled={pending} type="submit">{pending ? "Saving…" : label}</button>;
}

export function ProfileSettings({ email, name }: { email: string; name: string }) {
  const [state, action, pending] = useActionState(updateProfile, initialState);
  return <form action={action}><Result state={state} /><div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-medium text-zinc-700">Display name<input className={`mt-2 ${inputClass}`} defaultValue={name} maxLength={60} name="name" required />{state.fieldErrors?.name ? <span className="mt-2 block text-xs text-red-600">{state.fieldErrors.name}</span> : null}</label><label className="text-sm font-medium text-zinc-700">Email<input className={`mt-2 ${inputClass} cursor-not-allowed bg-zinc-50 text-zinc-400`} disabled value={email} /></label></div><div className="mt-6 flex justify-end"><SubmitButton label="Save profile" pending={pending} /></div></form>;
}

export function WorkspaceSettings({ canManage, name, slug }: { canManage: boolean; name: string; slug: string }) {
  const [state, action, pending] = useActionState(updateWorkspace, initialState);
  return <form action={action}><Result state={state} /><div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-medium text-zinc-700">Workspace name<input className={`mt-2 ${inputClass}`} defaultValue={name} disabled={!canManage} maxLength={60} name="name" required /></label><label className="text-sm font-medium text-zinc-700">Workspace URL<input className={`mt-2 ${inputClass} cursor-not-allowed bg-zinc-50 text-zinc-400`} disabled value={slug} /></label></div>{canManage ? <div className="mt-6 flex justify-end"><SubmitButton label="Save workspace" pending={pending} /></div> : <p className="mt-5 text-xs text-zinc-400">Only owners and admins can edit workspace details.</p>}</form>;
}

const notificationOptions = [
  { name: "notifyTaskAssigned", title: "Task assignments", description: "When another teammate assigns a task to you." },
  { name: "notifyComments", title: "Comments", description: "When someone comments on a task you own or created." },
  { name: "notifyStatusChanges", title: "Status changes", description: "When relevant work moves across the board." },
] as const;

export function NotificationSettings({ preferences }: { preferences: Record<(typeof notificationOptions)[number]["name"], boolean> }) {
  const [state, action, pending] = useActionState(updateNotificationPreferences, initialState);
  return <form action={action}><Result state={state} /><div className="divide-y divide-zinc-100">{notificationOptions.map((option) => <label className="flex cursor-pointer items-start gap-4 py-4 first:pt-0 last:pb-0" key={option.name}><input className="mt-1 size-4 rounded border-zinc-300 accent-zinc-950" defaultChecked={preferences[option.name]} name={option.name} type="checkbox" /><span><span className="block text-sm font-medium text-zinc-700">{option.title}</span><span className="mt-1 block text-xs leading-5 text-zinc-400">{option.description}</span></span></label>)}</div><div className="mt-6 flex justify-end"><SubmitButton label="Save preferences" pending={pending} /></div></form>;
}

const themes = [
  { value: "SYSTEM", title: "System", description: "Match your device appearance." },
  { value: "LIGHT", title: "Light", description: "Use the bright FlowBoard theme." },
  { value: "DARK", title: "Dark", description: "Use a low-light workspace." },
] as const;

export function AppearanceSettings({ theme }: { theme: "SYSTEM" | "LIGHT" | "DARK" }) {
  const [state, action, pending] = useActionState(updateAppearance, initialState);
  return <form action={action}><Result state={state} /><div className="grid gap-3 sm:grid-cols-3">{themes.map((option) => <label className="cursor-pointer rounded-xl border border-zinc-200 bg-white p-4 transition has-[:checked]:border-zinc-950 has-[:checked]:ring-2 has-[:checked]:ring-zinc-100" key={option.value}><input className="sr-only" defaultChecked={theme === option.value} name="theme" type="radio" value={option.value} /><span className="block text-sm font-medium text-zinc-700">{option.title}</span><span className="mt-1 block text-xs leading-5 text-zinc-400">{option.description}</span></label>)}</div>{state.fieldErrors?.theme ? <p className="mt-3 text-xs text-red-600">{state.fieldErrors.theme}</p> : null}<div className="mt-6 flex justify-end"><SubmitButton label="Save appearance" pending={pending} /></div></form>;
}

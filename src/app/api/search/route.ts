import { NextResponse } from "next/server";

import { getCurrentWorkspace } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const membership = await getCurrentWorkspace();
  if (!membership) return NextResponse.json({ results: [] });

  const query = (new URL(request.url).searchParams.get("q")?.trim() || "").slice(0, 80);
  if (query.length < 2) return NextResponse.json({ results: [] });

  const taskCode = query.match(/^([a-z0-9]+)-(\d+)$/i);
  const workspaceId = membership.workspace.id;
  const [projects, tasks, teams, members] = await Promise.all([
    prisma.project.findMany({
      where: {
        workspaceId,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { key: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, key: true, name: true, status: true },
    }),
    prisma.task.findMany({
      where: {
        project: { workspaceId },
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          ...(taskCode ? [{ number: Number(taskCode[2]), project: { workspaceId, key: { equals: taskCode[1], mode: "insensitive" as const } } }] : []),
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 7,
      select: { id: true, number: true, title: true, status: true, project: { select: { id: true, key: true, name: true } } },
    }),
    prisma.team.findMany({
      where: {
        workspaceId,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { key: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 4,
      select: { id: true, key: true, name: true },
    }),
    prisma.member.findMany({
      where: {
        workspaceId,
        user: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        },
      },
      orderBy: { createdAt: "asc" },
      take: 4,
      select: { id: true, role: true, user: { select: { name: true, email: true } } },
    }),
  ]);

  const results = [
    ...projects.map((project) => ({
      id: `project-${project.id}`,
      type: "Project",
      label: project.name,
      meta: `${project.key} · ${project.status.toLowerCase()}`,
      href: `/dashboard/projects/${project.id}`,
    })),
    ...tasks.map((task) => ({
      id: `task-${task.id}`,
      type: "Task",
      label: task.title,
      meta: `${task.project.key}-${task.number} · ${task.status.toLowerCase().replace("_", " ")}`,
      href: `/dashboard/projects/${task.project.id}/tasks/${task.id}`,
    })),
    ...teams.map((team) => ({
      id: `team-${team.id}`,
      type: "Team",
      label: team.name,
      meta: team.key,
      href: `/dashboard/teams/${team.id}/edit`,
    })),
    ...members.map((member) => ({
      id: `member-${member.id}`,
      type: "Member",
      label: member.user.name || member.user.email || "Workspace member",
      meta: member.role.toLowerCase(),
      href: "/dashboard/members",
    })),
  ];

  return NextResponse.json({ results });
}

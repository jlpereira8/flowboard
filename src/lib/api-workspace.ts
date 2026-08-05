import "server-only";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getApiWorkspace() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const membership = await prisma.member.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, role: true, workspaceId: true },
  });
  if (!membership) return null;

  return { userId: session.user.id, membership };
}

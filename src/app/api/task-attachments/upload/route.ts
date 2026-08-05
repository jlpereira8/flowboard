import { head } from "@vercel/blob";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getApiWorkspace } from "@/lib/api-workspace";
import { prisma } from "@/lib/prisma";
import { ALLOWED_ATTACHMENT_TYPES, attachmentPrefix, MAX_ATTACHMENT_SIZE } from "@/lib/task-attachments";

const uploadPayloadSchema = z.object({
  projectId: z.string().min(1),
  taskId: z.string().min(1),
  name: z.string().trim().min(1).max(160),
});

const tokenPayloadSchema = uploadPayloadSchema.extend({
  userId: z.string().min(1),
  workspaceId: z.string().min(1),
});

export async function POST(request: Request) {
  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
  }

  const apiWorkspace = body.type === "blob.generate-client-token" ? await getApiWorkspace() : null;
  if (body.type === "blob.generate-client-token" && !apiWorkspace) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!apiWorkspace) throw new Error("Unauthorized upload request.");

        const parsed = uploadPayloadSchema.safeParse(clientPayload ? JSON.parse(clientPayload) : null);
        if (!parsed.success) throw new Error("Invalid attachment details.");
        if (!pathname.startsWith(attachmentPrefix(parsed.data.taskId))) {
          throw new Error("Invalid attachment path.");
        }

        const task = await prisma.task.findFirst({
          where: {
            id: parsed.data.taskId,
            projectId: parsed.data.projectId,
            project: { workspaceId: apiWorkspace.membership.workspaceId },
          },
          select: { id: true },
        });
        if (!task) throw new Error("Task not found.");

        return {
          allowedContentTypes: [...ALLOWED_ATTACHMENT_TYPES],
          maximumSizeInBytes: MAX_ATTACHMENT_SIZE,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            ...parsed.data,
            userId: apiWorkspace.userId,
            workspaceId: apiWorkspace.membership.workspaceId,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const parsed = tokenPayloadSchema.safeParse(tokenPayload ? JSON.parse(tokenPayload) : null);
        if (!parsed.success) return;
        if (!blob.pathname.startsWith(attachmentPrefix(parsed.data.taskId))) return;

        const metadata = await head(blob.pathname);
        if (metadata.size > MAX_ATTACHMENT_SIZE || !ALLOWED_ATTACHMENT_TYPES.includes(metadata.contentType as (typeof ALLOWED_ATTACHMENT_TYPES)[number])) return;

        await prisma.$transaction(async (tx) => {
          const existing = await tx.taskAttachment.findUnique({ where: { pathname: blob.pathname }, select: { id: true } });
          if (existing) return;

          const task = await tx.task.findFirst({
            where: {
              id: parsed.data.taskId,
              projectId: parsed.data.projectId,
              project: { workspaceId: parsed.data.workspaceId },
            },
            select: { id: true },
          });
          const uploader = await tx.member.findFirst({
            where: { userId: parsed.data.userId, workspaceId: parsed.data.workspaceId },
            select: { id: true },
          });
          if (!task || !uploader) return;

          await tx.taskAttachment.create({
            data: {
              name: parsed.data.name,
              pathname: blob.pathname,
              contentType: metadata.contentType,
              size: metadata.size,
              taskId: task.id,
              uploadedById: parsed.data.userId,
            },
          });
          await tx.taskActivity.create({
            data: { type: "UPDATED", message: `attached ${parsed.data.name}`, taskId: task.id, actorId: parsed.data.userId },
          });
        });
      },
    });

    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: "We could not authorize this upload." }, { status: 400 });
  }
}

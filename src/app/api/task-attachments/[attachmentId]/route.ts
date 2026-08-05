import { get } from "@vercel/blob";
import { NextResponse } from "next/server";

import { getApiWorkspace } from "@/lib/api-workspace";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ attachmentId: string }> }) {
  const [apiWorkspace, { attachmentId }] = await Promise.all([getApiWorkspace(), params]);
  if (!apiWorkspace) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const attachment = await prisma.taskAttachment.findFirst({
    where: { id: attachmentId, task: { project: { workspaceId: apiWorkspace.membership.workspaceId } } },
    select: { name: true, pathname: true },
  });
  if (!attachment) return new NextResponse("Not found", { status: 404 });

  try {
    const result = await get(attachment.pathname, {
      access: "private",
      ifNoneMatch: request.headers.get("if-none-match") ?? undefined,
    });
    if (!result) return new NextResponse("Not found", { status: 404 });

    const cacheHeaders = {
      "Cache-Control": "private, no-cache",
      ETag: result.blob.etag,
      "X-Content-Type-Options": "nosniff",
    };
    if (result.statusCode === 304) return new NextResponse(null, { status: 304, headers: cacheHeaders });

    return new NextResponse(result.stream, {
      headers: {
        ...cacheHeaders,
        "Content-Type": result.blob.contentType,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(attachment.name)}`,
      },
    });
  } catch {
    return new NextResponse("Attachment unavailable", { status: 503 });
  }
}

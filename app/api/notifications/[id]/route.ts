import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/notifications/[id]
 * 
 * Marks a notification as read.
 * 
 * Body:
 *   - type: "note" | "changes" | "both"
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const type = body.type || "both";

  // Verify the bugger belongs to the user
  const bugger = await prisma.bugger.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!bugger) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (bugger.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Update read status based on type
  const updateData: { noteRead?: boolean; changesRead?: boolean } = {};
  if (type === "note" || type === "both") {
    updateData.noteRead = true;
  }
  if (type === "changes" || type === "both") {
    updateData.changesRead = true;
  }

  const updated = await prisma.bugger.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      noteRead: true,
      changesRead: true,
    },
  });

  return NextResponse.json(updated);
}

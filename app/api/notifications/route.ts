import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

/**
 * GET /api/notifications
 * 
 * Fetches notifications (buggers) for the current user.
 * 
 * Query params:
 *   - showAll: "true" to include read notifications, otherwise only unread
 *   - type: "notes" | "changes" | "all" (default: "all")
 */
export async function GET(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const showAll = searchParams.get("showAll") === "true";
  const type = searchParams.get("type") || "all";

  // Build where clause based on read status filter
  const whereClause: {
    userId: string;
    noteRead?: boolean;
    changesRead?: boolean;
    OR?: Array<{ noteRead?: boolean; changesRead?: boolean }>;
  } = {
    userId: user.id,
  };

  // If not showing all, filter by unread status based on type
  if (!showAll) {
    if (type === "notes") {
      whereClause.noteRead = false;
    } else if (type === "changes") {
      whereClause.changesRead = false;
    } else {
      // For "all", show buggers where either notes OR changes are unread
      whereClause.OR = [{ noteRead: false }, { changesRead: false }];
    }
  }

  const buggers = await prisma.bugger.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      owner: true,
      repo: true,
      branchName: true,
      symptoms: true,
      changes: true,
      filesBuggered: true,
      fileChanges: true,
      noteRead: true,
      changesRead: true,
      createdAt: true,
    },
  });

  // Transform to notification format
  const notes = buggers.map((b) => ({
    id: b.id,
    timestamp: b.createdAt,
    title: "Bug Report",
    messages: b.symptoms,
    read: b.noteRead,
    branchName: b.branchName,
    repoName: b.repo,
    repoOwner: b.owner,
  }));

  const branchChanges = buggers.map((b) => ({
    id: b.id,
    timestamp: b.createdAt,
    read: b.changesRead,
    branchName: b.branchName,
    repoName: b.repo,
    repoOwner: b.owner,
    message: `${b.filesBuggered.length} file(s) buggered`,
    files: b.fileChanges || b.filesBuggered.map((file) => ({
      file,
      success: true,
      changes: [],
    })),
  }));

  return NextResponse.json({
    notes,
    branchChanges,
    unreadNotesCount: buggers.filter((b) => !b.noteRead).length,
    unreadChangesCount: buggers.filter((b) => !b.changesRead).length,
  });
}

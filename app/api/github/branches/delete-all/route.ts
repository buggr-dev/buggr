import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { deleteBranch } from "@/lib/github";

/**
 * DELETE /api/github/branches/delete-all
 * 
 * Deletes all branches that include "buggr-" in their name.
 * Requires owner and repo in the request body.
 */
export async function DELETE(request: NextRequest) {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { owner, repo } = body;

    if (!owner || !repo) {
      return NextResponse.json(
        { error: "Missing required fields: owner, repo" },
        { status: 400 }
      );
    }

    // Fetch all branches
    const branchesResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/branches`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!branchesResponse.ok) {
      throw new Error("Failed to fetch branches");
    }

    const branches = await branchesResponse.json();

    // Filter to only buggr- branches
    const buggrBranches = branches
      .filter((branch: { name: string }) => branch.name.includes("buggr-"))
      .map((branch: { name: string }) => branch.name);

    if (buggrBranches.length === 0) {
      return NextResponse.json({
        message: "No buggr- branches found",
        deleted: [],
        count: 0,
      });
    }

    // Delete each branch
    const results: { branch: string; success: boolean; error?: string }[] = [];

    for (const branchName of buggrBranches) {
      try {
        await deleteBranch(session.accessToken, owner, repo, branchName);
        results.push({ branch: branchName, success: true });
      } catch (error) {
        results.push({
          branch: branchName,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;

    return NextResponse.json({
      message: `Deleted ${successCount} of ${buggrBranches.length} buggr- branches`,
      deleted: results.filter((r) => r.success).map((r) => r.branch),
      failed: results.filter((r) => !r.success),
      count: successCount,
      total: buggrBranches.length,
    });
  } catch (error) {
    console.error("Error deleting branches:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete branches" },
      { status: 500 }
    );
  }
}


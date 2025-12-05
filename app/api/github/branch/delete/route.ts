import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { deleteBranch } from "@/lib/github";

/**
 * DELETE /api/github/branch/delete
 * 
 * Deletes a branch from a repository.
 * Requires owner, repo, and branchName in the request body.
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
    const { owner, repo, branchName } = body;

    if (!owner || !repo || !branchName) {
      return NextResponse.json(
        { error: "Missing required fields: owner, repo, branchName" },
        { status: 400 }
      );
    }

    // Prevent deletion of main/master branches
    const protectedBranches = ["main", "master", "develop", "dev"];
    if (protectedBranches.includes(branchName.toLowerCase())) {
      return NextResponse.json(
        { error: "Cannot delete protected branches (main, master, develop, dev)" },
        { status: 403 }
      );
    }

    await deleteBranch(session.accessToken, owner, repo, branchName);

    return NextResponse.json({
      message: `Branch '${branchName}' deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting branch:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete branch" },
      { status: 500 }
    );
  }
}


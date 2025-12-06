import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchFileContent, updateFile } from "@/lib/github";
import { introduceAIStress } from "@/lib/ai-stress";

// Maximum file size in lines to process (keeps token usage reasonable)
const MAX_FILE_LINES_SINGLE = 5000; // If only 1 file, allow up to 5000 lines
const MAX_FILE_LINES_MULTIPLE = 2000; // If multiple files, limit to 2000 lines per file

/**
 * POST /api/github/stress
 * 
 * Uses AI to introduce subtle breaking changes to files that were modified in a commit.
 * Requires owner, repo, branch, and files (array of file paths) in the request body.
 * 
 * Files exceeding the line limit are skipped to keep token usage reasonable.
 * If only one valid file is being processed, it can be up to 5000 lines.
 * If multiple files are being processed, each is limited to 2000 lines.
 */
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { owner, repo, branch, files, context, difficulty } = body;

    if (!owner || !repo || !branch || !files || !Array.isArray(files)) {
      return NextResponse.json(
        { error: "Missing required fields: owner, repo, branch, files" },
        { status: 400 }
      );
    }

    // Validate context length if provided
    const stressContext = typeof context === "string" ? context.slice(0, 200) : undefined;
    
    // Validate stress level
    const validLevels = ["low", "medium", "high"] as const;
    const stressLevel: "low" | "medium" | "high" = validLevels.includes(difficulty) ? difficulty : "medium";

    const results: { file: string; success: boolean; changes?: string[]; symptoms?: string[]; error?: string }[] = [];
    const allSymptoms: string[] = [];

    // Count valid code files to determine line limit
    const validCodeFiles = files.filter((filePath) => {
      const ext = filePath.split(".").pop()?.toLowerCase();
      return ["ts", "tsx", "js", "jsx", "py", "java", "go", "rs", "c", "cpp", "h", "cs"].includes(ext || "");
    });
    
    // If only one valid file, allow up to 5000 lines; otherwise limit to 2000 per file
    const maxFileLines = validCodeFiles.length === 1 ? MAX_FILE_LINES_SINGLE : MAX_FILE_LINES_MULTIPLE;

    // Process each file
    for (const filePath of files) {
      try {
        // Skip non-code files
        const ext = filePath.split(".").pop()?.toLowerCase();
        if (!["ts", "tsx", "js", "jsx", "py", "java", "go", "rs", "c", "cpp", "h", "cs"].includes(ext || "")) {
          results.push({ file: filePath, success: false, error: "Skipped non-code file" });
          continue;
        }

        // Fetch the current file content
        const fileContent = await fetchFileContent(
          session.accessToken,
          owner,
          repo,
          filePath,
          branch
        );

        // Decode the content (it's base64 encoded)
        const decodedContent = Buffer.from(fileContent.content, "base64").toString("utf-8");

        // Skip files that are too large (keeps token usage reasonable)
        const lineCount = decodedContent.split("\n").length;
        if (lineCount > maxFileLines) {
          results.push({ 
            file: filePath, 
            success: false, 
            error: `Skipped: file too large (${lineCount} lines, max ${maxFileLines})` 
          });
          continue;
        }

        // Use AI to introduce subtle stress
        const { content: modifiedContent, changes, symptoms } = await introduceAIStress(decodedContent, filePath, stressContext, stressLevel);

        // Only update if changes were made
        if (changes.length > 0 && modifiedContent !== decodedContent) {
          await updateFile(
            session.accessToken,
            owner,
            repo,
            filePath,
            modifiedContent,
            `🔥 ${filePath} is stressed out`,
            fileContent.sha,
            branch
          );

          results.push({ file: filePath, success: true, changes, symptoms });
          allSymptoms.push(...symptoms);
        } else {
          results.push({ file: filePath, success: false, error: "No changes made" });
        }
      } catch (error) {
        results.push({
          file: filePath,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;

    // Deduplicate symptoms
    const uniqueSymptoms = [...new Set(allSymptoms)];

    return NextResponse.json({
      message: `${successCount} of ${files.length} files have been stressed out`,
      results,
      symptoms: uniqueSymptoms,
    });
  } catch (error) {
    console.error("Error introducing stress:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to introduce stress" },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchFileContent, updateFile, createStressMetadata, StressMetadata } from "@/lib/github";
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
 * Randomly selects ONE file from the provided files and applies all bugs to that single file.
 * Files exceeding the line limit are skipped to keep token usage reasonable.
 * Selected file can be up to 5000 lines.
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
    const { owner, repo, branch, files, context, difficulty, originalCommitSha, customFilesCount, customBugCount } = body;

    if (!owner || !repo || !branch || !files || !Array.isArray(files)) {
      return NextResponse.json(
        { error: "Missing required fields: owner, repo, branch, files" },
        { status: 400 }
      );
    }

    // Validate context length if provided
    const stressContext = typeof context === "string" ? context.slice(0, 200) : undefined;
    
    // Validate stress level
    const validLevels = ["low", "medium", "high", "custom"] as const;
    const stressLevel: "low" | "medium" | "high" | "custom" = validLevels.includes(difficulty) ? difficulty : "medium";

    // Calculate total bug count based on stress level (TOTAL across all files, not per file)
    let totalBugCount: number;
    if (stressLevel === "custom") {
      // Use custom bug count if provided, otherwise default to 1
      totalBugCount = typeof customBugCount === "number" && customBugCount > 0 ? customBugCount : 1;
    } else {
      // Fixed bug counts: Low: 2, Medium: 4, High: 6
      const STRESS_CONFIGS = {
        low: 2,
        medium: 4,
        high: 6,
      };
      totalBugCount = STRESS_CONFIGS[stressLevel];
    }

    // Determine how many files to process based on stress level
    let filesToProcess: number;
    if (stressLevel === "custom") {
      filesToProcess = typeof customFilesCount === "number" && customFilesCount > 0
        ? Math.min(customFilesCount, files.length)
        : 1;
    } else {
      // Low: 1 file, Medium: 2 files, High: 3 files
      const filesByLevel = {
        low: 1,
        medium: 2,
        high: 3,
      };
      filesToProcess = Math.min(filesByLevel[stressLevel], files.length);
    }

    const results: { file: string; success: boolean; changes?: string[]; symptoms?: string[]; error?: string }[] = [];
    const allSymptoms: string[] = [];

    // Count valid code files to determine line limit
    const validCodeFiles = files.filter((filePath) => {
      const ext = filePath.split(".").pop()?.toLowerCase();
      return ["ts", "tsx", "js", "jsx", "py", "java", "go", "rs", "c", "cpp", "h", "cs"].includes(ext || "");
    });
    
    // Determine line limit based on number of files to process
    const maxFileLines = filesToProcess === 1 ? MAX_FILE_LINES_SINGLE : MAX_FILE_LINES_MULTIPLE;

    // First, collect all valid files that we can process (fetch content and check size)
    interface ProcessableFile {
      filePath: string;
      content: string;
      sha: string;
    }
    const processableFiles: ProcessableFile[] = [];

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

        processableFiles.push({
          filePath,
          content: decodedContent,
          sha: fileContent.sha,
        });
      } catch (error) {
        results.push({
          file: filePath,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Select files to stress
    if (processableFiles.length === 0) {
      return NextResponse.json({
        message: "No processable files found",
        results,
        symptoms: [],
      });
    }

    // Select files to process (up to filesToProcess)
    const selectedFiles: ProcessableFile[] = [];
    const shuffledFiles = [...processableFiles].sort(() => Math.random() - 0.5); // Shuffle for randomness
    for (let i = 0; i < Math.min(filesToProcess, shuffledFiles.length); i++) {
      selectedFiles.push(shuffledFiles[i]);
    }

    // Mark unselected files as skipped
    for (const file of processableFiles) {
      if (!selectedFiles.includes(file)) {
        results.push({ 
          file: file.filePath, 
          success: false, 
          error: "Not selected for stress testing" 
        });
      }
    }

    // Distribute bugs across selected files
    // For simplicity, distribute bugs evenly (or as evenly as possible)
    const bugsPerFile = Math.floor(totalBugCount / selectedFiles.length);
    const remainingBugs = totalBugCount % selectedFiles.length;
    const bugDistribution: number[] = selectedFiles.map((_, index) => 
      bugsPerFile + (index < remainingBugs ? 1 : 0)
    );

    // Apply stress to each selected file
    for (let i = 0; i < selectedFiles.length; i++) {
      const selectedFile = selectedFiles[i];
      const bugsForThisFile = bugDistribution[i];

      try {
        const { filePath, content: decodedContent, sha } = selectedFile;
        
        // Use AI to introduce subtle stress with bugs for this file
        const { content: modifiedContent, changes, symptoms } = await introduceAIStress(
          decodedContent, 
          filePath, 
          stressContext, 
          stressLevel === "custom" ? "high" : stressLevel, // Use high subtlety for custom mode
          bugsForThisFile
        );

        // Only update if changes were made
        if (changes.length > 0 && modifiedContent !== decodedContent) {
          await updateFile(
            session.accessToken,
            owner,
            repo,
            filePath,
            modifiedContent,
            `🔥 ${filePath} is stressed out`,
            sha,
            branch
          );

          results.push({ file: filePath, success: true, changes, symptoms });
          allSymptoms.push(...symptoms);
        } else {
          results.push({ file: filePath, success: false, error: "No changes made" });
        }
      } catch (error) {
        results.push({
          file: selectedFile.filePath,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;

    // Deduplicate symptoms
    const uniqueSymptoms = [...new Set(allSymptoms)];

    // Create metadata file for performance tracking (only if stress was successful)
    if (successCount > 0) {
      const successfulResults = results.filter((r) => r.success);
      const allChanges = successfulResults.flatMap((r) => r.changes || []);
      
      const metadata: StressMetadata = {
        stressLevel: stressLevel === "custom" ? "high" : stressLevel, // Store as high for custom
        bugCount: totalBugCount,
        createdAt: new Date().toISOString(),
        symptoms: uniqueSymptoms,
        filesStressed: successfulResults.map((r) => r.file),
        changes: allChanges,
        originalCommitSha: originalCommitSha || "",
        owner,
        repo,
        branch,
      };

      try {
        await createStressMetadata(session.accessToken, metadata);
      } catch (metadataError) {
        // Log but don't fail the request if metadata creation fails
        console.error("Failed to create stress metadata:", metadataError);
      }
    }

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


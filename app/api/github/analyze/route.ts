import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchCommitDetails, StressMetadata } from "@/lib/github";
import { generateText, LanguageModel } from "ai";

/**
 * Feedback item returned by the analysis.
 */
export interface AnalysisFeedback {
  type: "success" | "warning" | "info" | "hint" | "tip";
  title: string;
  message: string;
  file?: string;
  /** Optional improvement suggestion for "tip" type feedback */
  improvement?: string;
}

/**
 * Response from the analyze endpoint.
 */
export interface AnalyzeResponse {
  feedback: AnalysisFeedback[];
  summary: string;
  isPerfect: boolean;
}

/** Supported AI providers */
type AIProvider = "anthropic" | "ollama" | "openai-compatible";

/**
 * Custom error class for AI analysis failures.
 */
class AIAnalysisError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "AIAnalysisError";
  }
}

/**
 * Resolves the AI provider to use based on environment variables.
 * Priority: AI_PROVIDER env var > auto-detect based on available keys > anthropic
 * 
 * @returns The configured AI provider
 */
function resolveAIProvider(): AIProvider {
  const explicitProvider = process.env.AI_PROVIDER?.toLowerCase();
  
  if (explicitProvider === "ollama") return "ollama";
  if (explicitProvider === "openai-compatible") return "openai-compatible";
  if (explicitProvider === "anthropic") return "anthropic";
  
  // Auto-detect based on available configuration
  if (process.env.AI_PROVIDER === "ollama" || (process.env.AI_MODEL && process.env.AI_PROVIDER !== "anthropic" && !process.env.ANTHROPIC_API_KEY)) return "ollama";
  if (process.env.OPENAI_COMPATIBLE_BASE_URL) return "openai-compatible";
  
  // Default to Anthropic
  return "anthropic";
}

/**
 * Creates the appropriate language model based on the configured provider.
 * Supports Anthropic (default), Ollama, and OpenAI-compatible local servers.
 * 
 * @returns Language model instance for the configured provider
 * @throws AIAnalysisError if the provider dependencies are not available
 */
async function createLanguageModel(): Promise<LanguageModel> {
  const provider = resolveAIProvider();
  console.log("[Analyze] Using AI provider:", provider);
  
  switch (provider) {
    case "ollama": {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let createOpenAICompatible: any;
      try {
        const compatModule = await import("@ai-sdk/openai-compatible");
        createOpenAICompatible = compatModule.createOpenAICompatible;
      } catch (error) {
        throw new AIAnalysisError(
          "OpenAI Compatible SDK not available for Ollama. Please ensure @ai-sdk/openai-compatible is installed.",
          error
        );
      }
      
      const baseURL = process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1";
      const model = process.env.AI_MODEL || "llama3";
      
      const ollama = createOpenAICompatible({
        name: "ollama",
        baseURL,
        headers: {
          Authorization: "Bearer ollama",
        },
      });
      
      return ollama.chatModel(model);
    }
    
    case "openai-compatible": {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let createOpenAICompatible: any;
      try {
        const compatModule = await import("@ai-sdk/openai-compatible");
        createOpenAICompatible = compatModule.createOpenAICompatible;
      } catch (error) {
        throw new AIAnalysisError(
          "OpenAI Compatible SDK not available. Please ensure @ai-sdk/openai-compatible is installed.",
          error
        );
      }
      
      const baseURL = process.env.OPENAI_COMPATIBLE_BASE_URL;
      if (!baseURL) {
        throw new AIAnalysisError(
          "OPENAI_COMPATIBLE_BASE_URL environment variable is required for openai-compatible provider."
        );
      }
      
      const model = process.env.OPENAI_COMPATIBLE_MODEL || "default";
      const apiKey = process.env.OPENAI_COMPATIBLE_API_KEY || "not-needed";
      
      const openaiCompatible = createOpenAICompatible({
        name: "openai-compatible",
        baseURL,
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
      
      return openaiCompatible.chatModel(model);
    }
    
    case "anthropic":
    default: {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new AIAnalysisError(
          "ANTHROPIC_API_KEY environment variable is not set."
        );
      }
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let anthropic: any;
      try {
        const anthropicModule = await import("@ai-sdk/anthropic");
        anthropic = anthropicModule.anthropic;
      } catch (error) {
        throw new AIAnalysisError(
          "AI SDK not available. Please ensure @ai-sdk/anthropic is installed.",
          error
        );
      }
      
      return anthropic(process.env.AI_MODEL || "claude-sonnet-4-20250514");
    }
  }
}

/**
 * Uses AI to analyze the user's code fix and provide detailed feedback.
 * 
 * @param patches - Array of file patches (diffs) from the commit
 * @param metadata - Optional buggr metadata describing what bugs were introduced
 * @returns Analysis response with feedback, summary, and isPerfect flag
 */
async function analyzeWithAI(
  patches: { filename: string; patch: string; status: string }[],
  metadata: StressMetadata | null
): Promise<AnalyzeResponse> {
  const model = await createLanguageModel();
  
  // Format the patches for the prompt
  const patchesText = patches
    .map((p) => `FILE: ${p.filename} (${p.status})\n\`\`\`diff\n${p.patch || "No changes"}\n\`\`\``)
    .join("\n\n");
  
  // Build context about the bugs that were introduced
  let bugContext = "";
  if (metadata) {
    bugContext = `
## CONTEXT: What bugs were introduced

The user was debugging a "${metadata.stressLevel}" difficulty challenge with ${metadata.bugCount} bug(s).

### Files that were bugged:
${metadata.filesBuggered.map((f) => `- ${f}`).join("\n")}

### Technical changes that were made (the bugs):
${metadata.changes.map((c, i) => `${i + 1}. ${c}`).join("\n")}

### Symptoms the bugs caused:
${metadata.symptoms.map((s, i) => `${i + 1}. ${s}`).join("\n")}

Use this context to evaluate if the user properly fixed ALL the bugs and cleaned up their code.
`;
  }
  
  const prompt = `You are an expert code reviewer analyzing a user's debugging fix. Your job is to:
1. Evaluate if they correctly fixed the bugs
2. Point out any issues with their fix (leftover code, incomplete fixes, etc.)
3. Provide helpful tips on better approaches when applicable

${bugContext}

## THE USER'S FIX (diff format: + = added lines, - = removed lines)

${patchesText}

## YOUR ANALYSIS

Analyze the code changes and provide feedback. Be helpful and educational, not harsh.

IMPORTANT GUIDELINES:
- If the fix looks good, say so! Don't invent problems.
- If they left unnecessary code (like a function that now does nothing), point it out.
- If their fix works but there's a cleaner/better way, explain it as a "tip" with the improvement.
- Check if they addressed all the bugged files (if metadata provided).
- Look for common issues: pass-through functions, commented-out code, debug statements left in.

Respond with ONLY a JSON object in this exact format (no markdown, no explanation):
{
  "feedback": [
    {
      "type": "success|warning|info|hint|tip",
      "title": "Short title",
      "message": "Detailed explanation",
      "file": "optional/filename.ts",
      "improvement": "optional - only for 'tip' type - explain the better approach"
    }
  ],
  "summary": "One sentence overall assessment",
  "isPerfect": true/false
}

FEEDBACK TYPES:
- "success": Things the user did well (e.g., "Correctly fixed the comparison operator")
- "warning": Issues that should be fixed (e.g., "Left a pass-through function that does nothing")
- "info": Neutral observations (e.g., "This file had bugs that were addressed")
- "hint": Suggestions that aren't critical (e.g., "Consider removing commented-out code")
- "tip": "This works, but here's a better way" suggestions with the "improvement" field explaining why

IMPORTANT:
- Be concise but helpful
- Provide 2-6 feedback items (don't overwhelm the user)
- isPerfect should be true only if there are no warnings or hints
- Always include at least one piece of feedback
- For tips, the "message" should acknowledge what works, and "improvement" should explain the better approach`;

  try {
    console.log("[Analyze] Sending to AI for analysis...");
    const startTime = Date.now();
    
    const { text } = await generateText({
      model,
      prompt,
    });
    
    const duration = Date.now() - startTime;
    console.log(`[Analyze] AI response received in ${duration}ms`);
    
    if (!text || text.trim().length < 20) {
      throw new AIAnalysisError("AI returned empty or insufficient response");
    }
    
    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[Analyze] No JSON found in response:", text.substring(0, 500));
      throw new AIAnalysisError("Failed to parse AI response - no JSON found");
    }
    
    const parsed = JSON.parse(jsonMatch[0]) as AnalyzeResponse;
    
    // Validate the response structure
    if (!parsed.feedback || !Array.isArray(parsed.feedback)) {
      throw new AIAnalysisError("Invalid AI response - missing feedback array");
    }
    
    if (typeof parsed.summary !== "string") {
      parsed.summary = "Analysis complete.";
    }
    
    if (typeof parsed.isPerfect !== "boolean") {
      parsed.isPerfect = !parsed.feedback.some(
        (f) => f.type === "warning" || f.type === "hint"
      );
    }
    
    console.log(`[Analyze] Parsed ${parsed.feedback.length} feedback items`);
    return parsed;
    
  } catch (error) {
    if (error instanceof AIAnalysisError) {
      throw error;
    }
    console.error("[Analyze] AI analysis error:", error);
    throw new AIAnalysisError(
      `AI analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      error
    );
  }
}

/**
 * POST /api/github/analyze
 * 
 * Analyzes the code changes in a commit using AI and provides feedback.
 * Uses the buggr metadata to provide contextual feedback about the fix.
 * 
 * @param owner - Repository owner
 * @param repo - Repository name  
 * @param sha - Commit SHA to analyze
 * @param stressMetadata - Optional buggr metadata for contextual analysis
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
    const { owner, repo, sha, stressMetadata } = body as {
      owner: string;
      repo: string;
      sha: string;
      stressMetadata?: StressMetadata;
    };

    if (!owner || !repo || !sha) {
      return NextResponse.json(
        { error: "Missing owner, repo, or sha parameter" },
        { status: 400 }
      );
    }

    // Fetch the commit details including the diff
    const commitDetails = await fetchCommitDetails(session.accessToken, owner, repo, sha);
    
    // Extract patches from the commit files
    const patches = commitDetails.files.map((file) => ({
      filename: file.filename,
      patch: file.patch || "",
      status: file.status,
    }));
    
    // Use AI to analyze the code
    const analysisResult = await analyzeWithAI(patches, stressMetadata || null);

    return NextResponse.json(analysisResult);
  } catch (error) {
    console.error("[Analyze] Error:", error);
    
    // Return a user-friendly error
    const errorMessage = error instanceof AIAnalysisError
      ? error.message
      : "Failed to analyze code. Please try again.";
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

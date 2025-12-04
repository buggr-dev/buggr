import { generateText } from "ai";

/**
 * Uses AI to introduce subtle but nasty breaking changes to code.
 * The changes should be realistic bugs that require debugging skills to find and fix.
 * 
 * Requires ANTHROPIC_API_KEY environment variable to be set.
 * 
 * @param content - Original file content
 * @param filename - Name of the file
 * @returns Modified content with AI-generated breaking changes and description of changes
 */
export async function introduceAIChaos(
  content: string,
  filename: string
): Promise<{ content: string; changes: string[] }> {
  // Dynamic import to handle optional dependency
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let anthropic: any;
  try {
    // @ts-expect-error - dynamic import of optional dependency
    const anthropicModule = await import("@ai-sdk/anthropic");
    anthropic = anthropicModule.anthropic;
  } catch {
    console.warn("@ai-sdk/anthropic not installed, using fallback chaos");
    return fallbackChaos(content, filename);
  }

  const prompt = `You are a chaos engineer tasked with introducing subtle but breaking bugs into code. 
Your goal is to make changes that:
1. Will cause the code to fail or behave incorrectly
2. Are subtle and realistic - the kind of bugs developers actually make
3. Require debugging skills and code knowledge to identify and fix
4. Are NOT obvious syntax errors that an IDE would immediately catch

Types of subtle bugs to introduce (pick 2-3):
- Off-by-one errors in loops or array access
- Incorrect comparison operators (< vs <=, == vs ===)
- Wrong variable names that are similar to correct ones
- Async/await issues (missing await, race conditions)
- Incorrect null/undefined checks
- Wrong order of operations
- Incorrect string concatenation or template literals
- Wrong boolean logic (AND vs OR, negation errors)
- Incorrect type coercion
- Missing or incorrect error handling
- Wrong function arguments or parameter order
- Incorrect regex patterns
- Timezone or date handling errors
- Floating point comparison issues

Here is the code to modify:

FILENAME: ${filename}
\`\`\`
${content}
\`\`\`

Respond with ONLY a JSON object in this exact format (no markdown, no explanation):
{
  "modifiedCode": "the complete modified code with bugs introduced",
  "changes": ["description of bug 1", "description of bug 2", "description of bug 3"]
}

The modifiedCode must be the COMPLETE file content with your bugs inserted. Do not truncate or summarize.`;

  try {
    const { text } = await generateText({
      model: anthropic("claude-sonnet-4-20250514"),
      prompt,
    });

    // Parse the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    if (!parsed.modifiedCode || !parsed.changes) {
      throw new Error("Invalid AI response structure");
    }

    return {
      content: parsed.modifiedCode,
      changes: parsed.changes,
    };
  } catch (error) {
    console.error("AI chaos generation failed:", error);
    // Fallback to basic chaos if AI fails
    return fallbackChaos(content, filename);
  }
}

/**
 * Fallback chaos function if AI is unavailable.
 * Introduces realistic but simpler bugs.
 */
function fallbackChaos(content: string, filename: string): { content: string; changes: string[] } {
  const changes: string[] = [];
  let modifiedContent = content;
  const ext = filename.split(".").pop()?.toLowerCase();
  
  // TypeScript/JavaScript specific chaos
  if (["ts", "tsx", "js", "jsx"].includes(ext || "")) {
    // Chaos 1: Flip a comparison operator
    if (modifiedContent.includes(" === ")) {
      modifiedContent = modifiedContent.replace(" === ", " !== ");
      changes.push("Inverted a strict equality check (=== → !==)");
    } else if (modifiedContent.includes(" == ")) {
      modifiedContent = modifiedContent.replace(" == ", " != ");
      changes.push("Inverted an equality check (== → !=)");
    }

    // Chaos 2: Change a < to <= (off-by-one)
    const loopMatch = modifiedContent.match(/for\s*\([^;]+;\s*\w+\s*<\s*\w+/);
    if (loopMatch) {
      modifiedContent = modifiedContent.replace(
        loopMatch[0],
        loopMatch[0].replace(" < ", " <= ")
      );
      changes.push("Changed loop boundary from < to <= (off-by-one error)");
    }

    // Chaos 3: Change && to || or vice versa
    if (modifiedContent.includes(" && ") && !changes.some(c => c.includes("&&"))) {
      modifiedContent = modifiedContent.replace(" && ", " || ");
      changes.push("Changed logical AND (&&) to OR (||)");
    }

    // Chaos 4: Remove an 'await' keyword
    const awaitMatch = modifiedContent.match(/await\s+\w+\(/);
    if (awaitMatch) {
      modifiedContent = modifiedContent.replace(awaitMatch[0], awaitMatch[0].replace("await ", ""));
      changes.push("Removed 'await' keyword (async operation now unhandled)");
    }

    // Chaos 5: Change .length to .length - 1 or vice versa
    if (modifiedContent.includes(".length]")) {
      modifiedContent = modifiedContent.replace(".length]", ".length - 1]");
      changes.push("Changed array access from .length to .length - 1");
    } else if (modifiedContent.includes(".length - 1]")) {
      modifiedContent = modifiedContent.replace(".length - 1]", ".length]");
      changes.push("Changed array access from .length - 1 to .length (out of bounds)");
    }
  }

  // If no specific changes were made, add a generic one
  if (changes.length === 0) {
    // Find and flip any boolean
    if (modifiedContent.includes("true")) {
      modifiedContent = modifiedContent.replace("true", "false");
      changes.push("Changed a 'true' value to 'false'");
    } else if (modifiedContent.includes("false")) {
      modifiedContent = modifiedContent.replace("false", "true");
      changes.push("Changed a 'false' value to 'true'");
    }
  }

  // Last resort
  if (changes.length === 0) {
    changes.push("No automatic changes could be applied - file may need manual review");
  }

  return { content: modifiedContent, changes };
}

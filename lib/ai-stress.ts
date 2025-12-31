import { generateText } from "ai";
import { BugType, BUG_TYPES } from "./bug-types";

/** Stress level configuration */
type StressLevel = "low" | "medium" | "high";

interface StressConfig {
  bugCount: number;
  subtlety: string;
  description: string;
}

const STRESS_CONFIGS: Record<StressLevel, StressConfig> = {
  low: {
    bugCount: 2,
    subtlety: "relatively obvious",
    description: "The bugs should be somewhat noticeable - things like obvious operator mistakes, clear logic inversions, or simple typos in variable names. A junior developer should be able to spot them with careful review. Keep the code structure simple and don't add extra abstraction layers.",
  },
  medium: {
    bugCount: 4,
    subtlety: "subtle but findable",
    description: "The bugs should require careful code review to find - off-by-one errors, missing awaits that cause Promise objects to be used as values, edge case failures. A mid-level developer should need to trace through the logic to find them. You SHOULD add 1-2 'data layer' helper functions that data passes through before being used - mimicking technical debt where someone added abstraction layers 'for future flexibility'. The bug can be hidden in these intermediate functions. All bugs must be deterministic and reproducible.",
  },
  high: {
    bugCount: 6,
    subtlety: "deviously subtle",
    description: "The bugs should be very hard to find but ALWAYS reproducible - subtle state mutations, edge cases with specific inputs, cascading errors where one bug masks another. Even senior developers should need debugging tools and careful analysis. You MUST add multiple 'data layer' functions that pipe data through 2-4 transformation steps before it reaches its destination - realistic 'legacy code' technical debt where data flows through normalizers, formatters, validators, mappers, etc. Hide bugs deep in these pipelines where a developer must trace the entire data flow to find them. This should mimic real legacy codebases with accumulated abstractions. IMPORTANT: All bugs must be 100% deterministic - no race conditions or timing-dependent issues.",
  },
};


/**
 * Detects the framework/library used in the code based on content and filename.
 * 
 * @param content - File content to analyze
 * @param filename - Filename to check for framework-specific patterns
 * @returns Detected framework(s) as an array (e.g., ["react", "nextjs"])
 */
function detectFramework(content: string, filename: string): string[] {
  const frameworks: string[] = [];
  const lowerContent = content.toLowerCase();
  const lowerFilename = filename.toLowerCase();

  // React detection
  if (
    lowerContent.includes("useState") ||
    lowerContent.includes("useEffect") ||
    lowerContent.includes("useCallback") ||
    lowerContent.includes("useMemo") ||
    lowerContent.includes("useRef") ||
    lowerContent.includes("react.") ||
    lowerContent.includes("from 'react'") ||
    lowerContent.includes('from "react"') ||
    lowerFilename.endsWith(".jsx") ||
    lowerFilename.endsWith(".tsx")
  ) {
    frameworks.push("react");
  }

  // Next.js detection
  if (
    lowerContent.includes("next/") ||
    lowerContent.includes("useRouter") ||
    lowerContent.includes("usePathname") ||
    lowerContent.includes("useSearchParams") ||
    lowerContent.includes("getServerSideProps") ||
    lowerContent.includes("getStaticProps") ||
    lowerContent.includes("metadata") ||
    lowerContent.includes("generateMetadata") ||
    lowerFilename.includes("page.tsx") ||
    lowerFilename.includes("layout.tsx") ||
    lowerFilename.includes("route.ts")
  ) {
    frameworks.push("nextjs");
  }

  return frameworks;
}

/**
 * Selects random bug types ensuring variety across categories.
 * Uses Fisher-Yates shuffle for true randomness.
 * 
 * Any bug type can be selected regardless of stress level - difficulty comes from
 * the number of bugs and how they're implemented (abstraction layers, helper functions, etc.).
 * Framework-specific bugs are prioritized when the framework is detected.
 * 
 * @param count - Number of bug types to select
 * @param content - File content for framework detection
 * @param filename - Filename for framework detection
 * @param _stressLevel - Stress level (unused, kept for API compatibility)
 * @returns Array of randomly selected bug types
 */
function selectRandomBugTypes(count: number, content: string, filename: string, _stressLevel: StressLevel): BugType[] {
  // Detect framework
  const detectedFrameworks = detectFramework(content, filename);
  
  // Separate framework-specific bugs from general bugs
  const frameworkBugs = BUG_TYPES.filter(bug => 
    bug.framework && detectedFrameworks.includes(bug.framework)
  );
  const generalBugs = BUG_TYPES.filter(bug => !bug.framework);
  
  // Shuffle both lists
  const shuffleArray = <T>(arr: T[]): T[] => {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };
  
  const shuffledFrameworkBugs = shuffleArray(frameworkBugs);
  const shuffledGeneralBugs = shuffleArray(generalBugs);
  
  // If framework detected and we have framework bugs, do 50/50 split
  const shouldDoBalancedSplit = detectedFrameworks.length > 0 && frameworkBugs.length > 0;
  
  if (shouldDoBalancedSplit) {
    // Calculate 50/50 split (round framework bugs up if odd)
    const frameworkCount = Math.ceil(count / 2);
    const generalCount = count - frameworkCount;
    
    const selected: BugType[] = [];
    const usedCategories = new Set<string>();
    
    // Helper function to select bugs ensuring category variety
    const selectWithVariety = (
      bugPool: BugType[],
      targetCount: number,
      usedCategoriesSet: Set<string>
    ): BugType[] => {
      const selectedBugs: BugType[] = [];
      
      // First pass: pick one from each category
      for (const bug of bugPool) {
        if (selectedBugs.length >= targetCount) break;
        if (!usedCategoriesSet.has(bug.category)) {
          selectedBugs.push(bug);
          usedCategoriesSet.add(bug.category);
        }
      }
      
      // Second pass: if we still need more, allow category repeats
      for (const bug of bugPool) {
        if (selectedBugs.length >= targetCount) break;
        if (!selectedBugs.includes(bug)) {
          selectedBugs.push(bug);
        }
      }
      
      return selectedBugs;
    };
    
    // Select framework bugs (up to available count)
    const availableFrameworkCount = Math.min(frameworkCount, shuffledFrameworkBugs.length);
    const selectedFrameworkBugs = selectWithVariety(
      shuffledFrameworkBugs,
      availableFrameworkCount,
      usedCategories
    );
    selected.push(...selectedFrameworkBugs);
    
    // Select general bugs (fill remaining slots)
    const remainingCount = count - selected.length;
    if (remainingCount > 0) {
      const selectedGeneralBugs = selectWithVariety(
        shuffledGeneralBugs,
        remainingCount,
        usedCategories
      );
      selected.push(...selectedGeneralBugs);
    }
    
    return selected;
  }
  
  // No framework detected or no framework bugs available - use all bugs
  const allBugs = [...shuffledFrameworkBugs, ...shuffledGeneralBugs];
  const selected: BugType[] = [];
  const usedCategories = new Set<string>();

  // First pass: pick one from each category
  for (const bug of allBugs) {
    if (selected.length >= count) break;
    if (!usedCategories.has(bug.category)) {
      selected.push(bug);
      usedCategories.add(bug.category);
    }
  }

  // Second pass: if we still need more, allow category repeats
  for (const bug of allBugs) {
    if (selected.length >= count) break;
    if (!selected.includes(bug)) {
      selected.push(bug);
    }
  }

  return selected;
}

/**
 * Formats selected bug types into a prompt instruction for the AI.
 * 
 * @param bugTypes - The bug types to format
 * @returns Formatted string describing the bugs to introduce
 */
function formatBugInstructions(bugTypes: BugType[]): string {
  return bugTypes.map((bug, index) => {
    const examples = bug.examples.map(ex => `    - ${ex}`).join("\n");
    return `BUG ${index + 1}: ${bug.name} (${bug.category})
  Description: ${bug.description}
  Examples:
${examples}
  Expected symptom: "${bug.sampleSymptom}"`;
  }).join("\n\n");
}

/**
 * Custom error class for AI stress generation failures.
 */
export class AIStressError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "AIStressError";
  }
}

/**
 * Uses AI to introduce subtle but nasty breaking changes to code.
 * The changes should be realistic bugs that require debugging skills to find and fix.
 * 
 * Requires ANTHROPIC_API_KEY environment variable to be set.
 * 
 * @param content - Original file content
 * @param filename - Name of the file
 * @param context - Optional context about what specific areas to focus bugs on (max 200 chars)
 * @param stressLevel - Stress level: "low", "medium", or "high"
 * @param targetBugCount - Optional specific number of bugs to introduce (overrides stress level bug count)
 * @returns Modified content with AI-generated breaking changes, descriptions, and user-facing symptoms
 * @throws AIStressError if AI is unavailable or fails to generate bugs
 */
export async function introduceAIStress(
  content: string,
  filename: string,
  context?: string,
  stressLevel: StressLevel = "medium",
  targetBugCount?: number
): Promise<{ content: string; changes: string[]; symptoms: string[] }> {
  // Dynamic import to handle optional dependency
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let anthropic: any;
  try {
    const anthropicModule = await import("@ai-sdk/anthropic");
    anthropic = anthropicModule.anthropic;
  } catch (error) {
    throw new AIStressError(
      "AI SDK not available. Please ensure @ai-sdk/anthropic is installed and ANTHROPIC_API_KEY is set.",
      error
    );
  }

  const config = STRESS_CONFIGS[stressLevel];

  // Calculate bug count
  const bugCount = targetBugCount !== undefined 
    ? targetBugCount 
    : config.bugCount;
  
  // RANDOMIZE: Select specific bug types before calling AI
  const selectedBugs = selectRandomBugTypes(bugCount, content, filename, stressLevel);
  const bugInstructions = formatBugInstructions(selectedBugs);
  
  // Detect framework for prompt enhancement
  const detectedFrameworks = detectFramework(content, filename);
  const frameworkInstruction = detectedFrameworks.length > 0
    ? `\n\nFRAMEWORK DETECTED: ${detectedFrameworks.join(", ").toUpperCase()}\nWhen introducing bugs, prioritize framework-specific issues like hooks, component lifecycle, prop drilling, JSX rendering, etc. Make sure framework-specific bugs are realistic and follow framework patterns.`
    : "";
  
  // Build optional focus area instruction
  const focusInstruction = context 
    ? `\n\nFOCUS AREA: The user wants to specifically test: "${context}"\nTry to apply the bugs in areas related to this focus when possible.`
    : "";
  
  const prompt = `You are a stress engineer introducing specific bugs into code for a debugging training game.

STRESS LEVEL: ${stressLevel.toUpperCase()}
${config.description}

YOU MUST INTRODUCE EXACTLY THESE ${bugCount} BUG(S):

${bugInstructions}

${focusInstruction}

${frameworkInstruction}

CRITICAL RULES:
1. Introduce EXACTLY the bugs listed above - do not substitute or add different bugs
2. Each bug description tells you WHAT to do and gives examples - follow them closely
3. Do NOT add comments that reveal bug locations (no "// bug here" or hints)
4. Do NOT make syntax errors that IDEs would catch immediately
5. Bugs must be DETERMINISTIC - same behavior every time with same input
6. You MAY add helper functions to hide bugs (especially for medium/high stress)
7. The code must still compile/parse correctly

THE SCENARIO - A careless developer:
Imagine the code was written by a sloppy developer who:
- Never writes tests or double-checks their work
- Copies and pastes code without understanding it
- Makes "quick fixes" that break other things
- Gets confused by their own code
- Makes typos and doesn't proofread

Here is the code to modify:

FILENAME: ${filename}
\`\`\`
${content}
\`\`\`

Respond with ONLY a JSON object in this exact format (no markdown, no explanation):
{
  "modifiedCode": "the complete modified code with bugs introduced",
  "changes": ["technical description of bug 1", "technical description of bug 2"],
  "symptoms": ["Detailed bug report 1", "Detailed bug report 2"]
}

IMPORTANT about "symptoms": Write these like bug reports from a QA tester who sees the UI, not the code:
- Format: "[Location/Action]: [What went wrong]. Expected [X] but got [Y]."
- Do NOT mention variable names, function names, or line numbers
- Describe what the user SEES, not what the code does

The modifiedCode must be the COMPLETE file content. Do not truncate or summarize.`;

  try {
    const { text } = await generateText({
      model: anthropic("claude-sonnet-4-20250514"),
      prompt,
    });

    // Parse the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new AIStressError("Failed to parse AI response - no JSON found in output");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    if (!parsed.modifiedCode || !parsed.changes) {
      throw new AIStressError("Invalid AI response structure - missing modifiedCode or changes");
    }

    return {
      content: parsed.modifiedCode,
      changes: parsed.changes,
      symptoms: parsed.symptoms || selectedBugs.map(b => b.sampleSymptom),
    };
  } catch (error) {
    if (error instanceof AIStressError) {
      throw error;
    }
    throw new AIStressError(
      "AI stress generation failed. Please check your API key and try again.",
      error
    );
  }
}

/**
 * Generates detailed bug report descriptions from technical change descriptions.
 * Used as a fallback when AI doesn't provide symptoms.
 * 
 * @param changes - Array of technical change descriptions
 * @returns Array of detailed bug report descriptions
 */
function generateFallbackSymptoms(changes: string[]): string[] {
  const symptomTemplates = [
    "On the main list page: The last 2 items are completely missing. We have 10 items but only 8 show up on screen.",
    "In the search bar: The first letter of every search is being cut off. Typing 'Apple' searches for 'pple' instead.",
    "On the cards/list view: Every single item shows the same ID number. All 50 items display 'ID: 1001' even though they should be unique.",
    "In the user profile section: All names are showing as 'undefined'. The other fields load fine but names are blank.",
    "After loading the page: App crashes with white screen. Console shows 'Cannot read property of null' error.",
    "On the dashboard: All totals and prices show $0.00. We have items worth hundreds of dollars but everything displays as zero.",
    "In the item grid: Half the items are completely blank. Every other card (items 2, 4, 6, 8...) shows as empty.",
    "When viewing the list: Items that should be visible are hidden, and hidden items are showing. The display logic is completely inverted.",
    "On the counter display: Shows '3 items' but there are clearly 5 items on screen. The count is always 2 less than actual.",
    "In the text fields: The last few characters are cut off from every label. 'Description' shows as 'Descript', 'Username' shows as 'Userna'.",
  ];
  
  // Pick random symptoms based on number of changes
  const numSymptoms = Math.min(changes.length, 3);
  shuffleArray(symptomTemplates);
  return symptomTemplates.slice(0, numSymptoms);
}

/**
 * Shuffles an array in place using Fisher-Yates algorithm.
 * 
 * @param array - Array to shuffle
 * @returns The shuffled array (same reference)
 */
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

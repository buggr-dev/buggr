import { generateText } from "ai";

/** Stress level configuration */
type StressLevel = "low" | "medium" | "high";

interface StressConfig {
  bugCountMin: number;
  bugCountMax: number;
  subtlety: string;
  description: string;
}

const STRESS_CONFIGS: Record<StressLevel, StressConfig> = {
  low: {
    bugCountMin: 1,
    bugCountMax: 2,
    subtlety: "relatively obvious",
    description: "The bugs should be somewhat noticeable - things like obvious operator mistakes, clear logic inversions, or simple typos in variable names. A junior developer should be able to spot them with careful review.",
  },
  medium: {
    bugCountMin: 2,
    bugCountMax: 3,
    subtlety: "subtle but findable",
    description: "The bugs should require careful code review to find - off-by-one errors, subtle async issues, edge case failures. A mid-level developer should need to trace through the logic to find them. You MAY optionally add some convoluted or overly-complex code that obscures the bug - realistic 'clever' code that a developer might write.",
  },
  high: {
    bugCountMin: 3,
    bugCountMax: 5,
    subtlety: "deviously subtle",
    description: "The bugs should be very hard to find - race conditions, subtle state mutations, edge cases that only fail under specific conditions, cascading errors where one bug masks another. Even senior developers should need debugging tools and careful analysis. You are ENCOURAGED to add bloated, spaghetti code - overly nested logic, unnecessary abstractions, confusing control flow - that makes bugs harder to trace. This should still be 'realistic' code that an over-engineering developer might actually write.",
  },
};

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
 * @returns Modified content with AI-generated breaking changes, descriptions, and user-facing symptoms
 */
export async function introduceAIStress(
  content: string,
  filename: string,
  context?: string,
  stressLevel: StressLevel = "medium"
): Promise<{ content: string; changes: string[]; symptoms: string[] }> {
  // Dynamic import to handle optional dependency
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let anthropic: any;
  try {
    const anthropicModule = await import("@ai-sdk/anthropic");
    anthropic = anthropicModule.anthropic;
  } catch {
    console.warn("@ai-sdk/anthropic not installed, using fallback stress");
    return fallbackStress(content, filename, context, stressLevel);
  }

  const config = STRESS_CONFIGS[stressLevel];

  // Generate a random seed to encourage variety
  const randomSeed = Math.random().toString(36).substring(2, 15);
  const bugCount = Math.floor(Math.random() * (config.bugCountMax - config.bugCountMin + 1)) + config.bugCountMin;
  
  // Build optional focus area instruction
  const focusInstruction = context 
    ? `\n\nFOCUS AREA: The user wants to specifically test: "${context}"\nPrioritize bugs related to this focus area when possible, but still be unpredictable.`
    : "";
  
  const prompt = `You are a stress engineer tasked with introducing ${config.subtlety} breaking bugs into code.
  
STRESS LEVEL: ${stressLevel.toUpperCase()}
${config.description}

IMPORTANT: Be UNPREDICTABLE. Each time you modify code, choose DIFFERENT types of bugs. Do not fall into patterns.${focusInstruction}

CRITICAL - DO NOT REVEAL BUG LOCATIONS:
- Do NOT add comments near bugs like "// bug here" or "// TODO: fix this"
- Do NOT add comments that hint at what was changed
- Do NOT make the bugs obvious through naming or comments
- You MAY add realistic developer comments (like normal code would have), but these must NOT reveal the bug location
- The goal is for the developer to FIND the bugs through debugging, not through reading comments

THE SCENARIO - A careless developer:
This is for a learning game. Imagine the code was written by a careless, sloppy developer who:
- Never writes tests or double-checks their work
- Copies and pastes code without understanding it
- Makes "quick fixes" that break other things
- Over-engineers simple solutions
- Leaves half-finished refactors
- Doesn't handle edge cases
- Gets confused by their own code
- Makes typos and doesn't proofread

The bugs can be somewhat over-the-top - this is a game after all! Just keep a small thread of plausibility.
Think: "a bad developer COULD have done this" rather than "a good developer might accidentally do this"

Your goal is to make changes that:
1. Will cause the code to fail or behave incorrectly
2. Could plausibly be written by a careless/incompetent developer
3. Match the ${stressLevel} stress level described above
4. Are NOT obvious syntax errors that an IDE would immediately catch
5. Are VARIED - do not always use the same bug patterns
6. You MAY add NEW code (helper functions, utilities) that introduces bugs - not just modify existing code
7. Do NOT leave any hints in comments about where bugs are located
8. Can be over-the-top but should still have a thread of "someone could have written this"

Random seed for this session: ${randomSeed}
Number of bugs to introduce: ${bugCount} (stress level: ${stressLevel})

Choose ${bugCount} bugs RANDOMLY from this list (vary your choices each time!):

MODIFICATION BUGS (change existing code):
- Off-by-one errors in loops or array access (e.g., < vs <=, [i] vs [i-1])
- Incorrect comparison operators (< vs <=, == vs ===, > vs >=)
- Swapping similar variable names (e.g., user vs users, item vs items, data vs result)
- Async/await issues (missing await, extra await, race conditions)
- Incorrect null/undefined checks (removing ?, adding unnecessary ?., wrong nullish coalescing)
- Wrong order of operations or precedence issues
- String bugs (wrong concatenation, template literal errors, missing interpolation)
- Boolean logic errors (AND vs OR, De Morgan's law violations, double negations)
- Type coercion bugs (Number vs parseInt, implicit conversions)
- Missing or swapped error handling
- Wrong function arguments or swapped parameter order
- Regex pattern bugs (missing escapes, wrong quantifiers, greedy vs lazy)
- Date/time bugs (timezone issues, wrong format, off-by-one month)
- Floating point comparison bugs
- Array method bugs (map vs forEach, find vs filter, wrong callback return)
- Object property access bugs (dot vs bracket, wrong key names)
- Scope/closure bugs (var vs let, stale closures)
- Math bugs (wrong operator, integer division, modulo errors)
- Return statement bugs (missing return, wrong value, early return)
- Initialization bugs (wrong default values, undefined initial state)

UI/RUNTIME CRASH BUGS:
- Remove null/undefined guards causing crashes (accessing .property on null)
- Remove optional chaining causing "Cannot read property of undefined"
- Access array elements without bounds checking
- Call methods on potentially null objects
- Render undefined/null values in UI components
- Missing key props in list rendering (React)
- Incorrect conditional rendering that crashes on null data

NEW CODE INJECTION BUGS (add troublesome new code):
- Add a "helper" function that subtly transforms data incorrectly and use it
- Add a utility that has an off-by-one error or wrong boundary condition
- Add a wrapper function that swallows errors silently
- Add a caching/memoization helper that returns stale data
- Add a validation function that has incorrect logic
- Add a formatter/transformer that corrupts data in edge cases
- Add a debounce/throttle wrapper with incorrect timing
- Add an event handler that doesn't clean up properly

CODE COMPLEXITY BUGS (medium/high stress only - make code harder to follow):
- Add unnecessary nested ternaries that hide bugs
- Create overly abstracted wrapper functions with bugs buried inside
- Add convoluted Promise chains or callback pyramids
- Introduce unnecessary indirection (function calls function calls function)
- Add "clever" one-liners that are hard to parse and contain bugs
- Create complex reduce/map chains with subtle errors
- Add unnecessary state transformations that obscure data flow
- Wrap simple logic in overly complex class structures
- Add confusing variable reassignments that make tracking state difficult
- Create deeply nested conditionals with subtle logic errors

Here is the code to modify:

FILENAME: ${filename}
\`\`\`
${content}
\`\`\`

Respond with ONLY a JSON object in this exact format (no markdown, no explanation):
{
  "modifiedCode": "the complete modified code with bugs introduced",
  "changes": ["technical description of bug 1", "technical description of bug 2"],
  "symptoms": ["User-facing symptom 1 - what a QA tester would report", "User-facing symptom 2"]
}

IMPORTANT about "symptoms": These should be written like bug reports from a confused user or QA tester who doesn't know the code. Examples:
- "The posts are showing up blank"
- "When I click submit, nothing happens"
- "The app crashes when I select an item from the list"
- "The total price is wrong - it's missing some items"
- "The page takes forever to load and then shows an error"
- "Some users' names are showing as 'undefined'"
Do NOT mention code, variables, functions, or technical details in symptoms. Just describe what's broken from a user's perspective.

The modifiedCode must be the COMPLETE file content with your bugs inserted. Do not truncate or summarize.
You CAN add new functions, helpers, or code - not just modify existing code. If you add a helper function, make sure to actually USE it somewhere in the existing code so the bug manifests.`;

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
      symptoms: parsed.symptoms || generateFallbackSymptoms(parsed.changes),
    };
  } catch (error) {
    console.error("AI stress generation failed:", error);
    // Fallback to basic stress if AI fails
    return fallbackStress(content, filename, context, stressLevel);
  }
}

/**
 * Generates user-friendly symptom descriptions from technical change descriptions.
 * Used as a fallback when AI doesn't provide symptoms.
 * 
 * @param changes - Array of technical change descriptions
 * @returns Array of user-friendly symptom descriptions
 */
function generateFallbackSymptoms(changes: string[]): string[] {
  const symptomTemplates = [
    "Something seems off with how the data is displayed",
    "The page isn't working correctly",
    "I'm seeing unexpected behavior when interacting with the UI",
    "Some items appear to be missing or incorrect",
    "The app seems slower or unresponsive at times",
    "Error messages are appearing unexpectedly",
    "Data doesn't seem to be saving properly",
    "The calculations appear to be wrong",
    "Some features aren't responding to clicks",
    "The list is showing duplicates or missing entries",
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

/**
 * Represents a stress mutation that can be applied to code.
 */
interface StressMutation {
  name: string;
  /** Check if this mutation can be applied */
  canApply: (content: string) => boolean;
  /** Apply the mutation and return the modified content */
  apply: (content: string) => string;
  /** Description of what the mutation does */
  description: string;
}

/**
 * Fallback stress function if AI is unavailable.
 * Randomly selects and applies mutations based on stress level.
 * 
 * @param content - Original file content
 * @param filename - Name of the file being modified
 * @param _context - Optional context (unused in fallback, but accepted for API compatibility)
 * @param stressLevel - Stress level determines number of bugs to apply
 * @returns Modified content, list of changes made, and user-facing symptoms
 */
function fallbackStress(content: string, filename: string, _context?: string, stressLevel: StressLevel = "medium"): { content: string; changes: string[]; symptoms: string[] } {
  const changes: string[] = [];
  let modifiedContent = content;
  const ext = filename.split(".").pop()?.toLowerCase();
  
  // Get bug count based on stress level
  const config = STRESS_CONFIGS[stressLevel];
  
  // Define all possible mutations for TypeScript/JavaScript
  const jsMutations: StressMutation[] = [
    {
      name: "invertStrictEquality",
      canApply: (c) => c.includes(" === "),
      apply: (c) => c.replace(" === ", " !== "),
      description: "Inverted a strict equality check (=== → !==)",
    },
    {
      name: "invertLooseEquality",
      canApply: (c) => c.includes(" == ") && !c.includes(" === "),
      apply: (c) => c.replace(" == ", " != "),
      description: "Inverted an equality check (== → !=)",
    },
    {
      name: "offByOneLessThan",
      canApply: (c) => /for\s*\([^;]+;\s*\w+\s*<\s*\w+/.test(c),
      apply: (c) => {
        const match = c.match(/for\s*\([^;]+;\s*\w+\s*<\s*\w+/);
        return match ? c.replace(match[0], match[0].replace(" < ", " <= ")) : c;
      },
      description: "Changed loop boundary from < to <= (off-by-one error)",
    },
    {
      name: "offByOneGreaterThan",
      canApply: (c) => /for\s*\([^;]+;\s*\w+\s*>\s*\d+/.test(c),
      apply: (c) => {
        const match = c.match(/for\s*\([^;]+;\s*\w+\s*>\s*\d+/);
        return match ? c.replace(match[0], match[0].replace(" > ", " >= ")) : c;
      },
      description: "Changed loop boundary from > to >= (off-by-one error)",
    },
    {
      name: "andToOr",
      canApply: (c) => c.includes(" && "),
      apply: (c) => c.replace(" && ", " || "),
      description: "Changed logical AND (&&) to OR (||)",
    },
    {
      name: "orToAnd",
      canApply: (c) => c.includes(" || "),
      apply: (c) => c.replace(" || ", " && "),
      description: "Changed logical OR (||) to AND (&&)",
    },
    {
      name: "removeAwait",
      canApply: (c) => /await\s+\w+\(/.test(c),
      apply: (c) => {
        const match = c.match(/await\s+\w+\(/);
        return match ? c.replace(match[0], match[0].replace("await ", "")) : c;
      },
      description: "Removed 'await' keyword (async operation now unhandled)",
    },
    {
      name: "lengthMinusOne",
      canApply: (c) => c.includes(".length]"),
      apply: (c) => c.replace(".length]", ".length - 1]"),
      description: "Changed array access from .length to .length - 1",
    },
    {
      name: "lengthOutOfBounds",
      canApply: (c) => c.includes(".length - 1]"),
      apply: (c) => c.replace(".length - 1]", ".length]"),
      description: "Changed array access from .length - 1 to .length (out of bounds)",
    },
    {
      name: "trueToFalse",
      canApply: (c) => /[=:]\s*true[,;\s\n\r})]/.test(c),
      apply: (c) => c.replace(/([=:]\s*)true([,;\s\n\r})])/, "$1false$2"),
      description: "Changed a 'true' value to 'false'",
    },
    {
      name: "falseToTrue",
      canApply: (c) => /[=:]\s*false[,;\s\n\r})]/.test(c),
      apply: (c) => c.replace(/([=:]\s*)false([,;\s\n\r})])/, "$1true$2"),
      description: "Changed a 'false' value to 'true'",
    },
    {
      name: "removeOptionalChaining",
      canApply: (c) => c.includes("?."),
      apply: (c) => c.replace("?.", "."),
      description: "Removed optional chaining operator (?. → .)",
    },
    {
      name: "lessThanToGreaterThan",
      canApply: (c) => / < /.test(c) && !/for\s*\(/.test(c.split(/ < /)[0].split("\n").pop() || ""),
      apply: (c) => c.replace(/ < /, " > "),
      description: "Swapped comparison operator (< → >)",
    },
    {
      name: "greaterThanToLessThan",
      canApply: (c) => / > /.test(c) && !/for\s*\(/.test(c.split(/ > /)[0].split("\n").pop() || ""),
      apply: (c) => c.replace(/ > /, " < "),
      description: "Swapped comparison operator (> → <)",
    },
    {
      name: "plusToMinus",
      canApply: (c) => /\w\s*\+\s*\d+/.test(c),
      apply: (c) => c.replace(/(\w\s*)\+(\s*\d+)/, "$1-$2"),
      description: "Changed arithmetic operator (+ → -)",
    },
    {
      name: "minusToPlus",
      canApply: (c) => /\w\s*-\s*\d+/.test(c) && !/\.length\s*-\s*1/.test(c),
      apply: (c) => {
        // Avoid changing .length - 1 patterns
        const match = c.match(/(\w)\s*-\s*(\d+)/);
        if (match && !c.substring(0, c.indexOf(match[0])).endsWith(".length")) {
          return c.replace(/(\w\s*)-(\s*\d+)/, "$1+$2");
        }
        return c;
      },
      description: "Changed arithmetic operator (- → +)",
    },
    {
      name: "incrementToDecrement",
      canApply: (c) => /\w+\+\+/.test(c),
      apply: (c) => c.replace(/(\w+)\+\+/, "$1--"),
      description: "Changed increment to decrement (++ → --)",
    },
    {
      name: "decrementToIncrement",
      canApply: (c) => /\w+--/.test(c),
      apply: (c) => c.replace(/(\w+)--/, "$1++"),
      description: "Changed decrement to increment (-- → ++)",
    },
    {
      name: "nullToUndefined",
      canApply: (c) => /[=:]\s*null[,;\s\n\r})]/.test(c),
      apply: (c) => c.replace(/([=:]\s*)null([,;\s\n\r})])/, "$1undefined$2"),
      description: "Changed null to undefined",
    },
    {
      name: "zeroToOne",
      canApply: (c) => /[\[=]\s*0\s*[;\],\)]/.test(c),
      apply: (c) => c.replace(/([\[=]\s*)0(\s*[;\],\)])/, "$11$2"),
      description: "Changed index or value from 0 to 1",
    },
    {
      name: "removeNullishCoalescing",
      canApply: (c) => c.includes(" ?? "),
      apply: (c) => {
        const match = c.match(/(\w+)\s*\?\?\s*([^;\n]+)/);
        if (match) {
          return c.replace(match[0], match[1]); // Just use the left side
        }
        return c;
      },
      description: "Removed nullish coalescing operator (a ?? b → a)",
    },
    {
      name: "mapToForEach",
      canApply: (c) => /\.map\s*\(/.test(c),
      apply: (c) => c.replace(/\.map\s*\(/, ".forEach("),
      description: "Changed .map() to .forEach() (loses return value)",
    },
    {
      name: "addNotOperator",
      canApply: (c) => /if\s*\(\s*\w+/.test(c) && !/if\s*\(\s*!/.test(c),
      apply: (c) => c.replace(/if\s*\(\s*(\w+)/, "if (!$1"),
      description: "Added negation operator to condition",
    },
    {
      name: "removeNotOperator",
      canApply: (c) => /if\s*\(\s*!\w+/.test(c),
      apply: (c) => c.replace(/if\s*\(\s*!(\w+)/, "if ($1"),
      description: "Removed negation operator from condition",
    },
  ];

  // Generic mutations that work for any language
  const genericMutations: StressMutation[] = [
    {
      name: "genericTrueToFalse",
      canApply: (c) => c.includes("true"),
      apply: (c) => c.replace("true", "false"),
      description: "Changed a 'true' value to 'false'",
    },
    {
      name: "genericFalseToTrue",
      canApply: (c) => c.includes("false"),
      apply: (c) => c.replace("false", "true"),
      description: "Changed a 'false' value to 'true'",
    },
  ];

  // Select mutations based on file type
  let availableMutations: StressMutation[];
  if (["ts", "tsx", "js", "jsx"].includes(ext || "")) {
    availableMutations = jsMutations;
  } else {
    availableMutations = genericMutations;
  }

  // Filter to only applicable mutations
  const applicableMutations = availableMutations.filter(m => m.canApply(modifiedContent));

  // Shuffle and pick random mutations based on difficulty
  shuffleArray(applicableMutations);
  const targetBugCount = Math.floor(Math.random() * (config.bugCountMax - config.bugCountMin + 1)) + config.bugCountMin;
  
  for (const mutation of applicableMutations) {
    if (changes.length >= targetBugCount) break;
    
    // Double-check mutation can still be applied (content may have changed)
    if (mutation.canApply(modifiedContent)) {
      const newContent = mutation.apply(modifiedContent);
      if (newContent !== modifiedContent) {
        modifiedContent = newContent;
        changes.push(mutation.description);
      }
    }
  }

  // Last resort if no changes could be made
  if (changes.length === 0) {
    changes.push("No automatic changes could be applied - file may need manual review");
  }

  return { content: modifiedContent, changes, symptoms: generateFallbackSymptoms(changes) };
}


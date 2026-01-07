import type { LoadingStep } from "./LoadingProgress";

/**
 * Loading steps for the buggr process.
 * Used in RepoBranchSelector during buggering and on the landing page.
 */
export const LOADING_STEPS: LoadingStep[] = [
  { label: "Creating branch", icon: "branch", timeEstimate: "5-30s" },
  { label: "Analyzing files", icon: "search", timeEstimate: "5-30s" },
  { label: "Buggering up your code", icon: "stress", timeEstimate: "1-2 min" },
  { label: "Committing changes", icon: "commit", timeEstimate: "5-30s" },
  { label: "Finalizing", icon: "check", timeEstimate: "5-30s" },
];


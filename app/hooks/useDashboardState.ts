"use client";

import { useQueryState, parseAsString, parseAsBoolean } from "nuqs";

/**
 * Hook for managing dashboard URL state using nuqs.
 * Provides type-safe, reactive URL state that:
 * - Automatically syncs state to URL
 * - Responds to browser back/forward navigation
 * - Handles SSR correctly
 * 
 * @example
 * ```tsx
 * const { repo, setRepo, branch, setBranch } = useDashboardState();
 * 
 * // Set state (automatically updates URL)
 * setRepo("owner/repo");
 * setBranch("main");
 * 
 * // Clear a param
 * setBranch(null);
 * ```
 */
export function useDashboardState() {
  // Repository name (owner/repo)
  const [repo, setRepo] = useQueryState(
    "repo",
    parseAsString.withOptions({ history: "push", shallow: false })
  );

  // Branch name
  const [branch, setBranch] = useQueryState(
    "branch", 
    parseAsString.withOptions({ history: "push", shallow: false })
  );

  // Commit SHA (short)
  const [commit, setCommit] = useQueryState(
    "commit",
    parseAsString.withOptions({ history: "push", shallow: false })
  );

  // Whether to show the score panel
  const [showScore, setShowScore] = useQueryState(
    "score",
    parseAsBoolean.withDefault(false).withOptions({ history: "push", shallow: false })
  );

  /**
   * Clear all dashboard URL params.
   */
  const clearAll = () => {
    setRepo(null);
    setBranch(null);
    setCommit(null);
    setShowScore(null);
  };

  /**
   * Update multiple params at once.
   */
  const updateAll = (params: {
    repo?: string | null;
    branch?: string | null;
    commit?: string | null;
    showScore?: boolean | null;
  }) => {
    if (params.repo !== undefined) setRepo(params.repo);
    if (params.branch !== undefined) setBranch(params.branch);
    if (params.commit !== undefined) setCommit(params.commit);
    if (params.showScore !== undefined) setShowScore(params.showScore);
  };

  return {
    // State values
    repo,
    branch,
    commit,
    showScore,
    // Individual setters
    setRepo,
    setBranch,
    setCommit,
    setShowScore,
    // Bulk operations
    clearAll,
    updateAll,
  };
}


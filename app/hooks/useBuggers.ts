import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AnalysisFeedback } from "@/app/api/github/analyze/route";

// ============================================================================
// Types
// ============================================================================

/** Bugger data from the API */
export interface Bugger {
  id: string;
  userId: string;
  owner: string;
  repo: string;
  branchName: string;
  stressLevel: string;
  bugCount: number;
  originalCommitSha: string;
  symptoms: string[];
  changes: string[];
  filesBuggered: string[];
  createdAt: string;
  result?: Result | null;
}

/** Result data from the API */
export interface Result {
  id: string;
  buggerId: string;
  grade: string;
  timeMs: number;
  startCommitSha: string;
  completeCommitSha: string;
  analysisSummary: string | null;
  analysisIsPerfect: boolean;
  analysisFeedback: AnalysisFeedback[] | null;
  createdAt: string;
}

/** Response from GET /api/buggers */
interface BuggersResponse {
  buggers: Bugger[];
  total: number;
  limit: number;
  offset: number;
}

/** Response from GET /api/results/[buggerId] */
export interface ResultByBuggerResponse {
  result: Result | null;
  bugger: {
    id: string;
    owner: string;
    repo: string;
    branchName: string;
    stressLevel: string;
    bugCount: number;
    createdAt: string;
  };
}

/** Response from GET /api/results */
interface ResultsResponse {
  results: (Result & { bugger: Bugger })[];
  total: number;
  limit: number;
  offset: number;
}

/** Request body for POST /api/results */
interface SaveResultRequest {
  buggerId: string;
  grade: string;
  timeMs: number;
  startCommitSha: string;
  completeCommitSha: string;
  analysisSummary?: string;
  analysisIsPerfect?: boolean;
  analysisFeedback?: AnalysisFeedback[];
}

// ============================================================================
// Query Keys
// ============================================================================

export const buggerKeys = {
  all: ["buggers"] as const,
  lists: () => [...buggerKeys.all, "list"] as const,
  list: (filters: { completed?: boolean; limit?: number; offset?: number }) =>
    [...buggerKeys.lists(), filters] as const,
  details: () => [...buggerKeys.all, "detail"] as const,
  detail: (id: string) => [...buggerKeys.details(), id] as const,
};

export const resultKeys = {
  all: ["results"] as const,
  lists: () => [...resultKeys.all, "list"] as const,
  list: (filters: { limit?: number; offset?: number }) =>
    [...resultKeys.lists(), filters] as const,
  byBugger: (buggerId: string) => [...resultKeys.all, "byBugger", buggerId] as const,
};

// ============================================================================
// Bugger Hooks
// ============================================================================

interface UseBuggersOptions {
  completed?: boolean;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

/**
 * Fetches the current user's buggers (challenges).
 * 
 * @param options - Filter and pagination options
 * @returns Query result with buggers array
 * 
 * @example
 * ```tsx
 * // Get all buggers
 * const { buggers, isLoading } = useBuggers();
 * 
 * // Get only completed buggers
 * const { buggers } = useBuggers({ completed: true });
 * ```
 */
export function useBuggers(options: UseBuggersOptions = {}) {
  const { completed, limit = 20, offset = 0, enabled = true } = options;

  const query = useQuery({
    queryKey: buggerKeys.list({ completed, limit, offset }),
    queryFn: async (): Promise<BuggersResponse> => {
      const params = new URLSearchParams();
      if (completed !== undefined) params.set("completed", String(completed));
      params.set("limit", String(limit));
      params.set("offset", String(offset));

      const response = await fetch(`/api/buggers?${params}`);
      if (!response.ok) throw new Error("Failed to fetch buggers");
      return response.json();
    },
    enabled,
  });

  return {
    buggers: query.data?.buggers ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

// ============================================================================
// Result Hooks
// ============================================================================

/**
 * Fetches a result by its associated bugger ID.
 * 
 * @param buggerId - The bugger ID to fetch the result for
 * @param options - Query options
 * @returns Query result with the result data (or null if not completed)
 * 
 * @example
 * ```tsx
 * const { result, bugger, isLoading } = useResultByBugger(buggerId);
 * 
 * if (result) {
 *   // User has completed this bugger
 * }
 * ```
 */
export function useResultByBugger(
  buggerId: string | undefined,
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;

  const query = useQuery({
    queryKey: resultKeys.byBugger(buggerId ?? ""),
    queryFn: async (): Promise<ResultByBuggerResponse> => {
      const response = await fetch(`/api/results/${buggerId}`);
      if (!response.ok) throw new Error("Failed to fetch result");
      return response.json();
    },
    enabled: enabled && !!buggerId,
  });

  return {
    result: query.data?.result ?? null,
    bugger: query.data?.bugger ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

interface UseResultsOptions {
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

/**
 * Fetches the current user's results with their associated buggers.
 * 
 * @param options - Pagination options
 * @returns Query result with results array
 */
export function useResults(options: UseResultsOptions = {}) {
  const { limit = 20, offset = 0, enabled = true } = options;

  const query = useQuery({
    queryKey: resultKeys.list({ limit, offset }),
    queryFn: async (): Promise<ResultsResponse> => {
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      params.set("offset", String(offset));

      const response = await fetch(`/api/results?${params}`);
      if (!response.ok) throw new Error("Failed to fetch results");
      return response.json();
    },
    enabled,
  });

  return {
    results: query.data?.results ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Mutation hook to save a result after completing a bugger challenge.
 * Automatically invalidates related queries on success.
 * 
 * @example
 * ```tsx
 * const { saveResult, isSaving } = useSaveResult();
 * 
 * const handleSave = async () => {
 *   await saveResult({
 *     buggerId: "...",
 *     grade: "A",
 *     timeMs: 120000,
 *     // ...
 *   });
 * };
 * ```
 */
export function useSaveResult() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: SaveResultRequest) => {
      const response = await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to save result");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: resultKeys.all });
      queryClient.invalidateQueries({ queryKey: buggerKeys.all });
      queryClient.invalidateQueries({ 
        queryKey: resultKeys.byBugger(variables.buggerId) 
      });
    },
  });

  return {
    saveResult: mutation.mutateAsync,
    isSaving: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}


import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserResponse } from "@/app/api/user/route";

/**
 * Query key for user data.
 * Use this when invalidating or prefetching user data.
 */
export const userQueryKey = ["user"] as const;

/**
 * Fetches the current user from the API.
 * 
 * @returns The user data
 * @throws Error if the request fails
 */
async function fetchUser(): Promise<UserResponse> {
  const response = await fetch("/api/user");
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Not authenticated");
    }
    throw new Error("Failed to fetch user");
  }
  
  return response.json();
}

/**
 * React Query hook to fetch and cache the current user's data.
 * 
 * @example
 * ```tsx
 * function Profile() {
 *   const { user, isLoading, error } = useUser();
 *   
 *   if (isLoading) return <Spinner />;
 *   if (error) return <Error message={error.message} />;
 *   
 *   return <div>Hello, {user.name}!</div>;
 * }
 * ```
 * 
 * @returns Object containing user data, loading state, and error state
 */
export function useUser() {
  const query = useQuery({
    queryKey: userQueryKey,
    queryFn: fetchUser,
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error.message === "Not authenticated") {
        return false;
      }
      return failureCount < 2;
    },
  });

  return {
    user: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to get the query client for manual cache operations.
 * 
 * @example
 * ```tsx
 * const { invalidateUser } = useUserCache();
 * 
 * // After updating user data
 * await invalidateUser();
 * ```
 */
export function useUserCache() {
  const queryClient = useQueryClient();

  return {
    /**
     * Invalidates the user cache, causing a refetch.
     */
    invalidateUser: () => queryClient.invalidateQueries({ queryKey: userQueryKey }),
    
    /**
     * Sets the user data directly in the cache.
     */
    setUser: (data: UserResponse) => queryClient.setQueryData(userQueryKey, data),
    
    /**
     * Gets the current cached user data.
     */
    getUser: () => queryClient.getQueryData<UserResponse>(userQueryKey),
  };
}


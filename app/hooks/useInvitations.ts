import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { InvitationResponse } from "@/app/api/invitations/route";

/**
 * Query key for invitations data.
 */
export const invitationsQueryKey = ["invitations"] as const;

/**
 * Response from the invitations API.
 */
interface InvitationsData {
  invitations: InvitationResponse[];
  hasUsedInviteBonus: boolean;
  acceptedCount: number;
  totalCoinsEarned: number;
}

/**
 * Response from creating invitations.
 */
interface CreateInvitationsResponse {
  message: string;
  invitations: InvitationResponse[];
  coinsAwarded: number;
  newBalance: number;
  skipped: {
    alreadyInvited: string[];
    existingUsers: string[];
  };
}

/**
 * Fetches the user's invitations.
 * 
 * @returns Invitations data
 */
async function fetchInvitations(): Promise<InvitationsData> {
  const response = await fetch("/api/invitations");
  
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Failed to fetch invitations");
  }
  
  return response.json();
}

/**
 * Creates invitations for the given emails.
 * 
 * @param emails - Array of email addresses to invite
 * @returns Created invitations and coin info
 */
async function createInvitations(emails: string[]): Promise<CreateInvitationsResponse> {
  const response = await fetch("/api/invitations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emails }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || "Failed to create invitations");
  }
  
  return data;
}

/**
 * React Query hook for fetching and managing invitations.
 * 
 * @example
 * ```tsx
 * function InviteSection() {
 *   const { invitations, canInvite, isLoading, sendInvites } = useInvitations();
 *   
 *   if (!canInvite) return <p>You've already used your invite bonus</p>;
 *   
 *   return (
 *     <button onClick={() => sendInvites(["friend@example.com"])}>
 *       Invite Friends
 *     </button>
 *   );
 * }
 * ```
 */
export function useInvitations() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: invitationsQueryKey,
    queryFn: fetchInvitations,
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
  });

  const mutation = useMutation({
    mutationFn: createInvitations,
    onSuccess: () => {
      // Invalidate invitations and user queries to refresh data
      queryClient.invalidateQueries({ queryKey: invitationsQueryKey });
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });

  return {
    invitations: query.data?.invitations || [],
    hasUsedInviteBonus: query.data?.hasUsedInviteBonus || false,
    acceptedCount: query.data?.acceptedCount || 0,
    totalCoinsEarned: query.data?.totalCoinsEarned || 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    // Mutation
    sendInvites: mutation.mutateAsync,
    isSending: mutation.isPending,
    sendError: mutation.error,
  };
}

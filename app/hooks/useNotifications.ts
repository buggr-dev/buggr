import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Note notification type from the database.
 */
export interface Note {
  id: string;
  timestamp: string;
  title: string;
  messages: string[];
  read: boolean;
  branchName: string;
  repoName: string;
  repoOwner: string;
}

/**
 * Branch change notification type from the database.
 */
export interface BranchChange {
  id: string;
  timestamp: string;
  read: boolean;
  branchName: string;
  repoName: string;
  repoOwner: string;
  message: string;
  files: {
    file: string;
    success: boolean;
    changes?: string[];
  }[];
}

/**
 * Response from the notifications API.
 */
interface NotificationsResponse {
  notes: Note[];
  branchChanges: BranchChange[];
  unreadNotesCount: number;
  unreadChangesCount: number;
}

/**
 * Options for fetching notifications.
 */
interface UseNotificationsOptions {
  showAll?: boolean;
  type?: "notes" | "changes" | "all";
}

/**
 * Fetches notifications from the API.
 */
async function fetchNotifications(options: UseNotificationsOptions = {}): Promise<NotificationsResponse> {
  const params = new URLSearchParams();
  if (options.showAll) {
    params.set("showAll", "true");
  }
  if (options.type) {
    params.set("type", options.type);
  }
  
  const response = await fetch(`/api/notifications?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch notifications");
  }
  return response.json();
}

/**
 * Marks a notification as read.
 */
async function markNotificationRead(id: string, type: "note" | "changes" | "both"): Promise<void> {
  const response = await fetch(`/api/notifications/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type }),
  });
  if (!response.ok) {
    throw new Error("Failed to mark notification as read");
  }
}

/**
 * Query key for notifications.
 */
export const notificationsQueryKey = (options: UseNotificationsOptions = {}) => 
  ["notifications", options] as const;

/**
 * Hook to fetch notifications from the database.
 * 
 * @param options - Options for filtering notifications
 * @returns Query result with notes and branch changes
 */
export function useNotifications(options: UseNotificationsOptions = {}) {
  return useQuery({
    queryKey: notificationsQueryKey(options),
    queryFn: () => fetchNotifications(options),
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to mark a note as read (discarded).
 */
export function useMarkNoteRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id, "note"),
    onSuccess: () => {
      // Invalidate all notification queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

/**
 * Hook to mark a branch change as read (discarded).
 */
export function useMarkChangesRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id, "changes"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

/**
 * Hook to mark all notifications of a type as read.
 */
export function useMarkAllRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, type }: { ids: string[]; type: "note" | "changes" | "both" }) => {
      await Promise.all(ids.map((id) => markNotificationRead(id, type)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

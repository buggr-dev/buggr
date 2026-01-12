/**
 * React Query hooks for data fetching.
 * All hooks that interact with the Neon database are exported from here.
 */

// User hooks
export { useUser, useUserCache, userQueryKey } from "./useUser";

// Bugger & Result hooks
export {
  useBuggers,
  useResultByBugger,
  useResults,
  useSaveResult,
  buggerKeys,
  resultKeys,
  type Bugger,
  type Result,
  type ResultByBuggerResponse,
} from "./useBuggers";

// Notification hooks
export {
  useNotifications,
  useMarkNoteRead,
  useMarkChangesRead,
  useMarkAllRead,
  notificationsQueryKey,
  type Note,
  type BranchChange,
} from "./useNotifications";

// Invitation hooks
export {
  useInvitations,
  invitationsQueryKey,
} from "./useInvitations";

// Dashboard URL state (using nuqs)
export { useDashboardState } from "./useDashboardState";

// Legacy hook (deprecated - use useDashboardState instead)
export { useDashboardUrl } from "./useDashboardUrl";


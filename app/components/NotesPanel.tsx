"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useNotes } from "@/app/context/NotesContext";
import {
  useNotifications,
  useMarkAllRead,
  type Note,
  type BranchChange,
} from "@/app/hooks";
import { Button } from "@/app/components/inputs/Button";
import { EmptyState, EmptyStateIcons } from "@/app/components/EmptyState";
import {
  BellIcon,
  CloseIcon,
  GitHubIcon,
  LightningIcon,
  CheckIcon,
  CopyIcon,
} from "@/app/components/icons";

type ActiveSection = "note" | "changes";

interface CombinedNotification {
  id: string;
  note: Note | null;
  change: BranchChange | null;
  timestamp: string;
}

function countUnreadPairs(notes: Note[] = [], branchChanges: BranchChange[] = []): number {
  const notesById = new Map(notes.map((note) => [note.id, note]));
  const changesById = new Map(branchChanges.map((change) => [change.id, change]));
  const allIds = new Set<string>([...notesById.keys(), ...changesById.keys()]);

  let count = 0;
  allIds.forEach((id) => {
    const note = notesById.get(id);
    const change = changesById.get(id);
    const unreadNote = note ? !note.read : false;
    const unreadChange = change ? !change.read : false;

    if (unreadNote || unreadChange) {
      count += 1;
    }
  });

  return count;
}

interface ActionsBarProps {
  hasUnread: boolean;
  showAll: boolean;
  onToggleShowAll: () => void;
  onMarkAllRead: () => void;
}

/**
 * Actions bar with "Show All" toggle and "Read All" button.
 */
function ActionsBar({ hasUnread, showAll, onToggleShowAll, onMarkAllRead }: ActionsBarProps) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-gh-border px-4 py-2">
      <button
        onClick={onToggleShowAll}
        className={`text-xs transition-colors ${
          showAll ? "text-gh-accent" : "text-gh-text-muted hover:text-white"
        }`}
      >
        {showAll ? "Show Unread Only" : "Show All"}
      </button>
      {hasUnread && (
        <button
          onClick={onMarkAllRead}
          className="flex items-center gap-1 text-xs text-gh-text-muted hover:text-white"
        >
          <CheckIcon className="h-3 w-3" />
          Read All
        </button>
      )}
    </div>
  );
}

/**
 * Notes toggle button component for use in headers/navbars.
 * Shows unread count badge when there are unread notifications.
 */
export function NotesButton({ onClick }: { onClick: () => void }) {
  const { data } = useNotifications();
  
  const totalUnread = countUnreadPairs(data?.notes || [], data?.branchChanges || []);

  return (
    <button
      onClick={onClick}
      className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-gh-border bg-gh-canvas-subtle text-gh-text-muted transition-colors hover:border-gh-text-muted hover:text-white"
      title="Notifications"
    >
      <BellIcon className="h-4 w-4" />
      {totalUnread > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gh-danger text-[10px] font-bold text-white">
          {totalUnread > 9 ? "9+" : totalUnread}
        </span>
      )}
    </button>
  );
}

/**
 * Notes panel component that displays paired notifications about buggered branches.
 * Notes and branch changes are shown together because they share a 1:1 relationship.
 */
export function NotesPanel() {
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeSections, setActiveSections] = useState<Record<string, ActiveSection>>({});
  const [pendingReads, setPendingReads] = useState<Set<string>>(new Set());

  const router = useRouter();
  const { isPanelOpen, openPanel, closePanel } = useNotes();

  // Fetch notifications from database (always fetch both notes and changes together)
  const { data: notificationsData, isLoading } = useNotifications({
    showAll: showAllNotifications,
    type: "all",
  });

  // Mutation for marking notifications as read
  const markAllRead = useMarkAllRead();

  const notes = notificationsData?.notes || [];
  const branchChanges = notificationsData?.branchChanges || [];

  /**
   * Combines notes and branch changes into a single list keyed by bugger id.
   * The list is sorted by newest first.
   */
  const combinedNotifications: CombinedNotification[] = useMemo(() => {
    const noteMap = new Map(notes.map((note) => [note.id, note]));
    const changeMap = new Map(branchChanges.map((change) => [change.id, change]));

    const allIds = new Set<string>([...noteMap.keys(), ...changeMap.keys()]);

    return Array.from(allIds)
      .map((id) => {
        const note = noteMap.get(id) ?? null;
        const change = changeMap.get(id) ?? null;
        const timestamp = note?.timestamp || change?.timestamp || new Date().toISOString();

        return { id, note, change, timestamp };
      })
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() -
          new Date(a.timestamp).getTime(),
      );
  }, [branchChanges, notes]);

  /**
   * Determines if a combined notification has any unread content.
   */
  function isNotificationUnread(notification: CombinedNotification): boolean {
    const noteUnread = notification.note ? !notification.note.read : false;
    const changeUnread = notification.change ? !notification.change.read : false;
    return noteUnread || changeUnread;
  }

  function addPending(ids: string[]) {
    setPendingReads((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  }

  function removePending(ids: string[]) {
    setPendingReads((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  }

  /**
   * Handles marking a single combined notification (note + changes) as read.
   */
  function handleMarkNotificationRead(id: string) {
    const ids = [id];
    addPending(ids);
    markAllRead.mutate(
      { ids, type: "both" },
      {
        onSettled: () => removePending(ids),
      },
    );
  }

  /**
   * Handles marking all unread notifications as read together.
   */
  function handleMarkAllNotificationsRead() {
    const unreadIds = combinedNotifications
      .filter(isNotificationUnread)
      .map((notification) => notification.id);

    if (unreadIds.length > 0) {
      addPending(unreadIds);
      markAllRead.mutate(
        { ids: unreadIds, type: "both" },
        {
          onSettled: () => removePending(unreadIds),
        },
      );
    }
  }

  /**
   * Returns the currently active section (note | changes) for a notification card.
   */
  function getActiveSection(id: string): ActiveSection {
    return activeSections[id] ?? "note";
  }

  /**
   * Updates the active section for a notification card.
   */
  function setActiveSection(id: string, section: ActiveSection) {
    setActiveSections((prev) => ({ ...prev, [id]: section }));
  }

  /**
   * Generates a shareable message from a note.
   */
  function generateShareMessage(note: Note): string {
    const branchUrl = getBranchUrl(note.repoName, note.branchName, note.repoOwner);
    let message = `🐛 Bug Report\n\n`;
    
    if (note.branchName) {
      message += `Branch: ${note.branchName}\n`;
    }
    if (branchUrl) {
      message += `Link: ${branchUrl}\n`;
    }
    
    message += `\nReported Issues:\n`;
    note.messages.forEach((msg, i) => {
      message += `${i + 1}. ${msg}\n`;
    });
    
    message += `\nPlease investigate and fix these issues.`;
    
    return message;
  }

  /**
   * Copies note message to clipboard and shows feedback.
   */
  async function copyToClipboard(noteId: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(noteId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  /**
   * Formats a date to a relative time string.
   */
  function formatRelativeTime(dateInput: Date | string): string {
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  }

  /**
   * Generates an internal dashboard URL for a branch.
   */
  function getBranchUrl(repoName?: string, branchName?: string, repoOwner?: string): string | null {
    if (!repoName || !branchName || !repoOwner) return null;
    // Don't encode the slash in repo - dashboard expects "owner/repo" format
    return `/dashboard?repo=${repoOwner}/${repoName}&branch=${encodeURIComponent(branchName)}`;
  }

  /**
   * Navigates to a branch in the dashboard and closes the panel.
   */
  function navigateToBranch(url: string) {
    closePanel();
    router.push(url);
  }

  // Filter notifications based on showAll toggle
  const displayedNotifications = showAllNotifications
    ? combinedNotifications
    : combinedNotifications.filter(isNotificationUnread);
  const hasUnread = combinedNotifications.some(isNotificationUnread);

  return (
    <>
      {/* Header Button */}
      <NotesButton onClick={openPanel} />

      {/* Backdrop */}
      {isPanelOpen && (
        <div
          className="fixed inset-0 z-[9998] bg-black/50 transition-opacity"
          onClick={closePanel}
        />
      )}

      {/* Notes Panel */}
      <div
        className={`fixed right-0 top-0 z-[9999] h-full w-96 transform border-l border-gh-border bg-gh-canvas shadow-2xl transition-transform duration-300 ${
          isPanelOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gh-border px-4 py-4">
          <div className="flex items-center gap-2">
            <BellIcon className="h-5 w-5 text-gh-text-muted" />
            <h2 className="text-lg font-semibold text-white">Notifications</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={closePanel}
          >
            <CloseIcon className="h-5 w-5" />
          </Button>
        </div>

        {/* Actions */}
        <ActionsBar
          hasUnread={hasUnread}
          showAll={showAllNotifications}
          onToggleShowAll={() => setShowAllNotifications(!showAllNotifications)}
          onMarkAllRead={handleMarkAllNotificationsRead}
        />

        {/* Content */}
        <div className="h-[calc(100%-8rem)] overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gh-accent/30 border-t-gh-accent" />
            </div>
          )}

          {!isLoading && displayedNotifications.length === 0 && (
            <EmptyState
              icon={EmptyStateIcons.bugReports}
              title={showAllNotifications ? "No notifications yet" : "No unread notifications"}
              description={
                showAllNotifications
                  ? "Bug reports and branch changes will appear here"
                  : "All caught up! Click 'Show All' to see history"
              }
            />
          )}

          {!isLoading && displayedNotifications.length > 0 && (
            <div className="flex flex-col">
              {displayedNotifications.map((notification) => {
                const note = notification.note;
                const change = notification.change;
                const branchName = note?.branchName || change?.branchName;
                const repoName = note?.repoName || change?.repoName;
                const repoOwner = note?.repoOwner || change?.repoOwner;
                const branchUrl = getBranchUrl(repoName, branchName, repoOwner);
                const activeSection = getActiveSection(notification.id);
                const unread = isNotificationUnread(notification);
                const isPending = pendingReads.has(notification.id);

                return (
                  <div
                    key={notification.id}
                    className={`border-b border-gh-border p-4 transition-colors ${
                      unread ? "bg-gh-accent/5" : ""
                    }`}
                  >
                    {/* Header */}
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {unread && (
                          <span className="h-2 w-2 flex-shrink-0 rounded-full bg-gh-accent" />
                        )}
                        <h3 className="text-sm font-medium text-white">
                          {notification.note?.title || "Branch Buggered"}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="flex-shrink-0 text-xs text-gh-text-muted">
                          {formatRelativeTime(notification.timestamp)}
                        </span>
                        {unread && (
                          <button
                            onClick={() => handleMarkNotificationRead(notification.id)}
                            className="rounded p-1 text-gh-text-muted transition-colors hover:bg-gh-border hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={isPending}
                            title="Mark as read"
                          >
                            {isPending ? (
                              <span className="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-gh-accent/30 border-t-gh-accent" />
                            ) : (
                              <CheckIcon className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Branch/Repo Info with Link */}
                    {(branchName || repoName) && (
                      <div className="mb-3">
                        {branchUrl ? (
                          <button
                            onClick={() => navigateToBranch(branchUrl)}
                            className="inline-flex items-center gap-1.5 rounded-md border border-gh-border bg-gh-canvas-subtle px-2 py-1 text-xs text-gh-accent transition-colors hover:border-gh-accent hover:bg-gh-accent/10"
                          >
                            <GitHubIcon className="h-3 w-3" />
                            <span className="font-mono">{branchName}</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-gh-text-muted">
                            <LightningIcon className="h-3 w-3" />
                            <code className="rounded bg-gh-border px-1.5 py-0.5 font-mono">
                              {repoName && `${repoName}/`}
                              {branchName}
                            </code>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Per-item toggle */}
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex rounded-md bg-gh-canvas-subtle p-1 text-xs">
                        <button
                          onClick={() => setActiveSection(notification.id, "note")}
                          className={`rounded px-3 py-1 transition-colors ${
                            activeSection === "note"
                              ? "bg-gh-accent/20 text-white"
                              : "text-gh-text-muted hover:text-white"
                          }`}
                        >
                          Bug Report
                        </button>
                        <button
                          onClick={() => setActiveSection(notification.id, "changes")}
                          className={`rounded px-3 py-1 transition-colors ${
                            activeSection === "changes"
                              ? "bg-gh-accent/20 text-white"
                              : "text-gh-text-muted hover:text-white"
                          }`}
                        >
                          Branch Changes (Spoiler)
                        </button>
                      </div>
                    </div>

                    {activeSection === "note" ? (
                      <div>
                        {note ? (
                          <>
                            <ul className="space-y-1.5">
                              {note.messages.map((message, index) => (
                                <li
                                  key={index}
                                  className="flex items-start gap-2 text-sm text-gh-text"
                                >
                                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gh-danger-fg" />
                                  {message}
                                </li>
                              ))}
                            </ul>

                            <div className="mt-3 flex justify-end">
                              <button
                                onClick={() =>
                                  copyToClipboard(
                                    notification.id,
                                    generateShareMessage(note),
                                  )
                                }
                                className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors ${
                                  copiedId === notification.id
                                    ? "bg-gh-success/20 text-gh-success-fg"
                                    : "text-gh-text-muted hover:bg-gh-border hover:text-white"
                                }`}
                              >
                                {copiedId === notification.id ? (
                                  <>
                                    <CheckIcon className="h-3.5 w-3.5" />
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <CopyIcon className="h-3.5 w-3.5" />
                                    Copy to Clipboard
                                  </>
                                )}
                              </button>
                            </div>
                          </>
                        ) : (
                          <p className="text-sm text-gh-text-muted">Bug report unavailable.</p>
                        )}
                      </div>
                    ) : (
                      <div>
                        {change ? (
                          <>
                            <p className="mb-3 text-sm text-gh-text-muted">
                              {change.message}
                            </p>

                            <div className="space-y-2">
                              {(change.files as {
                                file: string;
                                success: boolean;
                                changes?: string[];
                              }[])
                                .filter((file) => file.success)
                                .map((fileResult) => (
                                  <div
                                    key={fileResult.file}
                                    className="rounded border border-gh-border bg-gh-canvas-subtle p-2 text-xs"
                                  >
                                    <div className="font-mono text-white">{fileResult.file}</div>
                                    {fileResult.changes && fileResult.changes.length > 0 && (
                                      <ul className="mt-1 list-inside list-disc text-gh-text-muted">
                                        {fileResult.changes.map((changeDesc, i) => (
                                          <li key={i}>{changeDesc}</li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                ))}
                            </div>
                          </>
                        ) : (
                          <p className="text-sm text-gh-text-muted">Branch change details unavailable.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

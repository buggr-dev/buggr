"use client";

import { useState } from "react";
import { useNotes } from "@/app/context/NotesContext";
import {
  useNotifications,
  useMarkNoteRead,
  useMarkChangesRead,
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
  ExternalLinkIcon,
  LightningIcon,
  CheckIcon,
  CopyIcon,
  DocumentIcon,
} from "@/app/components/icons";

type NotificationTab = "bug-reports" | "branch-changes";

interface TabButtonProps {
  tab: NotificationTab;
  activeTab: NotificationTab;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  unreadCount: number;
  badgeVariant: "danger" | "accent";
}

/**
 * Tab button component for switching between notification types.
 */
function TabButton({
  tab,
  activeTab,
  onClick,
  icon,
  label,
  unreadCount,
  badgeVariant,
}: TabButtonProps) {
  const isActive = activeTab === tab;
  const badgeColors =
    badgeVariant === "danger"
      ? "bg-gh-danger/20 text-gh-danger-fg"
      : "bg-gh-accent/20 text-gh-accent";

  return (
    <button
      onClick={onClick}
      className={`relative flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
        isActive ? "text-white" : "text-gh-text-muted hover:text-white"
      }`}
    >
      {icon}
      {label}
      {unreadCount > 0 && (
        <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${badgeColors}`}>
          {unreadCount}
        </span>
      )}
      {isActive && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gh-accent" />
      )}
    </button>
  );
}

interface ActionsBarProps {
  hasUnread: boolean;
  showAll: boolean;
  onToggleShowAll: () => void;
  onMarkAllRead: () => void;
}

/**
 * Actions bar with "Show All" toggle and "Discard All" button.
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
  
  const totalUnread = (data?.unreadNotesCount || 0) + (data?.unreadChangesCount || 0);

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
 * Notes panel component that displays notifications about buggered branches.
 * Shows as a slide-out panel from the right side with tabs for Bug Reports and Branch Changes.
 */
export function NotesPanel() {
  const [activeTab, setActiveTab] = useState<NotificationTab>("bug-reports");
  const [showAllNotes, setShowAllNotes] = useState(false);
  const [showAllChanges, setShowAllChanges] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { isPanelOpen, openPanel, closePanel } = useNotes();

  // Fetch notifications from database
  const { data: notificationsData, isLoading } = useNotifications({
    showAll: activeTab === "bug-reports" ? showAllNotes : showAllChanges,
    type: activeTab === "bug-reports" ? "notes" : "changes",
  });

  // Mutations for marking as read
  const markNoteRead = useMarkNoteRead();
  const markChangesRead = useMarkChangesRead();
  const markAllRead = useMarkAllRead();

  const notes = notificationsData?.notes || [];
  const branchChanges = notificationsData?.branchChanges || [];
  const unreadNotesCount = notificationsData?.unreadNotesCount || 0;
  const unreadChangesCount = notificationsData?.unreadChangesCount || 0;

  /**
   * Handles discarding (marking as read) a note.
   */
  function handleDiscardNote(id: string) {
    markNoteRead.mutate(id);
  }

  /**
   * Handles discarding (marking as read) a branch change.
   */
  function handleDiscardChange(id: string) {
    markChangesRead.mutate(id);
  }

  /**
   * Handles marking all notes as read.
   */
  function handleMarkAllNotesRead() {
    const unreadIds = notes.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length > 0) {
      markAllRead.mutate({ ids: unreadIds, type: "note" });
    }
  }

  /**
   * Handles marking all branch changes as read.
   */
  function handleMarkAllChangesRead() {
    const unreadIds = branchChanges.filter((c) => !c.read).map((c) => c.id);
    if (unreadIds.length > 0) {
      markAllRead.mutate({ ids: unreadIds, type: "changes" });
    }
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
   * Generates a GitHub branch URL from repo and branch names.
   */
  function getBranchUrl(repoName?: string, branchName?: string, repoOwner?: string): string | null {
    if (!repoName || !branchName || !repoOwner) return null;
    return `https://github.com/${repoOwner}/${repoName}/tree/${encodeURIComponent(branchName)}`;
  }

  // Filter notes based on showAll toggle
  const displayedNotes = showAllNotes ? notes : notes.filter((n) => !n.read);
  const displayedChanges = showAllChanges ? branchChanges : branchChanges.filter((c) => !c.read);

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

        {/* Tabs */}
        <div className="flex border-b border-gh-border">
          <TabButton
            tab="bug-reports"
            activeTab={activeTab}
            onClick={() => setActiveTab("bug-reports")}
            icon={<LightningIcon className="h-4 w-4" />}
            label="Bug Reports"
            unreadCount={unreadNotesCount}
            badgeVariant="danger"
          />
          <TabButton
            tab="branch-changes"
            activeTab={activeTab}
            onClick={() => setActiveTab("branch-changes")}
            icon={<DocumentIcon className="h-4 w-4" />}
            label="Branch Changes"
            unreadCount={unreadChangesCount}
            badgeVariant="accent"
          />
        </div>

        {/* Actions */}
        {activeTab === "bug-reports" && (
          <ActionsBar
            hasUnread={unreadNotesCount > 0}
            showAll={showAllNotes}
            onToggleShowAll={() => setShowAllNotes(!showAllNotes)}
            onMarkAllRead={handleMarkAllNotesRead}
          />
        )}
        {activeTab === "branch-changes" && (
          <ActionsBar
            hasUnread={unreadChangesCount > 0}
            showAll={showAllChanges}
            onToggleShowAll={() => setShowAllChanges(!showAllChanges)}
            onMarkAllRead={handleMarkAllChangesRead}
          />
        )}

        {/* Content */}
        <div className="h-[calc(100%-10rem)] overflow-y-auto">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gh-accent/30 border-t-gh-accent" />
            </div>
          )}

          {/* Bug Reports Tab */}
          {!isLoading && activeTab === "bug-reports" && (
            <>
              {displayedNotes.length === 0 ? (
                <EmptyState
                  icon={EmptyStateIcons.bugReports}
                  title={showAllNotes ? "No bug reports yet" : "No unread bug reports"}
                  description={showAllNotes ? "Bugger a branch to see reports here" : "All caught up! Click 'Show All' to see history"}
                />
              ) : (
                <div className="flex flex-col">
                  {displayedNotes.map((note) => {
                    const branchUrl = getBranchUrl(note.repoName, note.branchName, note.repoOwner);
                    
                    return (
                      <div
                        key={note.id}
                        className={`border-b border-gh-border p-4 transition-colors ${
                          !note.read ? "bg-gh-danger/5" : ""
                        }`}
                      >
                        {/* Note Header */}
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {!note.read && (
                              <span className="h-2 w-2 flex-shrink-0 rounded-full bg-gh-danger" />
                            )}
                            <h3 className="text-sm font-medium text-white">{note.title}</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="flex-shrink-0 text-xs text-gh-text-muted">
                              {formatRelativeTime(note.timestamp)}
                            </span>
                            {!note.read && (
                              <button
                                onClick={() => handleDiscardNote(note.id)}
                                className="rounded p-1 text-gh-text-muted transition-colors hover:bg-gh-border hover:text-white"
                                title="Mark as read"
                              >
                                <CheckIcon className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Branch/Repo Info with Link */}
                        {(note.branchName || note.repoName) && (
                          <div className="mb-3">
                            {branchUrl ? (
                              <a
                                href={branchUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-md border border-gh-border bg-gh-canvas-subtle px-2 py-1 text-xs text-gh-accent transition-colors hover:border-gh-accent hover:bg-gh-accent/10"
                              >
                                <GitHubIcon className="h-3 w-3" />
                                <span className="font-mono">{note.branchName}</span>
                                <ExternalLinkIcon className="h-3 w-3" />
                              </a>
                            ) : (
                              <div className="flex items-center gap-2 text-xs text-gh-text-muted">
                                <LightningIcon className="h-3 w-3" />
                                <code className="rounded bg-gh-border px-1.5 py-0.5 font-mono">
                                  {note.repoName && `${note.repoName}/`}
                                  {note.branchName}
                                </code>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Messages */}
                        <ul className="space-y-1.5">
                          {note.messages.map((message, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-gh-text">
                              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gh-danger-fg" />
                              {message}
                            </li>
                          ))}
                        </ul>

                        {/* Copy to Clipboard Button */}
                        <div className="mt-3 flex justify-end">
                          <button
                            onClick={() => copyToClipboard(note.id, generateShareMessage(note))}
                            className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors ${
                              copiedId === note.id
                                ? "bg-gh-success/20 text-gh-success-fg"
                                : "text-gh-text-muted hover:bg-gh-border hover:text-white"
                            }`}
                          >
                            {copiedId === note.id ? (
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
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Branch Changes Tab */}
          {!isLoading && activeTab === "branch-changes" && (
            <>
              {displayedChanges.length === 0 ? (
                <EmptyState
                  icon={EmptyStateIcons.commits}
                  title={showAllChanges ? "No branch changes yet" : "No unread branch changes"}
                  description={showAllChanges ? "File changes from buggered branches will appear here" : "All caught up! Click 'Show All' to see history"}
                />
              ) : (
                <div className="flex flex-col">
                  {displayedChanges.map((change) => {
                    const branchUrl = getBranchUrl(change.repoName, change.branchName, change.repoOwner);
                    
                    return (
                      <div
                        key={change.id}
                        className={`border-b border-gh-border p-4 transition-colors ${
                          !change.read ? "bg-gh-accent/5" : ""
                        }`}
                      >
                        {/* Header */}
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {!change.read && (
                              <span className="h-2 w-2 flex-shrink-0 rounded-full bg-gh-accent" />
                            )}
                            <h3 className="text-sm font-medium text-white">Branch Buggered</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="flex-shrink-0 text-xs text-gh-text-muted">
                              {formatRelativeTime(change.timestamp)}
                            </span>
                            {!change.read && (
                              <button
                                onClick={() => handleDiscardChange(change.id)}
                                className="rounded p-1 text-gh-text-muted transition-colors hover:bg-gh-border hover:text-white"
                                title="Mark as read"
                              >
                                <CheckIcon className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Branch Link */}
                        <div className="mb-3">
                          {branchUrl ? (
                            <a
                              href={branchUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-md border border-gh-border bg-gh-canvas-subtle px-2 py-1 text-xs text-gh-accent transition-colors hover:border-gh-accent hover:bg-gh-accent/10"
                            >
                              <GitHubIcon className="h-3 w-3" />
                              <span className="font-mono">{change.branchName}</span>
                              <ExternalLinkIcon className="h-3 w-3" />
                            </a>
                          ) : (
                            <code className="rounded bg-gh-border px-1.5 py-0.5 font-mono text-xs text-gh-text-muted">
                              {change.branchName}
                            </code>
                          )}
                        </div>

                        {/* Message */}
                        <p className="mb-3 text-sm text-gh-text-muted">{change.message}</p>

                        {/* Files Changed */}
                        <div className="space-y-2">
                          {(change.files as { file: string; success: boolean; changes?: string[] }[])
                            .filter((f) => f.success)
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
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

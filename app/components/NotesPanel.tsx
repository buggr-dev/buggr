"use client";

import { useState } from "react";
import { useNotes } from "@/app/context/NotesContext";

/**
 * Notes panel component that displays notifications about stressed branches.
 * Shows as a slide-out panel with unread indicator on the toggle button.
 */
export function NotesPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { notes, unreadCount, markAsRead, markAllAsRead, clearNotes } = useNotes();

  /**
   * Formats a date to a relative time string.
   */
  function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  }

  return (
    <>
      {/* Notes Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-lg border border-[#30363d] bg-[#161b22] text-[#8b949e] transition-colors hover:border-[#8b949e] hover:text-white"
        title="Notes"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#da3633] text-xs font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Notes Panel */}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-96 transform border-l border-[#30363d] bg-[#0d1117] transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#30363d] px-4 py-4">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-[#da3633]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <h2 className="text-lg font-semibold text-white">Bug Reports</h2>
            {unreadCount > 0 && (
              <span className="rounded-full bg-[#da3633]/20 px-2 py-0.5 text-xs text-[#f85149]">
                {unreadCount} new
              </span>
            )}
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-[#8b949e] hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Actions */}
        {notes.length > 0 && (
          <div className="flex items-center justify-end gap-2 border-b border-[#30363d] px-4 py-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-[#58a6ff] hover:underline"
              >
                Mark all as read
              </button>
            )}
            <button
              onClick={clearNotes}
              className="text-xs text-[#8b949e] hover:text-white"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Notes List */}
        <div className="h-[calc(100%-8rem)] overflow-y-auto">
          {notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#30363d] bg-[#161b22]">
                <svg className="h-8 w-8 text-[#8b949e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-white">No bug reports yet</p>
                <p className="text-xs text-[#8b949e]">Stress a branch to see reports here</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              {notes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => markAsRead(note.id)}
                  className={`cursor-pointer border-b border-[#30363d] p-4 transition-colors hover:bg-[#161b22] ${
                    !note.read ? "bg-[#da3633]/5" : ""
                  }`}
                >
                  {/* Note Header */}
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {!note.read && (
                        <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[#da3633]" />
                      )}
                      <h3 className="text-sm font-medium text-white">{note.title}</h3>
                    </div>
                    <span className="flex-shrink-0 text-xs text-[#8b949e]">
                      {formatRelativeTime(note.timestamp)}
                    </span>
                  </div>

                  {/* Branch/Repo Info */}
                  {(note.branchName || note.repoName) && (
                    <div className="mb-2 flex items-center gap-2 text-xs text-[#8b949e]">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      <code className="rounded bg-[#30363d] px-1.5 py-0.5 font-mono">
                        {note.repoName && `${note.repoName}/`}
                        {note.branchName}
                      </code>
                    </div>
                  )}

                  {/* Messages */}
                  <ul className="space-y-1.5">
                    {note.messages.map((message, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-[#c9d1d9]">
                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#f85149]" />
                        {message}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}


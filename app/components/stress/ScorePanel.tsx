"use client";

import { useEffect, useState } from "react";
import type { GitHubCommit, StressMetadata } from "@/lib/github";
import { Button } from "@/app/components/inputs/Button";
import { CloseIcon, BuggrIcon, SparklesIcon } from "@/app/components/icons";
import {
  calculateScoreRating,
  DIFFICULTY_CONFIG,
} from "@/lib/score-config";

interface ScorePanelProps {
  /** The commit where debugging started (contains "start" in message) */
  startCommit: GitHubCommit;
  /** The commit where debugging completed (contains "complete" in message) */
  completeCommit: GitHubCommit;
  /** The branch name being viewed */
  branchName: string;
  /** Callback to close the score panel */
  onClose: () => void;
  /** Optional buggr metadata from .buggr.json */
  stressMetadata?: StressMetadata | null;
}

/**
 * Formats a date string into a human-readable format.
 *
 * @param dateString - ISO date string to format
 * @returns Formatted date string (e.g., "Dec 17, 2025 at 2:30 PM")
 */
function formatFullDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Calculates the time difference between start and complete commits.
 *
 * @param startCommit - The commit where debugging started
 * @param completeCommit - The commit where debugging completed
 * @returns Object with formatted string and raw milliseconds
 */
function calculateTimeDifference(
  startCommit: GitHubCommit,
  completeCommit: GitHubCommit
): { formatted: string; ms: number } {
  const startTime = new Date(startCommit.commit.author.date).getTime();
  const completeTime = new Date(completeCommit.commit.author.date).getTime();
  const diffMs = Math.abs(completeTime - startTime);

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  let formatted: string;
  if (hours > 0) {
    formatted = `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    formatted = `${minutes}m ${seconds}s`;
  } else {
    formatted = `${seconds}s`;
  }

  return { formatted, ms: diffMs };
}

export function ScorePanel({
  startCommit,
  completeCommit,
  branchName,
  onClose,
  stressMetadata,
}: ScorePanelProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Trigger entrance animation on mount
  useEffect(() => {
    // Small delay to ensure the component is mounted before animating
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const { formatted: timeDifference, ms: timeMs } = calculateTimeDifference(
    startCommit,
    completeCommit
  );
  const difficulty = stressMetadata?.stressLevel
    ? DIFFICULTY_CONFIG[stressMetadata.stressLevel]
    : null;
  const repoFullName = stressMetadata
    ? `${stressMetadata.owner}/${stressMetadata.repo}`
    : null;
  const scoreRating = calculateScoreRating(
    stressMetadata?.stressLevel,
    timeMs
  );

  const bugCount = stressMetadata?.bugCount || 1;

  /**
   * Handles the analyze code action.
   * TODO: Implement actual analysis logic
   */
  const handleAnalyzeCode = () => {
    console.log("Analyzing code...");
  };

  return (
    <div className={`flex h-full flex-col gap-6 overflow-y-auto pt-10 transition-all duration-500 ease-out ${isVisible ? "opacity-100" : "opacity-0"}`}>
      {/* Main Score Card */}
      <div 
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${scoreRating.gradient} p-[2px] transition-all duration-700 ease-out ${isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"}`}
        style={{ transitionDelay: "100ms" }}
      >
        <div className="rounded-[14px] bg-gh-canvas-default p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BuggrIcon className="h-4 w-4 text-gh-success" />
              <span className="text-xs font-semibold tracking-wide text-white uppercase">Buggr</span>
            </div>
            {repoFullName && (
              <code className="font-mono text-xs text-white">{repoFullName}</code>
            )}
          </div>

          {/* Grade */}
          <div 
            className={`text-center mb-6 transition-all duration-500 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{ transitionDelay: "300ms" }}
          >
            <div className={`inline-flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br ${scoreRating.gradient} mb-3 transition-transform duration-700 ease-out ${isVisible ? "scale-100 rotate-0" : "scale-50 -rotate-12"}`}
              style={{ transitionDelay: "400ms" }}
            >
              <span className="text-6xl font-black text-white drop-shadow-lg">
                {scoreRating.grade}
              </span>
            </div>
            <div 
              className={`flex items-center justify-center gap-2 mb-1 transition-all duration-500 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
              style={{ transitionDelay: "500ms" }}
            >
              <span className="text-2xl">{scoreRating.emoji}</span>
              <h2 className={`text-xl font-bold ${scoreRating.textColor}`}>
                {scoreRating.label}
              </h2>
            </div>
            <p 
              className={`text-sm text-white transition-all duration-500 ease-out ${isVisible ? "opacity-100" : "opacity-0"}`}
              style={{ transitionDelay: "600ms" }}
            >
              {scoreRating.description}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div 
              className={`rounded-lg bg-gh-canvas-subtle p-3 text-center transition-all duration-500 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
              style={{ transitionDelay: "650ms" }}
            >
              <p className="text-2xl font-bold text-white">{timeDifference}</p>
              <p className="text-xs text-gh-text-muted mt-1">Time</p>
            </div>
            <div 
              className={`rounded-lg bg-gh-canvas-subtle p-3 text-center transition-all duration-500 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
              style={{ transitionDelay: "750ms" }}
            >
              <p className="text-2xl font-bold text-white">{bugCount}</p>
              <p className="text-xs text-gh-text-muted mt-1">{bugCount === 1 ? "Bug" : "Bugs"}</p>
            </div>
            <div 
              className={`rounded-lg bg-gh-canvas-subtle p-3 text-center transition-all duration-500 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
              style={{ transitionDelay: "850ms" }}
            >
              <p className={`text-2xl font-bold ${difficulty?.color || "text-white"}`}>
                {difficulty?.label || "—"}
              </p>
              <p className="text-xs text-gh-text-muted mt-1">Level</p>
            </div>
          </div>
        </div>
      </div>

      {/* Analyze Button */}
      <div 
        className={`transition-all duration-500 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        style={{ transitionDelay: "900ms" }}
      >
        <Button variant="primary" className="w-full" onClick={handleAnalyzeCode}>
          <SparklesIcon className="h-4 w-4" />
          Analyze Code
        </Button>
      </div>

      {/* Timeline - Compact */}
      <div 
        className={`space-y-3 transition-all duration-500 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        style={{ transitionDelay: "1000ms" }}
      >
        <h3 className="text-xs font-semibold tracking-wide text-gh-text-muted uppercase">Timeline</h3>
        
        <div className="space-y-2">
          {/* Start */}
          <div 
            className={`flex items-center gap-3 rounded-lg border border-gh-border bg-gh-canvas-subtle p-3 transition-all duration-500 ease-out ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
            style={{ transitionDelay: "1100ms" }}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/20">
              <span className="text-sm">🚀</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">
                {startCommit.commit.message.split("\n")[0]}
              </p>
              <p className="text-xs text-gh-text-muted">
                {formatFullDate(startCommit.commit.author.date)}
              </p>
            </div>
            <code className="shrink-0 rounded bg-gh-canvas-default px-2 py-0.5 font-mono text-xs text-gh-accent">
              {startCommit.sha.substring(0, 7)}
            </code>
          </div>

          {/* Connector */}
          <div className="flex justify-center">
            <div 
              className={`w-0.5 bg-gh-border transition-all duration-300 ease-out ${isVisible ? "h-4" : "h-0"}`}
              style={{ transitionDelay: "1200ms" }}
            />
          </div>

          {/* Complete */}
          <div 
            className={`flex items-center gap-3 rounded-lg border border-gh-border bg-gh-canvas-subtle p-3 transition-all duration-500 ease-out ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
            style={{ transitionDelay: "1250ms" }}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/20">
              <span className="text-sm">✅</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">
                {completeCommit.commit.message.split("\n")[0]}
              </p>
              <p className="text-xs text-gh-text-muted">
                {formatFullDate(completeCommit.commit.author.date)}
              </p>
            </div>
            <code className="shrink-0 rounded bg-gh-canvas-default px-2 py-0.5 font-mono text-xs text-gh-accent">
              {completeCommit.sha.substring(0, 7)}
            </code>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div 
        className={`mt-auto pt-4 border-t border-gh-border transition-all duration-500 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        style={{ transitionDelay: "1350ms" }}
      >
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <CloseIcon className="h-4 w-4" />
            Close
          </Button>
          <code className="font-mono text-xs text-gh-text-muted">{branchName}</code>
        </div>
      </div>
    </div>
  );
}


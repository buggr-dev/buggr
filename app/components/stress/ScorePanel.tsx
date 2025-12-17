import type { GitHubCommit } from "@/lib/github";
import { Button } from "@/app/components/inputs/Button";
import { TrophyIcon, CloseIcon } from "@/app/components/icons";

interface ScorePanelProps {
  /** The commit where debugging started (contains "start" in message) */
  startCommit: GitHubCommit;
  /** The commit where debugging completed (contains "complete" in message) */
  completeCommit: GitHubCommit;
  /** The branch name being viewed */
  branchName: string;
  /** Callback to close the score panel */
  onClose: () => void;
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
 * @returns Formatted time difference string (e.g., "5m 30s")
 */
function calculateTimeDifference(
  startCommit: GitHubCommit,
  completeCommit: GitHubCommit
): string {
  const startTime = new Date(startCommit.commit.author.date).getTime();
  const completeTime = new Date(completeCommit.commit.author.date).getTime();
  const diffMs = Math.abs(completeTime - startTime);

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Displays a score panel showing debugging performance metrics.
 * Shows the time taken to complete debugging along with a timeline
 * of the start and complete commits.
 *
 * @param startCommit - The commit where debugging started
 * @param completeCommit - The commit where debugging completed
 * @param branchName - The branch name being viewed
 * @param onClose - Callback to close the panel
 */
export function ScorePanel({
  startCommit,
  completeCommit,
  branchName,
  onClose,
}: ScorePanelProps) {
  const timeDifference = calculateTimeDifference(startCommit, completeCommit);

  return (
    <div className="flex h-full flex-col gap-6">
      {/* Score Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600">
            <TrophyIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Your Score</h2>
            <p className="text-sm text-gh-text-muted">Debugging Performance</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <CloseIcon className="h-4 w-4" />
          Close
        </Button>
      </div>

      {/* Time Card */}
      <div className="rounded-xl border border-gh-border bg-gradient-to-br from-gh-canvas-subtle to-gh-canvas-default p-6">
        <div className="text-center">
          <p className="text-sm font-medium text-gh-text-muted mb-2">
            Time to Complete
          </p>
          <p className="text-4xl font-bold text-gh-success-fg">{timeDifference}</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-medium text-gh-text-muted">Timeline</h3>

        {/* Start Commit */}
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
              <span className="text-lg">🚀</span>
            </div>
            <div className="flex-1 w-0.5 bg-gh-border my-2" />
          </div>
          <div className="flex-1 pb-4">
            <div className="rounded-lg border border-gh-border bg-gh-canvas-subtle p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">
                  Started Debugging
                </span>
                <code className="rounded bg-gh-canvas-default px-2 py-0.5 font-mono text-xs text-gh-accent">
                  {startCommit.sha.substring(0, 7)}
                </code>
              </div>
              <p className="text-sm text-gh-text-muted mb-1">
                {startCommit.commit.message.split("\n")[0]}
              </p>
              <p className="text-xs text-gh-text-muted">
                {formatFullDate(startCommit.commit.author.date)}
              </p>
            </div>
          </div>
        </div>

        {/* Complete Commit */}
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20 text-green-400">
              <span className="text-lg">✅</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="rounded-lg border border-gh-border bg-gh-canvas-subtle p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">
                  Completed Fix
                </span>
                <code className="rounded bg-gh-canvas-default px-2 py-0.5 font-mono text-xs text-gh-accent">
                  {completeCommit.sha.substring(0, 7)}
                </code>
              </div>
              <p className="text-sm text-gh-text-muted mb-1">
                {completeCommit.commit.message.split("\n")[0]}
              </p>
              <p className="text-xs text-gh-text-muted">
                {formatFullDate(completeCommit.commit.author.date)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Branch Info */}
      <div className="mt-auto pt-4 border-t border-gh-border">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gh-text-muted">Branch</span>
          <code className="font-mono text-gh-accent">{branchName}</code>
        </div>
      </div>
    </div>
  );
}


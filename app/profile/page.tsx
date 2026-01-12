"use client";

import { useState } from "react";
import { useUser } from "@/app/hooks/useUser";
import { useBuggers, useResults } from "@/app/hooks/useBuggers";
import { useInvitations } from "@/app/hooks/useInvitations";
import Link from "next/link";
import { 
  BuggrIcon, 
  GitHubIcon, 
  ExternalLinkIcon,
  TrophyIcon,
  CheckIcon,
  ArrowRightIcon,
  CoinIcon
} from "@/app/components/icons";
import { STRESS_LEVEL_COSTS } from "@/lib/stress-costs";
import { Button } from "@/app/components/inputs/Button";
import { Container } from "@/app/components/Container";

/** Coins awarded for sending invitations */
const INVITE_BONUS_COINS = 30;
/** Coins awarded per signup from invitation */
const SIGNUP_BONUS_COINS = 30;

/**
 * User profile/dashboard page.
 * Shows user information, stats, and recent activity.
 */
export default function ProfilePage() {
  const { user, isLoading: userLoading, isError: userError } = useUser();
  const { buggers, isLoading: buggersLoading } = useBuggers({ limit: 5 });
  const { results, isLoading: resultsLoading } = useResults({ limit: 5 });
  const { 
    invitations, 
    hasUsedInviteBonus,
    acceptedCount,
    totalCoinsEarned,
    sendInvites, 
    isSending,
    isLoading: invitationsLoading 
  } = useInvitations();

  // Email input state - single email input for simpler UX
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  const isLoading = userLoading || buggersLoading || resultsLoading || invitationsLoading;

  /**
   * Handles sending an invitation to the entered email.
   */
  async function handleSendInvite() {
    setInviteError(null);
    setInviteSuccess(null);
    
    if (!inviteEmail.trim()) {
      setInviteError("Please enter an email address");
      return;
    }

    try {
      const result = await sendInvites([inviteEmail.trim()]);
      setInviteSuccess(result.message);
      setInviteEmail("");
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Failed to send invite");
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d1117]">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gh-accent/30 border-t-gh-accent" />
              <p className="text-sm text-gh-text-muted">Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (userError || !user) {
    return (
      <div className="min-h-screen bg-[#0d1117]">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p className="text-gh-text-muted">Failed to load profile</p>
            <Link href="/dashboard">
              <Button variant="secondary">
                <ArrowRightIcon className="h-4 w-4 rotate-180" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Calculate completion rate
  const completionRate = user.stats.totalBuggers > 0
    ? Math.round((user.stats.completedBuggers / user.stats.totalBuggers) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-[#0d1117]">
      {/* Subtle gradient background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#161b22] via-[#0d1117] to-[#010409]" />
      
      <div className="relative mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <Link 
            href="/dashboard"
            className="flex items-center gap-3 transition-opacity hover:opacity-80"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gh-border bg-gh-canvas-subtle">
              <BuggrIcon className="h-5 w-5 text-white" />
            </div>
            <span className="font-mono text-xl font-bold text-white">Buggr</span>
          </Link>
          
          <Link href="/dashboard">
            <Button variant="secondary" size="sm">
              <ArrowRightIcon className="h-4 w-4 rotate-180" />
              Dashboard
            </Button>
          </Link>
        </div>

        {/* Profile Card */}
        <div className="mb-8 rounded-xl border border-gh-border bg-gh-canvas-subtle p-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            {user.image ? (
              <img 
                src={user.image} 
                alt={user.name || "User"} 
                className="h-20 w-20 rounded-full border-2 border-gh-border"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-gh-border bg-gh-canvas-default">
                <span className="text-2xl font-bold text-white">
                  {user.name?.charAt(0) || user.email?.charAt(0) || "?"}
                </span>
              </div>
            )}

            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">{user.name || "Anonymous"}</h1>
              
              {user.gitUsername && (
                <a 
                  href={user.gitProfileUrl || `https://github.com/${user.gitUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1.5 text-gh-text-muted transition-colors hover:text-white"
                >
                  <GitHubIcon className="h-4 w-4" />
                  <span>@{user.gitUsername}</span>
                  <ExternalLinkIcon className="h-3 w-3" />
                </a>
              )}

              {user.email && (
                <p className="mt-1 text-sm text-gh-text-muted">{user.email}</p>
              )}

              <p className="mt-3 text-xs text-gh-text-muted">
                Member since {new Date(user.createdAt).toLocaleDateString("en-US", { 
                  month: "long", 
                  year: "numeric" 
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Coins Section */}
        <div className="mb-8 rounded-xl border border-gh-accent/30 bg-gradient-to-r from-gh-accent/10 to-gh-accent/5 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gh-accent/20">
                <CoinIcon className="h-8 w-8 text-gh-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-gh-text-muted">Your Balance</p>
                <p className="text-4xl font-bold text-gh-accent">{user.coins}</p>
                <p className="text-xs text-gh-text-muted">coins available</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-gh-text-muted mb-2">Challenge Costs</p>
              <div className="flex flex-col gap-1 text-xs">
                <div className="flex items-center justify-end gap-2">
                  <span className="text-gh-text-muted">🌱 Low:</span>
                  <span className="font-semibold text-green-400">{STRESS_LEVEL_COSTS.low} coins</span>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <span className="text-gh-text-muted">🔥 Medium:</span>
                  <span className="font-semibold text-yellow-400">{STRESS_LEVEL_COSTS.medium} coins</span>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <span className="text-gh-text-muted">💀 High:</span>
                  <span className="font-semibold text-red-400">{STRESS_LEVEL_COSTS.high} coins</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Invite Friends Section */}
        <div className="mb-8 rounded-xl border border-gh-border bg-gh-canvas-subtle p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Invite Friends</h2>
              <p className="text-sm text-gh-text-muted">
                Earn <span className="text-gh-accent">{SIGNUP_BONUS_COINS} coins</span> for each friend who signs up!
                {!hasUsedInviteBonus && (
                  <span className="ml-1 text-green-400">
                    + {INVITE_BONUS_COINS} bonus coins on your first invite!
                  </span>
                )}
              </p>
            </div>
            {totalCoinsEarned > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-1.5">
                <CoinIcon className="h-4 w-4 text-green-400" />
                <span className="text-sm font-semibold text-green-400">+{totalCoinsEarned} earned</span>
              </div>
            )}
          </div>

          {/* Invite Form */}
          <div className="mb-4">
            <div className="flex gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => {
                  setInviteEmail(e.target.value);
                  setInviteError(null);
                }}
                placeholder="Enter friend's email address"
                className="flex-1 rounded-lg border border-gh-border bg-gh-canvas-default px-3 py-2 text-sm text-white placeholder-gh-text-muted focus:border-gh-accent focus:outline-none focus:ring-1 focus:ring-gh-accent"
                disabled={isSending}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && inviteEmail.trim()) {
                    e.preventDefault();
                    handleSendInvite();
                  }
                }}
              />
              <Button
                variant="primary"
                size="sm"
                disabled={isSending || !inviteEmail.trim()}
                onClick={handleSendInvite}
              >
                {isSending ? "Sending..." : "Invite"}
              </Button>
            </div>
          </div>

          {inviteError && (
            <p className="mb-3 text-sm text-red-400">{inviteError}</p>
          )}
          {inviteSuccess && (
            <p className="mb-3 text-sm text-green-400">{inviteSuccess}</p>
          )}

          {/* Invitations List */}
          {invitations.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-gh-text-muted">
                Your invitations ({acceptedCount} of {invitations.length} signed up)
              </p>
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {invitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between rounded-lg border border-gh-border bg-gh-canvas-default px-3 py-2"
                  >
                    <span className="text-sm text-white">{inv.email}</span>
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        inv.status === "accepted"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {inv.status === "accepted" ? (
                        <span className="flex items-center gap-1">
                          <CheckIcon className="h-3 w-3" />
                          +{SIGNUP_BONUS_COINS} coins
                        </span>
                      ) : (
                        "Pending"
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          <Container className="p-4 text-center">
            <p className="text-3xl font-bold text-white">{user.stats.totalBuggers}</p>
            <p className="mt-1 text-sm text-gh-text-muted">Challenges</p>
          </Container>
          <Container className="p-4 text-center">
            <p className="text-3xl font-bold text-green-400">{user.stats.completedBuggers}</p>
            <p className="mt-1 text-sm text-gh-text-muted">Completed</p>
          </Container>
          <Container className="p-4 text-center">
            <p className="text-3xl font-bold text-gh-accent">{completionRate}%</p>
            <p className="mt-1 text-sm text-gh-text-muted">Completion Rate</p>
          </Container>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Buggers */}
          <div className="rounded-xl border border-gh-border bg-gh-canvas-subtle p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gh-text-muted">
              <BuggrIcon className="h-4 w-4" />
              Recent Challenges
            </h2>
            
            {buggers.length > 0 ? (
              <div className="space-y-3">
                {buggers.map((bugger) => (
                  <div 
                    key={bugger.id} 
                    className="flex items-center justify-between rounded-lg border border-gh-border bg-gh-canvas-default p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">
                        {bugger.owner}/{bugger.repo}
                      </p>
                      <p className="text-xs text-gh-text-muted">
                        {bugger.branchName}
                      </p>
                    </div>
                    <div className="ml-3 flex items-center gap-2">
                      {bugger.result ? (
                        <span className="rounded bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400">
                          {bugger.result.grade}
                        </span>
                      ) : (
                        <span className="rounded bg-yellow-500/20 px-2 py-0.5 text-xs font-medium text-yellow-400">
                          In Progress
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <BuggrIcon className="mb-2 h-8 w-8 text-gh-text-muted" />
                <p className="text-sm text-gh-text-muted">No challenges yet</p>
                <Link href="/dashboard" className="mt-2">
                  <Button variant="primary" size="sm">Start Buggering</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Recent Results */}
          <div className="rounded-xl border border-gh-border bg-gh-canvas-subtle p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gh-text-muted">
              <TrophyIcon className="h-4 w-4" />
              Recent Results
            </h2>
            
            {results.length > 0 ? (
              <div className="space-y-3">
                {results.map((result) => (
                  <div 
                    key={result.id} 
                    className="flex items-center justify-between rounded-lg border border-gh-border bg-gh-canvas-default p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">
                        {result.bugger.owner}/{result.bugger.repo}
                      </p>
                      <p className="text-xs text-gh-text-muted">
                        {formatTime(result.timeMs)} · {result.bugger.stressLevel}
                      </p>
                    </div>
                    <div className="ml-3 flex items-center gap-2">
                      <span className={`rounded px-2 py-0.5 text-xs font-bold ${getGradeColor(result.grade)}`}>
                        {result.grade}
                      </span>
                      {result.analysisIsPerfect && (
                        <CheckIcon className="h-4 w-4 text-green-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <TrophyIcon className="mb-2 h-8 w-8 text-gh-text-muted" />
                <p className="text-sm text-gh-text-muted">No results yet</p>
                <p className="mt-1 text-xs text-gh-text-muted">Complete a challenge to see results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Formats milliseconds to a human-readable time string.
 */
function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * Returns Tailwind classes for grade colors.
 */
function getGradeColor(grade: string): string {
  if (grade.startsWith("A")) return "bg-green-500/20 text-green-400";
  if (grade.startsWith("B")) return "bg-blue-500/20 text-blue-400";
  if (grade.startsWith("C")) return "bg-yellow-500/20 text-yellow-400";
  if (grade.startsWith("D")) return "bg-orange-500/20 text-orange-400";
  return "bg-red-500/20 text-red-400";
}


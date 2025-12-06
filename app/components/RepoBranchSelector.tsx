"use client";

import { useState } from "react";
import type { GitHubRepo, GitHubBranch, GitHubCommit, GitHubCommitDetails } from "@/lib/github";
import { useNotes } from "@/app/context/NotesContext";
import { NotesPanel } from "@/app/components/NotesPanel";
import { Select } from "@/app/components/inputs/Select";
import { Button } from "@/app/components/inputs/Button";
import { EmptyState, EmptyStateIcons } from "@/app/components/EmptyState";
import { CommitCard } from "@/app/components/commits/CommitCard";
import { FileChangeList } from "@/app/components/commits/FileChangeList";
import { CreateBranchForm } from "@/app/components/stress/CreateBranchForm";
import { StressResultCard } from "@/app/components/stress/StressResultCard";
import { BranchSuccessCard } from "@/app/components/stress/BranchSuccessCard";

interface RepoBranchSelectorProps {
  repos: GitHubRepo[];
  accessToken: string;
}

// Loading steps for the stress process
const LOADING_STEPS = [
  { label: "Creating branch", icon: "branch", timeEstimate: "5-30s" },
  { label: "Analyzing files", icon: "search", timeEstimate: "5-30s" },
  { label: "Stressing out your code", icon: "stress", timeEstimate: "1-2 min" },
  { label: "Committing changes", icon: "commit", timeEstimate: "5-30s" },
  { label: "Finalizing", icon: "check", timeEstimate: "5-30s" },
];

/**
 * Split-screen component for selecting a repository, branch, viewing commits,
 * and displaying details for selected commits including changed files.
 *
 * @param repos - List of user's GitHub repositories
 * @param accessToken - GitHub OAuth access token for fetching data
 */
export function RepoBranchSelector({ repos, accessToken }: RepoBranchSelectorProps) {
  const { addNote } = useNotes();
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [selectedCommit, setSelectedCommit] = useState<GitHubCommit | null>(null);
  const [commitDetails, setCommitDetails] = useState<GitHubCommitDetails | null>(null);
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingCommits, setLoadingCommits] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create branch state
  const [showCreateBranch, setShowCreateBranch] = useState(false);
  const [branchSuffix, setBranchSuffix] = useState("");
  const [stressContext, setStressContext] = useState("");
  const [stressLevel, setStressLevel] = useState<"low" | "medium" | "high">("medium");
  const [creatingBranch, setCreatingBranch] = useState(false);
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const [branchSuccess, setBranchSuccess] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState(() => generateTimestamp());
  const [deletingBranch, setDeletingBranch] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copiedBranchLink, setCopiedBranchLink] = useState(false);

  // Stress result state
  const [stressResult, setStressResult] = useState<{
    message: string;
    results: { file: string; success: boolean; changes?: string[] }[];
    symptoms?: string[];
  } | null>(null);

  /**
   * Generates a timestamp string for branch naming (YYYYMMDD-HHMMSS).
   */
  function generateTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    return `${year}${month}${day}-${hours}${minutes}${seconds}`;
  }

  /**
   * Fetches branches for the selected repository.
   */
  async function handleRepoSelect(repo: GitHubRepo) {
    setSelectedRepo(repo);
    setSelectedBranch(null);
    setSelectedCommit(null);
    setCommitDetails(null);
    setCommits([]);
    setLoadingBranches(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/github/branches?owner=${repo.owner.login}&repo=${repo.name}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch branches");
      }

      const data = await response.json();
      setBranches(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBranches([]);
    } finally {
      setLoadingBranches(false);
    }
  }

  /**
   * Fetches commits for the selected branch.
   */
  async function handleBranchSelect(branchName: string) {
    if (!selectedRepo) return;

    setSelectedBranch(branchName);
    setSelectedCommit(null);
    setCommitDetails(null);
    setLoadingCommits(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/github/commits?owner=${selectedRepo.owner.login}&repo=${selectedRepo.name}&branch=${encodeURIComponent(branchName)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch commits");
      }

      const data = await response.json();
      setCommits(data);

      // Auto-select the first commit if available
      if (data.length > 0) {
        handleCommitSelect(data[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setCommits([]);
    } finally {
      setLoadingCommits(false);
    }
  }

  /**
   * Fetches details for the selected commit including changed files.
   */
  async function handleCommitSelect(commit: GitHubCommit) {
    if (!selectedRepo) return;

    setSelectedCommit(commit);
    setLoadingDetails(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/github/commit?owner=${selectedRepo.owner.login}&repo=${selectedRepo.name}&sha=${commit.sha}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch commit details");
      }

      const data = await response.json();
      setCommitDetails(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setCommitDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  }

  /**
   * Creates a new branch from the selected commit and automatically introduces stress.
   */
  async function handleCreateBranch(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRepo || !selectedCommit || !selectedBranch || !commitDetails?.files) return;

    const base = `stresst-${selectedBranch}-${timestamp}`;
    const fullBranchName = branchSuffix.trim() ? `${base}-${branchSuffix.trim()}` : base;

    // Filter out removed files, sort by most changes, and limit to top 3
    // This keeps token usage reasonable while targeting the most impactful files
    const MAX_FILES_TO_STRESS = 3;
    const filesToStress = commitDetails.files
      .filter((f) => f.status !== "removed")
      .sort((a, b) => (b.additions + b.deletions) - (a.additions + a.deletions))
      .slice(0, MAX_FILES_TO_STRESS)
      .map((f) => f.filename);

    if (filesToStress.length === 0) {
      setError("No files available to introduce stress to");
      return;
    }

    setCreatingBranch(true);
    setLoadingStep(0);
    setError(null);
    setBranchSuccess(null);
    setStressResult(null);

    try {
      // Step 1: Create the branch
      setLoadingStep(1);
      const response = await fetch("/api/github/branch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: selectedRepo.owner.login,
          repo: selectedRepo.name,
          branchName: fullBranchName,
          sha: selectedCommit.sha,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create branch");
      }

      // Step 2: Analyze files
      setLoadingStep(2);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Step 3: Introduce stress on the new branch
      setLoadingStep(3);
      const stressResponse = await fetch("/api/github/stress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: selectedRepo.owner.login,
          repo: selectedRepo.name,
          branch: fullBranchName,
          files: filesToStress,
          context: stressContext.trim() || undefined,
          difficulty: stressLevel,
        }),
      });

      // Step 4: Committing changes
      setLoadingStep(4);
      const stressData = await stressResponse.json();

      // Step 5: Finalizing
      setLoadingStep(5);
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (!stressResponse.ok) {
        setBranchSuccess(fullBranchName);
        setError(`Branch created, but stress failed: ${stressData.error || "Unknown error"}`);
      } else {
        setBranchSuccess(fullBranchName);
        setStressResult(stressData);

        if (stressData.symptoms && stressData.symptoms.length > 0) {
          addNote({
            title: "🐛 Bug Report Received",
            messages: stressData.symptoms,
            branchName: fullBranchName,
            repoName: selectedRepo.name,
            repoOwner: selectedRepo.owner.login,
          });
        }
      }

      setBranchSuffix("");
      setStressContext("");
      setStressLevel("medium");
      setShowCreateBranch(false);

      // Refresh branches list
      const branchesResponse = await fetch(
        `/api/github/branches?owner=${selectedRepo.owner.login}&repo=${selectedRepo.name}`
      );
      if (branchesResponse.ok) {
        const branchesData = await branchesResponse.json();
        setBranches(branchesData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create branch");
    } finally {
      setCreatingBranch(false);
      setLoadingStep(0);
    }
  }

  /**
   * Deletes the currently selected branch.
   */
  async function handleDeleteBranch() {
    if (!selectedRepo || !selectedBranch) return;

    const protectedBranches = ["main", "master", "develop", "dev"];
    if (protectedBranches.includes(selectedBranch.toLowerCase())) {
      setError("Cannot delete protected branches");
      return;
    }

    setDeletingBranch(true);
    setError(null);

    try {
      const response = await fetch("/api/github/branch/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: selectedRepo.owner.login,
          repo: selectedRepo.name,
          branchName: selectedBranch,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete branch");
      }

      const branchesResponse = await fetch(
        `/api/github/branches?owner=${selectedRepo.owner.login}&repo=${selectedRepo.name}`
      );
      if (branchesResponse.ok) {
        const branchesData = await branchesResponse.json();
        setBranches(branchesData);
      }

      setSelectedBranch(null);
      setSelectedCommit(null);
      setCommitDetails(null);
      setCommits([]);
      setShowDeleteConfirm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete branch");
    } finally {
      setDeletingBranch(false);
    }
  }

  /**
   * Formats a date string to a full readable format.
   */
  function formatFullDate(dateString: string): string {
    return new Date(dateString).toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  /**
   * Copies the branch link to clipboard.
   */
  async function handleCopyBranchLink() {
    if (!selectedRepo || !selectedBranch) return;

    const branchUrl = `https://github.com/${selectedRepo.owner.login}/${selectedRepo.name}/tree/${encodeURIComponent(selectedBranch)}`;

    try {
      await navigator.clipboard.writeText(branchUrl);
      setCopiedBranchLink(true);
      setTimeout(() => setCopiedBranchLink(false), 2000);
    } catch (err) {
      console.error("Failed to copy branch link:", err);
      setError("Failed to copy branch link");
    }
  }

  return (
    <div className="flex h-screen w-full">
      {/* Left Panel - Selection & Commits */}
      <div className="flex h-full w-[40%] flex-col border-r border-gh-border p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gh-border bg-gh-canvas-subtle">
              <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h1 className="font-mono text-xl font-bold text-white">stresst</h1>
          </div>
          <NotesPanel />
        </div>

        {/* Selectors */}
        <div className="flex flex-col gap-4">
          <Select
            label="Repository"
            value={selectedRepo?.id ?? ""}
            onChange={(e) => {
              const repo = repos.find((r) => r.id === Number(e.target.value));
              if (repo) handleRepoSelect(repo);
            }}
            placeholder="Choose a repository..."
            options={repos.map((repo) => ({
              value: repo.id,
              label: `${repo.full_name}${repo.private ? " 🔒" : ""}`,
            }))}
          />

          {selectedRepo && (
            <>
              {loadingBranches ? (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gh-text-muted">Branch</label>
                  <div className="flex items-center justify-center py-3">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gh-border border-t-gh-success" />
                  </div>
                </div>
              ) : (
                <Select
                  label="Branch"
                  value={selectedBranch ?? ""}
                  onChange={(e) => {
                    if (e.target.value) handleBranchSelect(e.target.value);
                  }}
                  placeholder="Choose a branch..."
                  options={branches.map((branch) => ({
                    value: branch.name,
                    label: `${branch.name}${branch.protected ? " 🔒" : ""}`,
                  }))}
                />
              )}
            </>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Commits List */}
        {selectedBranch && (
          <div className="mt-6 flex min-h-0 flex-1 flex-col">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gh-text-muted">
                Recent commits on <span className="font-mono text-white">{selectedBranch}</span>
              </h3>

              {selectedBranch.includes("stresst-test-") && (
                <div className="flex items-center gap-2">
                  {showDeleteConfirm ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gh-danger-fg">Delete branch?</span>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={handleDeleteBranch}
                        disabled={deletingBranch}
                      >
                        {deletingBranch ? "Deleting..." : "Yes"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                        No
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyBranchLink}
                        title="Copy branch link to share"
                      >
                        {copiedBranchLink ? (
                          <>
                            <svg
                              className="h-3.5 w-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Copied!
                          </>
                        ) : (
                          <>
                            <svg
                              className="h-3.5 w-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                            Copy link
                          </>
                        )}
                      </Button>
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gh-text-muted transition-colors hover:bg-gh-danger/20 hover:text-gh-danger-fg"
                        title="Delete this branch"
                      >
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        Delete
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {loadingCommits ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-gh-border border-t-gh-success" />
              </div>
            ) : commits.length === 0 ? (
              <EmptyState icon={EmptyStateIcons.commits} title="No commits found" size="sm" />
            ) : (
              <div className="flex-1 overflow-y-auto rounded-lg border border-gh-border bg-gh-canvas-subtle">
                {commits.map((commit) => (
                  <CommitCard
                    key={commit.sha}
                    commit={commit}
                    isSelected={selectedCommit?.sha === commit.sha}
                    onClick={() => handleCommitSelect(commit)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Panel - Commit Details & Files */}
      <div className="flex h-full w-[60%] flex-col overflow-hidden p-6">
        {loadingDetails ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gh-border border-t-gh-success" />
          </div>
        ) : selectedCommit && commitDetails ? (
          <div className="flex h-full flex-col gap-6 overflow-y-auto">
            {/* Commit Header */}
            <div className="flex items-start gap-4">
              {selectedCommit.author?.avatar_url ? (
                <img
                  src={selectedCommit.author.avatar_url}
                  alt={selectedCommit.author.login}
                  className="h-12 w-12 rounded-full"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gh-border text-lg text-gh-text-muted">
                  {selectedCommit.commit.author.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <h2 className="text-lg font-semibold text-white">
                  {selectedCommit.author?.login ?? selectedCommit.commit.author.name}
                </h2>
                <p className="text-sm text-gh-text-muted">
                  {formatFullDate(selectedCommit.commit.author.date)}
                </p>
              </div>
            </div>

            {/* Commit Message */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <code className="rounded-md bg-gh-canvas-subtle px-2 py-1 font-mono text-xs text-gh-accent">
                  {selectedCommit.sha.substring(0, 7)}
                </code>
                {commitDetails.stats && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gh-success-fg">+{commitDetails.stats.additions}</span>
                    <span className="text-gh-danger-fg">-{commitDetails.stats.deletions}</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-white">{selectedCommit.commit.message.split("\n")[0]}</p>
            </div>

            {/* Changed Files */}
            <div className="flex min-h-0 flex-1 flex-col gap-3">
              <h3 className="flex items-center gap-2 text-sm font-medium text-gh-text-muted">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                {commitDetails.files?.length ?? 0} files changed
              </h3>

              <FileChangeList files={commitDetails.files ?? []} />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {selectedRepo && !showCreateBranch && (
                <a
                  href={`https://github.com/${selectedRepo.full_name}/commit/${selectedCommit.sha}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-gh-border bg-gh-border-muted px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gh-border"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  View on GitHub
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              )}

              {selectedBranch && selectedBranch.includes("stresst-test-") && !showCreateBranch && (
                <Button
                  variant="secondary"
                  onClick={handleCopyBranchLink}
                  title="Copy branch link to share"
                >
                  {copiedBranchLink ? (
                    <>
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      Copy branch link
                    </>
                  )}
                </Button>
              )}

              {!showCreateBranch && (
                <Button
                  variant="danger"
                  onClick={() => {
                    setShowCreateBranch(true);
                    setTimestamp(generateTimestamp());
                  }}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Stress out this commit
                </Button>
              )}
            </div>

            {/* Stress Result */}
            {stressResult && selectedCommit && (
              <StressResultCard
                result={stressResult}
                authorName={selectedCommit.author?.login ?? selectedCommit.commit.author.name}
                onDismiss={() => setStressResult(null)}
              />
            )}

            {/* Create Branch Form */}
            {showCreateBranch && selectedBranch && (
              <CreateBranchForm
                baseBranch={selectedBranch}
                timestamp={timestamp}
                branchSuffix={branchSuffix}
                onBranchSuffixChange={setBranchSuffix}
                stressContext={stressContext}
                onStressContextChange={setStressContext}
                stressLevel={stressLevel}
                onStressLevelChange={setStressLevel}
                isLoading={creatingBranch}
                loadingStep={loadingStep}
                loadingSteps={LOADING_STEPS}
                onSubmit={handleCreateBranch}
                onCancel={() => {
                  setShowCreateBranch(false);
                  setBranchSuffix("");
                  setStressContext("");
                  setStressLevel("medium");
                }}
              />
            )}

            {/* Branch Success Message */}
            {branchSuccess && (
              <BranchSuccessCard
                branchName={branchSuccess}
                onDismiss={() => setBranchSuccess(null)}
                onShowBranch={() => {
                  handleBranchSelect(branchSuccess);
                  setBranchSuccess(null);
                }}
              />
            )}
          </div>
        ) : selectedCommit ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gh-border border-t-gh-success" />
          </div>
        ) : (
          <EmptyState
            icon={EmptyStateIcons.commits}
            title="No commit selected"
            description="Select a commit from the list to view changed files"
          />
        )}
      </div>
    </div>
  );
}

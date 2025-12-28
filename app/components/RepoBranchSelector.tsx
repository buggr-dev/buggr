"use client";

import { useState, useEffect } from "react";
import type { GitHubRepo, GitHubBranch, GitHubCommit, GitHubCommitDetails, StressMetadata } from "@/lib/github";
import { fetchStressMetadata } from "@/lib/github";
import { useDashboardUrl } from "@/app/hooks/useDashboardUrl";
import { useNotes } from "@/app/context/NotesContext";
import { NotesPanel } from "@/app/components/NotesPanel";
import { Select } from "@/app/components/inputs/Select";
import { Button } from "@/app/components/inputs/Button";
import { TextButton } from "@/app/components/inputs/TextButton";
import { EmptyState, EmptyStateIcons } from "@/app/components/EmptyState";
import { CommitCard } from "@/app/components/commits/CommitCard";
import { FileChangeList } from "@/app/components/commits/FileChangeList";
import { CreateBranchForm } from "@/app/components/stress/CreateBranchForm";
import { BranchSuccessCard } from "@/app/components/stress/BranchSuccessCard";
import { ScorePanel } from "@/app/components/stress/ScorePanel";
import { PublicReposList } from "@/app/components/PublicReposList";
import { GitHubIcon, CloseIcon, TrashIcon, DocumentIcon, CheckIcon, CopyIcon, LightningIcon, ExternalLinkIcon, TrophyIcon } from "@/app/components/icons";

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
export function RepoBranchSelector({ repos: initialRepos, accessToken }: RepoBranchSelectorProps) {
  const { addNote, addBranchChange } = useNotes();
  const { params: urlParams, isInitialized: urlInitialized, updateParams: updateUrlParams, clearParams: clearUrlParams } = useDashboardUrl();

  const [repos, setRepos] = useState<GitHubRepo[]>(initialRepos);
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
  const [deletingAllBranches, setDeletingAllBranches] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  // Score panel state
  const [showScorePanel, setShowScorePanel] = useState(false);
  const [stressMetadata, setStressMetadata] = useState<StressMetadata | null>(null);
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  /**
   * Finds a commit with "start" in the message (case-insensitive).
   */
  const startCommit = commits.find((c) => c.commit.message.toLowerCase().includes("start") || c.commit.message.toLowerCase().includes("run"));

  /**
   * Finds a commit with "complete" in the message (case-insensitive).
   */
  const completeCommit = commits.find(
    (c) =>
      c.commit.message.toLowerCase().includes("complete") ||
      c.commit.message.toLowerCase().includes("done") ||
      c.commit.message.toLowerCase().includes("stop") ||
      c.commit.message.toLowerCase().includes("end")
  );

  /**
   * Whether both start and complete commits exist (score can be calculated).
   */
  const canCheckScore = Boolean(startCommit && completeCommit);

  /**
   * Automatically show score panel when both start and complete commits are detected.
   */
  useEffect(() => {
    if (canCheckScore) {
      setShowScorePanel(true);
    }
  }, [canCheckScore]);

  /**
   * Initialize state from URL parameters on mount.
   */
  useEffect(() => {
    if (!urlInitialized) return;

    // Only run once when URL is first initialized
    if (selectedRepo) return;

    if (urlParams.repo) {
      // Find matching repo
      const repo = initialRepos.find((r) => r.full_name === urlParams.repo);
      if (repo) {
        // Trigger repo selection which will fetch branches
        handleRepoSelect(repo).then(() => {
          // After repo is selected, select branch if provided
          if (urlParams.branch) {
            handleBranchSelect(urlParams.branch);
          }
        });
      }
    }

    // Show score panel if URL param is set
    if (urlParams.score) {
      setShowScorePanel(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlInitialized]);

  /**
   * Select commit from URL param after commits are loaded.
   */
  useEffect(() => {
    if (!urlInitialized || !urlParams.commit) return;
    if (commits.length > 0 && !selectedCommit) {
      const commit = commits.find((c) => c.sha === urlParams.commit || c.sha.startsWith(urlParams.commit!));
      if (commit) {
        handleCommitSelect(commit);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commits, urlInitialized, urlParams.commit]);

  /**
   * Update URL when selections change.
   */
  useEffect(() => {
    if (!urlInitialized) return;
    updateUrlParams({
      repo: selectedRepo?.full_name || null,
      branch: selectedBranch,
      commit: selectedCommit?.sha.substring(0, 7) || null,
      score: showScorePanel,
    });
  }, [selectedRepo, selectedBranch, selectedCommit, showScorePanel, urlInitialized, updateUrlParams]);

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
    setShowScorePanel(false);

    try {
      const response = await fetch(`/api/github/branches?owner=${repo.owner.login}&repo=${repo.name}`);

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
    setShowScorePanel(false);
    setStressMetadata(null);

    try {
      const response = await fetch(`/api/github/commits?owner=${selectedRepo.owner.login}&repo=${selectedRepo.name}&branch=${encodeURIComponent(branchName)}`);

      if (!response.ok) {
        throw new Error("Failed to fetch commits");
      }

      const data = await response.json();
      setCommits(data);

      // Auto-select the first commit if available
      if (data.length > 0) {
        handleCommitSelect(data[0]);
      }

      // Fetch stress metadata for stresst branches
      if (branchName.includes("stresst-")) {
        setLoadingMetadata(true);
        try {
          const metadata = await fetchStressMetadata(accessToken, selectedRepo.owner.login, selectedRepo.name, branchName);
          setStressMetadata(metadata);
        } catch {
          // Silently fail - metadata is optional
          setStressMetadata(null);
        } finally {
          setLoadingMetadata(false);
        }
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
      const response = await fetch(`/api/github/commit?owner=${selectedRepo.owner.login}&repo=${selectedRepo.name}&sha=${commit.sha}`);

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
      .sort((a, b) => b.additions + b.deletions - (a.additions + a.deletions))
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
          originalCommitSha: selectedCommit.sha,
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

        // Add branch change to notifications (viewable in Branch Changes tab)
        addBranchChange({
          branchName: fullBranchName,
          repoName: selectedRepo.name,
          repoOwner: selectedRepo.owner.login,
          message: stressData.message,
          files: stressData.results,
        });

        // Add bug report if symptoms were generated
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
      const branchesResponse = await fetch(`/api/github/branches?owner=${selectedRepo.owner.login}&repo=${selectedRepo.name}`);
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

      const branchesResponse = await fetch(`/api/github/branches?owner=${selectedRepo.owner.login}&repo=${selectedRepo.name}`);
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

  /**
   * Deletes all branches that include "stresst-" in their name.
   */
  async function handleDeleteAllStressedBranches() {
    if (!selectedRepo) return;

    setDeletingAllBranches(true);
    setError(null);
    setShowDeleteAllConfirm(false);

    try {
      const response = await fetch("/api/github/branches/delete-all", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: selectedRepo.owner.login,
          repo: selectedRepo.name,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete branches");
      }

      const data = await response.json();

      // Refresh branches list
      const branchesResponse = await fetch(`/api/github/branches?owner=${selectedRepo.owner.login}&repo=${selectedRepo.name}`);
      if (branchesResponse.ok) {
        const branchesData = await branchesResponse.json();
        setBranches(branchesData);
      }

      // Clear selection if the current branch was deleted
      if (selectedBranch && data.deleted.includes(selectedBranch)) {
        setSelectedBranch(null);
        setSelectedCommit(null);
        setCommitDetails(null);
        setCommits([]);
      }

      // Show success message
      if (data.count > 0) {
        setError(null);
        // Could show a success message here if needed
      } else {
        setError("No stresst- branches found to delete");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete branches");
    } finally {
      setDeletingAllBranches(false);
    }
  }

  /**
   * Handles successful fork by adding the forked repo to the list and selecting it.
   */
  async function handleForkSuccess(forkedRepo: GitHubRepo) {
    // Add the forked repo to the beginning of the list
    setRepos((prev) => [forkedRepo, ...prev.filter((r) => r.id !== forkedRepo.id)]);

    // Auto-select the forked repo
    handleRepoSelect(forkedRepo);
  }

  return (
    <div className="flex h-screen w-full">
      {/* Left Panel - Selection & Commits */}
      <div className="flex h-full w-[40%] flex-col border-r border-gh-border p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gh-border bg-gh-canvas-subtle">
              <GitHubIcon className="h-5 w-5 text-white" />
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
                <>
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
                </>
              )}
            </>
          )}
        </div>

        {/* Action Buttons Row */}
        {selectedRepo && (
          <div className="mt-2 flex items-center justify-between">
            <TextButton
              onClick={() => {
                setSelectedRepo(null);
                setSelectedBranch(null);
                setSelectedCommit(null);
                setCommitDetails(null);
                setBranches([]);
                setCommits([]);
                setBranchSuccess(null);
                setShowCreateBranch(false);
                setShowScorePanel(false);
                clearUrlParams();
              }}
              title="Clear selection">
              <CloseIcon className="h-3.5 w-3.5" />
              Clear selection
            </TextButton>

            {branches.some((b) => b.name.includes("stresst-")) && (
              <>
                {showDeleteAllConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gh-danger-fg">Delete all {branches.filter((b) => b.name.includes("stresst-")).length} stressed branches?</span>
                    <Button variant="danger" size="sm" onClick={handleDeleteAllStressedBranches} disabled={deletingAllBranches}>
                      {deletingAllBranches ? "Deleting..." : "Yes"}
                    </Button>
                    <TextButton onClick={() => setShowDeleteAllConfirm(false)} disabled={deletingAllBranches}>
                      No
                    </TextButton>
                  </div>
                ) : (
                  <TextButton variant="danger" onClick={() => setShowDeleteAllConfirm(true)} disabled={deletingAllBranches}>
                    <TrashIcon className="h-3.5 w-3.5" />
                    Delete all stressed branches
                  </TextButton>
                )}
              </>
            )}
          </div>
        )}

        {/* Public Repos Section - only show when no branch selected */}
        {!selectedBranch && <PublicReposList onForkSuccess={handleForkSuccess} />}

        {/* Error Display */}
        {error && <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

        {/* Commits List */}
        {selectedBranch && (
          <div className="mt-4 flex min-h-0 flex-1 flex-col">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gh-text-muted">
                Recent commits on <span className="font-mono text-white">{selectedBranch}</span>
              </h3>

              {selectedBranch.includes("stresst-") && (
                <div className="flex items-center gap-2">
                  {showDeleteConfirm ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gh-danger-fg">Delete branch?</span>
                      <Button variant="danger" size="sm" onClick={handleDeleteBranch} disabled={deletingBranch}>
                        {deletingBranch ? "Deleting..." : "Yes"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                        No
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Button variant="ghost" size="sm" onClick={handleCopyBranchLink} title="Copy branch link to share">
                        {copiedBranchLink ? (
                          <>
                            <CheckIcon className="h-3.5 w-3.5" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <CopyIcon className="h-3.5 w-3.5" />
                            Copy link
                          </>
                        )}
                      </Button>
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gh-text-muted transition-colors hover:bg-gh-danger/20 hover:text-gh-danger-fg"
                        title="Delete this branch">
                        <TrashIcon className="h-3.5 w-3.5" />
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
                  <CommitCard key={commit.sha} commit={commit} isSelected={selectedCommit?.sha === commit.sha} onClick={() => handleCommitSelect(commit)} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Panel - Commit Details & Files */}
      <div className="flex h-full w-[60%] flex-col overflow-hidden p-6">
        {/* Score Panel View */}
        {showScorePanel && startCommit && completeCommit ? (
          <ScorePanel startCommit={startCommit} completeCommit={completeCommit} branchName={selectedBranch || ""} onClose={() => setShowScorePanel(false)} stressMetadata={stressMetadata} />
        ) : loadingDetails ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gh-border border-t-gh-success" />
          </div>
        ) : selectedCommit && commitDetails ? (
          <div className="flex h-full flex-col gap-6 overflow-y-auto">
            {/* Commit Header */}
            <div className="flex items-start gap-4">
              {selectedCommit.author?.avatar_url ? (
                <img src={selectedCommit.author.avatar_url} alt={selectedCommit.author.login} className="h-12 w-12 rounded-full" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gh-border text-lg text-gh-text-muted">{selectedCommit.commit.author.name.charAt(0).toUpperCase()}</div>
              )}
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <h2 className="text-lg font-semibold text-white">{selectedCommit.author?.login ?? selectedCommit.commit.author.name}</h2>
                <p className="text-sm text-gh-text-muted">{formatFullDate(selectedCommit.commit.author.date)}</p>
              </div>
            </div>

            {/* Commit Message */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <code className="rounded-md bg-gh-canvas-subtle px-2 py-1 font-mono text-xs text-gh-accent">{selectedCommit.sha.substring(0, 7)}</code>
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
                <DocumentIcon className="h-4 w-4" />
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
                  className="inline-flex items-center gap-2 rounded-lg border border-gh-border bg-gh-border-muted px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gh-border">
                  <GitHubIcon className="h-4 w-4" />
                  View on GitHub
                  <ExternalLinkIcon className="h-3 w-3" />
                </a>
              )}

              {selectedBranch && selectedBranch.includes("stresst-") && !showCreateBranch && (
                <Button variant="secondary" onClick={handleCopyBranchLink} title="Copy branch link to share">
                  {copiedBranchLink ? (
                    <>
                      <CheckIcon className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <CopyIcon className="h-4 w-4" />
                      Copy branch link
                    </>
                  )}
                </Button>
              )}

              {selectedBranch && selectedBranch.includes("stresst-") && !showCreateBranch && (
                <div className="group relative">
                  <Button
                    variant={canCheckScore ? "primary" : "secondary"}
                    onClick={() => setShowScorePanel(!showScorePanel)}
                    disabled={!canCheckScore}
                    className={!canCheckScore ? "opacity-50 cursor-not-allowed" : ""}>
                    <TrophyIcon className="h-4 w-4" />
                    {showScorePanel ? "Hide Score" : "Check Score"}
                  </Button>
                  {/* Tooltip for disabled state */}
                  {!canCheckScore && (
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-lg border border-gh-border bg-[#1c2128] p-3 text-xs opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
                      <p className="font-semibold text-white mb-1.5">How to check your score:</p>
                      <ol className="text-gh-text-muted space-y-1 list-decimal list-inside text-[11px]">
                        <li>
                          Commit with <code className="text-gh-accent">start</code> when you begin
                        </li>
                        <li>
                          Commit with <code className="text-gh-accent">complete</code> when done
                        </li>
                      </ol>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-6 border-transparent border-t-[#1c2128]" />
                    </div>
                  )}
                </div>
              )}

              {!showCreateBranch && (
                <Button
                  variant="danger"
                  onClick={() => {
                    setShowCreateBranch(true);
                    setTimestamp(generateTimestamp());
                  }}>
                  <LightningIcon className="h-4 w-4" />
                  Stress out this commit
                </Button>
              )}
            </div>

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
          <EmptyState icon={EmptyStateIcons.commits} title="No commit selected" description="Select a commit from the list to view changed files" />
        )}
      </div>
    </div>
  );
}

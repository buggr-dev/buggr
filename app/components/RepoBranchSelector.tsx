"use client";

import { useState } from "react";
import type { GitHubRepo, GitHubBranch, GitHubCommit, GitHubCommitDetails } from "@/lib/github";
import { useNotes } from "@/app/context/NotesContext";
import { NotesPanel } from "@/app/components/NotesPanel";

interface RepoBranchSelectorProps {
  repos: GitHubRepo[];
  accessToken: string;
}

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

  // Loading steps for the stress process
  const loadingSteps = [
    { label: "Creating branch", icon: "branch" },
    { label: "Analyzing files", icon: "search" },
    { label: "Stressing out your code", icon: "stress" },
    { label: "Committing changes", icon: "commit" },
    { label: "Finalizing", icon: "check" },
  ];
  
  // Stress result state
  const [stressResult, setStressResult] = useState<{ message: string; results: { file: string; success: boolean; changes?: string[] }[]; symptoms?: string[] } | null>(null);

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

    try {
      const response = await fetch(`/api/github/commits?owner=${selectedRepo.owner.login}&repo=${selectedRepo.name}&branch=${encodeURIComponent(branchName)}`);

      if (!response.ok) {
        throw new Error("Failed to fetch commits");
      }

      const data = await response.json();
      setCommits(data);
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
   * Generates the full branch name with the stresst prefix, timestamp, and optional suffix.
   */
  function getFullBranchName(suffix: string): string {
    if (!selectedBranch) return "";
    const base = `stresst-${selectedBranch}-${timestamp}`;
    return suffix.trim() ? `${base}-${suffix.trim()}` : base;
  }

  /**
   * Creates a new branch from the selected commit and automatically introduces stress.
   * 
   * @param e - Form submit event
   * @returns void
   * @sideeffects Creates branch, introduces stress mutations, and updates UI state
   */
  async function handleCreateBranch(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRepo || !selectedCommit || !selectedBranch || !commitDetails?.files) return;

    const fullBranchName = getFullBranchName(branchSuffix);
    
    // Get the list of files to stress before creating the branch
    const filesToStress = commitDetails.files
      .filter((f) => f.status !== "removed")
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
      // Small delay to show the step
      await new Promise(resolve => setTimeout(resolve, 500));

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
      await new Promise(resolve => setTimeout(resolve, 300));

      if (!stressResponse.ok) {
        // Branch was created but stress failed - inform user
        setBranchSuccess(fullBranchName);
        setError(`Branch created, but stress failed: ${stressData.error || "Unknown error"}`);
      } else {
        // Both succeeded
        setBranchSuccess(fullBranchName);
        setStressResult(stressData);
        
        // Add a bug report note with symptoms
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
      
      // Refresh branches list (but don't auto-switch)
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

    // Prevent deletion of protected branches
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

      // Refresh branches list
      const branchesResponse = await fetch(`/api/github/branches?owner=${selectedRepo.owner.login}&repo=${selectedRepo.name}`);
      if (branchesResponse.ok) {
        const branchesData = await branchesResponse.json();
        setBranches(branchesData);
      }

      // Clear selection
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
   * Formats a date string to a relative time (e.g., "2 hours ago").
   */
  function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
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
   * Returns the appropriate color classes for a file status.
   */
  function getStatusColor(status: string): { bg: string; text: string; label: string } {
    switch (status) {
      case "added":
        return { bg: "bg-[#238636]/20", text: "text-[#3fb950]", label: "A" };
      case "removed":
        return { bg: "bg-[#da3633]/20", text: "text-[#f85149]", label: "D" };
      case "modified":
        return { bg: "bg-[#9e6a03]/20", text: "text-[#d29922]", label: "M" };
      case "renamed":
        return { bg: "bg-[#8b949e]/20", text: "text-[#8b949e]", label: "R" };
      default:
        return { bg: "bg-[#8b949e]/20", text: "text-[#8b949e]", label: "?" };
    }
  }

  return (
    <div className="flex h-screen w-full">
      {/* Left Panel - Selection & Commits */}
      <div className="flex h-full w-[40%] flex-col border-r border-[#30363d] p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#30363d] bg-[#161b22]">
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
          {/* Repository Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#8b949e]">Repository</label>
            <div className="relative">
              <select
                className="w-full appearance-none rounded-lg border border-[#30363d] bg-[#161b22] px-4 py-2.5 pr-10 text-sm text-white transition-colors focus:border-[#238636] focus:outline-none focus:ring-1 focus:ring-[#238636]"
                value={selectedRepo?.id ?? ""}
                onChange={(e) => {
                  const repo = repos.find((r) => r.id === Number(e.target.value));
                  if (repo) handleRepoSelect(repo);
                }}>
                <option value="">Choose a repository...</option>
                {repos.map((repo) => (
                  <option key={repo.id} value={repo.id}>
                    {repo.full_name} {repo.private ? "🔒" : ""}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <svg className="h-4 w-4 text-[#8b949e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Branch Selector */}
          {selectedRepo && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#8b949e]">Branch</label>
              {loadingBranches ? (
                <div className="flex items-center justify-center py-3">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#30363d] border-t-[#238636]" />
                </div>
              ) : (
                <div className="relative">
                  <select
                    className="w-full appearance-none rounded-lg border border-[#30363d] bg-[#161b22] px-4 py-2.5 pr-10 text-sm text-white transition-colors focus:border-[#238636] focus:outline-none focus:ring-1 focus:ring-[#238636]"
                    value={selectedBranch ?? ""}
                    onChange={(e) => {
                      if (e.target.value) handleBranchSelect(e.target.value);
                    }}>
                    <option value="">Choose a branch...</option>
                    {branches.map((branch) => (
                      <option key={branch.name} value={branch.name}>
                        {branch.name} {branch.protected ? "🔒" : ""}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="h-4 w-4 text-[#8b949e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

        {/* Commits List */}
        {selectedBranch && (
          <div className="mt-6 flex min-h-0 flex-1 flex-col">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-[#8b949e]">
                Recent commits on <span className="font-mono text-white">{selectedBranch}</span>
              </h3>
              
              {/* Delete branch button - only for stresst branches */}
              {selectedBranch.startsWith("stresst-") && (
                <div className="relative">
                  {showDeleteConfirm ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#f85149]">Delete branch?</span>
                      <button
                        onClick={handleDeleteBranch}
                        disabled={deletingBranch}
                        className="rounded px-2 py-1 text-xs font-medium text-white bg-[#da3633] hover:bg-[#f85149] disabled:opacity-50"
                      >
                        {deletingBranch ? "Deleting..." : "Yes"}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="rounded px-2 py-1 text-xs text-[#8b949e] hover:text-white"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[#8b949e] transition-colors hover:bg-[#da3633]/20 hover:text-[#f85149]"
                      title="Delete this branch"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>

            {loadingCommits ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#30363d] border-t-[#238636]" />
              </div>
            ) : commits.length === 0 ? (
              <div className="rounded-lg border border-[#30363d] bg-[#161b22] px-4 py-3 text-sm text-[#8b949e]">No commits found</div>
            ) : (
              <div className="flex-1 overflow-y-auto rounded-lg border border-[#30363d] bg-[#161b22]">
                {commits.map((commit) => (
                  <button
                    key={commit.sha}
                    onClick={() => handleCommitSelect(commit)}
                    className={`flex w-full gap-3 border-b border-[#30363d] p-3 text-left transition-colors last:border-b-0 hover:bg-[#21262d] ${
                      selectedCommit?.sha === commit.sha ? "bg-[#238636]/10 hover:bg-[#238636]/15" : ""
                    }`}>
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {commit.author?.avatar_url ? (
                        <img src={commit.author.avatar_url} alt={commit.author.login} className="h-8 w-8 rounded-full" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#30363d] text-xs text-[#8b949e]">{commit.commit.author.name.charAt(0).toUpperCase()}</div>
                      )}
                    </div>

                    {/* Commit Details */}
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <p className="truncate text-sm font-medium text-white">{commit.commit.message.split("\n")[0]}</p>
                      <div className="flex items-center gap-2 text-xs text-[#8b949e]">
                        <span>{commit.author?.login ?? commit.commit.author.name}</span>
                        <span>•</span>
                        <span>{formatRelativeTime(commit.commit.author.date)}</span>
                      </div>
                    </div>

                    {/* Selection indicator */}
                    {selectedCommit?.sha === commit.sha && (
                      <div className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-[#238636]" />
                      </div>
                    )}
                  </button>
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
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#30363d] border-t-[#238636]" />
          </div>
        ) : selectedCommit && commitDetails ? (
          <div className="flex h-full flex-col gap-6 overflow-y-auto">
            {/* Commit Header */}
            <div className="flex items-start gap-4">
              {selectedCommit.author?.avatar_url ? (
                <img src={selectedCommit.author.avatar_url} alt={selectedCommit.author.login} className="h-12 w-12 rounded-full" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#30363d] text-lg text-[#8b949e]">{selectedCommit.commit.author.name.charAt(0).toUpperCase()}</div>
              )}
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <h2 className="text-lg font-semibold text-white">{selectedCommit.author?.login ?? selectedCommit.commit.author.name}</h2>
                <p className="text-sm text-[#8b949e]">{formatFullDate(selectedCommit.commit.author.date)}</p>
              </div>
            </div>

            {/* Commit Message */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <code className="rounded-md bg-[#161b22] px-2 py-1 font-mono text-xs text-[#58a6ff]">{selectedCommit.sha.substring(0, 7)}</code>
                {commitDetails.stats && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[#3fb950]">+{commitDetails.stats.additions}</span>
                    <span className="text-[#f85149]">-{commitDetails.stats.deletions}</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-white">{selectedCommit.commit.message.split("\n")[0]}</p>
            </div>

            {/* Changed Files */}
            <div className="flex min-h-0 flex-1 flex-col gap-3">
              <h3 className="flex items-center gap-2 text-sm font-medium text-[#8b949e]">
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

              {commitDetails.files && commitDetails.files.length > 0 ? (
                <div className="flex-1 overflow-y-auto rounded-lg border border-[#30363d] bg-[#161b22]">
                  {commitDetails.files.map((file) => {
                    const statusStyle = getStatusColor(file.status);
                    return (
                      <div key={file.sha + file.filename} className="flex items-center gap-3 border-b border-[#30363d] px-4 py-3 last:border-b-0 hover:bg-[#21262d]">
                        {/* Status Badge */}
                        <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-xs font-bold ${statusStyle.bg} ${statusStyle.text}`}>{statusStyle.label}</span>

                        {/* Filename */}
                        <span className="min-w-0 flex-1 truncate font-mono text-sm text-white">
                          {file.status === "renamed" && file.previous_filename ? (
                            <>
                              <span className="text-[#8b949e]">{file.previous_filename}</span>
                              <span className="mx-2 text-[#8b949e]">→</span>
                              {file.filename}
                            </>
                          ) : (
                            file.filename
                          )}
                        </span>

                        {/* Changes */}
                        <div className="flex flex-shrink-0 items-center gap-2 text-xs">
                          {file.additions > 0 && <span className="text-[#3fb950]">+{file.additions}</span>}
                          {file.deletions > 0 && <span className="text-[#f85149]">-{file.deletions}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-[#30363d] bg-[#161b22] px-4 py-3 text-sm text-[#8b949e]">No files changed</div>
              )}
            </div>
            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {/* View on GitHub Button */}
              {selectedRepo && !showCreateBranch && (
                <a
                  href={`https://github.com/${selectedRepo.full_name}/commit/${selectedCommit.sha}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-[#30363d] bg-[#21262d] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#30363d]"
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}

              {/* Create Branch & Stress Button */}
              {!showCreateBranch && (
                <button
                  onClick={() => {
                    setShowCreateBranch(true);
                    setTimestamp(generateTimestamp());
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#da3633] bg-[#da3633] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#f85149]"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Stress out this commit
                </button>
              )}
            </div>

            {/* Stress Result */}
            {stressResult && selectedCommit && (
              <div className="rounded-lg border border-[#da3633]/30 bg-[#da3633]/10 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="flex items-center gap-2 font-medium text-[#f85149]">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {selectedCommit.author?.login ?? selectedCommit.commit.author.name}'s commit is now stressed! 😈
                  </h4>
                  <button
                    onClick={() => setStressResult(null)}
                    className="text-[#8b949e] hover:text-white"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="mb-2 text-sm text-[#f85149]">{stressResult.message}</p>
                <div className="space-y-2">
                  {stressResult.results.filter(r => r.success).map((result) => (
                    <div key={result.file} className="rounded border border-[#30363d] bg-[#161b22] p-2 text-xs">
                      <div className="font-mono text-white">{result.file}</div>
                      {result.changes && (
                        <ul className="mt-1 list-inside list-disc text-[#8b949e]">
                          {result.changes.map((change, i) => (
                            <li key={i}>{change}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Create Branch Form */}
            {showCreateBranch && selectedBranch && (
              <form onSubmit={handleCreateBranch} className="flex flex-col gap-3 rounded-lg border border-[#30363d] bg-[#161b22] p-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-white">Create stressed branch from this commit</label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateBranch(false);
                      setBranchSuffix("");
                      setStressContext("");
                      setStressLevel("medium");
                    }}
                    className="text-[#8b949e] hover:text-white"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center rounded-lg border border-[#30363d] bg-[#0d1117]">
                  <span className="whitespace-nowrap border-r border-[#30363d] bg-[#161b22] px-3 py-2 font-mono text-sm text-[#8b949e]">
                    stresst-{selectedBranch}-{timestamp}-
                  </span>
                  <input
                    type="text"
                    value={branchSuffix}
                    onChange={(e) => setBranchSuffix(e.target.value.replace(/\s/g, "-"))}
                    placeholder="optional-suffix"
                    className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-[#8b949e] focus:outline-none"
                    disabled={creatingBranch}
                  />
                </div>

                <p className="text-xs text-[#8b949e]">
                  Full branch name: <code className="text-[#58a6ff]">{getFullBranchName(branchSuffix)}</code>
                </p>

                {/* Stress level selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#8b949e]">Stress Level</label>
                  <div className="flex rounded-lg border border-[#30363d] bg-[#0d1117] p-1">
                    <button
                      type="button"
                      onClick={() => setStressLevel("low")}
                      disabled={creatingBranch}
                      className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                        stressLevel === "low"
                          ? "bg-[#238636] text-white"
                          : "text-[#8b949e] hover:text-white"
                      }`}
                    >
                      🌱 Low
                    </button>
                    <button
                      type="button"
                      onClick={() => setStressLevel("medium")}
                      disabled={creatingBranch}
                      className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                        stressLevel === "medium"
                          ? "bg-[#9e6a03] text-white"
                          : "text-[#8b949e] hover:text-white"
                      }`}
                    >
                      🔥 Medium
                    </button>
                    <button
                      type="button"
                      onClick={() => setStressLevel("high")}
                      disabled={creatingBranch}
                      className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                        stressLevel === "high"
                          ? "bg-[#da3633] text-white"
                          : "text-[#8b949e] hover:text-white"
                      }`}
                    >
                      💀 High
                    </button>
                  </div>
                  <p className="text-xs text-[#6e7681]">
                    {stressLevel === "low" && "1-2 straightforward bugs, easier to spot"}
                    {stressLevel === "medium" && "2-3 subtle bugs, requires careful review"}
                    {stressLevel === "high" && "3-5 devious bugs, may require deep debugging"}
                  </p>
                </div>

                {/* Optional stress context */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#8b949e]">
                    Focus area <span className="text-[#6e7681]">(optional)</span>
                  </label>
                  <div className="relative">
                    <textarea
                      value={stressContext}
                      onChange={(e) => setStressContext(e.target.value.slice(0, 200))}
                      placeholder="e.g., Test their understanding of async/await, null handling, or array bounds..."
                      className="w-full resize-none rounded-lg border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-white placeholder-[#6e7681] focus:border-[#da3633] focus:outline-none focus:ring-1 focus:ring-[#da3633]"
                      rows={2}
                      maxLength={200}
                      disabled={creatingBranch}
                    />
                    <span className="absolute bottom-2 right-2 text-xs text-[#6e7681]">
                      {stressContext.length}/200
                    </span>
                  </div>
                </div>

                {/* Submit button or Loading progress */}
                {creatingBranch ? (
                  <div className="rounded-lg border border-[#30363d] bg-[#0d1117] p-4">
                    {/* Progress header */}
                    <div className="mb-4 flex items-center gap-3">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#30363d] border-t-[#da3633]" />
                      <div>
                        <p className="text-sm font-medium text-white">
                          {loadingSteps[loadingStep - 1]?.label || "Preparing..."}
                        </p>
                        <p className="text-xs text-[#8b949e]">This may take a moment</p>
                      </div>
                    </div>
                    
                    {/* Progress steps */}
                    <div className="space-y-2">
                      {loadingSteps.map((step, index) => {
                        const stepNum = index + 1;
                        const isComplete = loadingStep > stepNum;
                        const isCurrent = loadingStep === stepNum;
                        const isPending = loadingStep < stepNum;
                        
                        return (
                          <div key={step.label} className="flex items-center gap-3">
                            {/* Step indicator */}
                            <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                              isComplete 
                                ? "bg-[#238636] text-white" 
                                : isCurrent 
                                  ? "bg-[#da3633] text-white animate-pulse" 
                                  : "bg-[#30363d] text-[#8b949e]"
                            }`}>
                              {isComplete ? (
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                stepNum
                              )}
                            </div>
                            
                            {/* Step label */}
                            <span className={`text-sm transition-colors ${
                              isComplete 
                                ? "text-[#3fb950]" 
                                : isCurrent 
                                  ? "text-white font-medium" 
                                  : "text-[#8b949e]"
                            }`}>
                              {step.label}
                              {isCurrent && <span className="ml-1.5 inline-block animate-pulse">...</span>}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Progress bar */}
                    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#30363d]">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-[#da3633] to-[#f85149] transition-all duration-500"
                        style={{ width: `${(loadingStep / loadingSteps.length) * 100}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#da3633] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#f85149]"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Create & Stress
                  </button>
                )}
              </form>
            )}

            {/* Branch Success Message */}
            {branchSuccess && (
              <div className="rounded-lg border border-[#238636]/30 bg-[#238636]/10 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#3fb950]">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm font-medium">Branch created successfully!</span>
                  </div>
                  <button
                    onClick={() => setBranchSuccess(null)}
                    className="text-[#8b949e] hover:text-white"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="mb-3 text-xs text-[#8b949e]">
                  <code className="rounded bg-[#30363d] px-1.5 py-0.5 font-mono text-[#3fb950]">{branchSuccess}</code>
                </p>
                <button
                  onClick={() => {
                    handleBranchSelect(branchSuccess);
                    setBranchSuccess(null);
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#238636] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2ea043]"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  Show Stressed Branch
                </button>
              </div>
            )}
          </div>
        ) : selectedCommit ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#30363d] border-t-[#238636]" />
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#30363d] bg-[#161b22]">
              <svg className="h-8 w-8 text-[#8b949e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-medium text-white">No commit selected</h3>
              <p className="max-w-xs text-sm text-[#8b949e]">Select a commit from the list to view changed files</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

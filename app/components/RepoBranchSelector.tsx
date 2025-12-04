"use client";

import { useState } from "react";
import type { GitHubRepo, GitHubBranch, GitHubCommit } from "@/lib/github";

interface RepoBranchSelectorProps {
  repos: GitHubRepo[];
  accessToken: string;
}

/**
 * Split-screen component for selecting a repository, branch, viewing commits,
 * and displaying details for selected commits.
 * 
 * @param repos - List of user's GitHub repositories
 * @param accessToken - GitHub OAuth access token for fetching data
 */
export function RepoBranchSelector({ repos, accessToken }: RepoBranchSelectorProps) {
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [selectedCommit, setSelectedCommit] = useState<GitHubCommit | null>(null);
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingCommits, setLoadingCommits] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches branches for the selected repository.
   */
  async function handleRepoSelect(repo: GitHubRepo) {
    setSelectedRepo(repo);
    setSelectedBranch(null);
    setSelectedCommit(null);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setCommits([]);
    } finally {
      setLoadingCommits(false);
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

  return (
    <div className="flex h-screen w-full">
      {/* Left Panel - Selection & Commits */}
      <div className="flex h-full w-1/2 flex-col border-r border-[#30363d] p-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#30363d] bg-[#161b22]">
            <svg
              className="h-5 w-5 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h1 className="font-mono text-xl font-bold text-white">stresst</h1>
        </div>

        {/* Selectors */}
        <div className="flex flex-col gap-4">
          {/* Repository Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#8b949e]">
              Repository
            </label>
            <div className="relative">
              <select
                className="w-full appearance-none rounded-lg border border-[#30363d] bg-[#161b22] px-4 py-2.5 pr-10 text-sm text-white transition-colors focus:border-[#238636] focus:outline-none focus:ring-1 focus:ring-[#238636]"
                value={selectedRepo?.id ?? ""}
                onChange={(e) => {
                  const repo = repos.find((r) => r.id === Number(e.target.value));
                  if (repo) handleRepoSelect(repo);
                }}
              >
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
              <label className="text-sm font-medium text-[#8b949e]">
                Branch
              </label>
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
                    }}
                  >
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
        {error && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Commits List */}
        {selectedBranch && (
          <div className="mt-6 flex min-h-0 flex-1 flex-col">
            <h3 className="mb-3 text-sm font-medium text-[#8b949e]">
              Recent commits on <span className="font-mono text-white">{selectedBranch}</span>
            </h3>
            
            {loadingCommits ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#30363d] border-t-[#238636]" />
              </div>
            ) : commits.length === 0 ? (
              <div className="rounded-lg border border-[#30363d] bg-[#161b22] px-4 py-3 text-sm text-[#8b949e]">
                No commits found
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto rounded-lg border border-[#30363d] bg-[#161b22]">
                {commits.map((commit) => (
                  <button
                    key={commit.sha}
                    onClick={() => setSelectedCommit(commit)}
                    className={`flex w-full gap-3 border-b border-[#30363d] p-3 text-left transition-colors last:border-b-0 hover:bg-[#21262d] ${
                      selectedCommit?.sha === commit.sha ? "bg-[#238636]/10 hover:bg-[#238636]/15" : ""
                    }`}
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {commit.author?.avatar_url ? (
                        <img
                          src={commit.author.avatar_url}
                          alt={commit.author.login}
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#30363d] text-xs text-[#8b949e]">
                          {commit.commit.author.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    {/* Commit Details */}
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <p className="truncate text-sm font-medium text-white">
                        {commit.commit.message.split('\n')[0]}
                      </p>
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

      {/* Right Panel - Commit Details */}
      <div className="flex h-full w-1/2 flex-col p-6">
        {selectedCommit ? (
          <div className="flex flex-col gap-6">
            {/* Commit Header */}
            <div className="flex items-start gap-4">
              {selectedCommit.author?.avatar_url ? (
                <img
                  src={selectedCommit.author.avatar_url}
                  alt={selectedCommit.author.login}
                  className="h-12 w-12 rounded-full"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#30363d] text-lg text-[#8b949e]">
                  {selectedCommit.commit.author.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-white">
                  {selectedCommit.author?.login ?? selectedCommit.commit.author.name}
                </h2>
                <p className="text-sm text-[#8b949e]">
                  {formatFullDate(selectedCommit.commit.author.date)}
                </p>
              </div>
            </div>

            {/* Commit SHA */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium uppercase tracking-wide text-[#8b949e]">
                Commit SHA
              </label>
              <div className="flex items-center gap-2">
                <code className="rounded-md bg-[#161b22] px-3 py-2 font-mono text-sm text-[#58a6ff]">
                  {selectedCommit.sha}
                </code>
              </div>
            </div>

            {/* Commit Message */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium uppercase tracking-wide text-[#8b949e]">
                Commit Message
              </label>
              <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-4">
                <p className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-white">
                  {selectedCommit.commit.message}
                </p>
              </div>
            </div>

            {/* Link to GitHub */}
            {selectedRepo && (
              <a
                href={`https://github.com/${selectedRepo.full_name}/commit/${selectedCommit.sha}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 self-start rounded-lg border border-[#30363d] bg-[#21262d] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#30363d]"
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
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#30363d] bg-[#161b22]">
              <svg
                className="h-8 w-8 text-[#8b949e]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-medium text-white">No commit selected</h3>
              <p className="max-w-xs text-sm text-[#8b949e]">
                Select a commit from the list to view its details
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

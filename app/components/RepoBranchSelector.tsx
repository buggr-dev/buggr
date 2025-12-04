"use client";

import { useState } from "react";
import type { GitHubRepo, GitHubBranch, GitHubCommit } from "@/lib/github";

interface RepoBranchSelectorProps {
  repos: GitHubRepo[];
  accessToken: string;
}

/**
 * Interactive component for selecting a repository, branch, and viewing commits.
 * 
 * @param repos - List of user's GitHub repositories
 * @param accessToken - GitHub OAuth access token for fetching data
 */
export function RepoBranchSelector({ repos, accessToken }: RepoBranchSelectorProps) {
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
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

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      {/* Repository Selector */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-[#8b949e]">
          Select a repository
        </label>
        <div className="relative">
          <select
            className="w-full appearance-none rounded-lg border border-[#30363d] bg-[#161b22] px-4 py-3 pr-10 text-white transition-colors focus:border-[#238636] focus:outline-none focus:ring-1 focus:ring-[#238636]"
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
            <svg
              className="h-5 w-5 text-[#8b949e]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Branch Selector */}
      {selectedRepo && (
        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium text-[#8b949e]">
            Select a branch
          </label>
          {loadingBranches ? (
            <div className="flex items-center justify-center py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#30363d] border-t-[#238636]" />
            </div>
          ) : (
            <div className="relative">
              <select
                className="w-full appearance-none rounded-lg border border-[#30363d] bg-[#161b22] px-4 py-3 pr-10 text-white transition-colors focus:border-[#238636] focus:outline-none focus:ring-1 focus:ring-[#238636]"
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
                <svg
                  className="h-5 w-5 text-[#8b949e]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400">
          {error}
        </div>
      )}

      {/* Commits List */}
      {selectedBranch && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-[#8b949e]">
            Recent commits on <span className="font-mono text-white">{selectedBranch}</span>
          </h3>
          
          {loadingCommits ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#30363d] border-t-[#238636]" />
            </div>
          ) : commits.length === 0 ? (
            <div className="rounded-lg border border-[#30363d] bg-[#161b22] px-4 py-3 text-[#8b949e]">
              No commits found
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-[#30363d] bg-[#161b22]">
              {commits.map((commit, index) => (
                <div
                  key={commit.sha}
                  className="flex gap-3 border-b border-[#30363d] p-4 last:border-b-0 hover:bg-[#21262d]"
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {commit.author?.avatar_url ? (
                      <img
                        src={commit.author.avatar_url}
                        alt={commit.author.login}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#30363d] text-sm text-[#8b949e]">
                        {commit.commit.author.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  {/* Commit Details */}
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="truncate text-sm font-medium text-white">
                      {commit.commit.message.split('\n')[0]}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-[#8b949e]">
                      <span className="font-medium">
                        {commit.author?.login ?? commit.commit.author.name}
                      </span>
                      <span>•</span>
                      <span>{formatRelativeTime(commit.commit.author.date)}</span>
                      <span>•</span>
                      <span className="font-mono text-[#58a6ff]">
                        {commit.sha.substring(0, 7)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

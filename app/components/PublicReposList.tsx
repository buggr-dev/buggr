"use client";

import { useState, useEffect } from "react";
import type { GitHubRepo } from "@/lib/github";
import { Button } from "@/app/components/inputs/Button";
import { GitHubIcon, ForkIcon } from "@/app/components/icons";
import { RepoCard } from "@/app/components/repos/RepoCard";

interface PublicReposListProps {
  /** Callback when a repo is successfully forked */
  onForkSuccess?: (forkedRepo: GitHubRepo) => void;
  /** User's existing repos to check for already forked repos */
  userRepos?: GitHubRepo[];
}

/**
 * Displays a list of public repositories available for forking.
 * Fetches repos from the Buggr GitHub account.
 *
 * @param onForkSuccess - Callback triggered when a repo is successfully forked
 * @param userRepos - User's existing repos to determine if a repo is already forked
 */
export function PublicReposList({ onForkSuccess, userRepos = [] }: PublicReposListProps) {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forkingRepo, setForkingRepo] = useState<string | null>(null);
  const [forkError, setForkError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRepos() {
      try {
        const response = await fetch("/api/github/public-repos");
        if (!response.ok) {
          throw new Error("Failed to fetch repos");
        }
        const data = await response.json();
        setRepos(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load repos");
      } finally {
        setLoading(false);
      }
    }

    fetchRepos();
  }, []);

  /**
   * Forks a repository into the user's GitHub account.
   */
  async function handleFork(repo: GitHubRepo) {
    setForkingRepo(repo.full_name);
    setForkError(null);

    try {
      const response = await fetch("/api/github/fork", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: repo.owner.login,
          repo: repo.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fork repository");
      }

      // Call success callback with the forked repo
      if (onForkSuccess && data.repo) {
        onForkSuccess(data.repo);
      }
    } catch (err) {
      setForkError(err instanceof Error ? err.message : "Failed to fork repository");
    } finally {
      setForkingRepo(null);
    }
  }

  if (loading) {
    return (
      <div className="mt-3 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-gh-border" />
          <span className="text-xs font-medium text-gh-text-muted">or fork one of our public repos</span>
          <div className="h-px flex-1 bg-gh-border" />
        </div>
        <div className="flex items-center justify-center py-4">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gh-border border-t-gh-success" />
        </div>
      </div>
    );
  }

  if (error || repos.length === 0) {
    return null; // Don't show section if no repos available
  }

  return (
    <div className="mt-3 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-gh-border" />
        <span className="text-xs font-medium text-gh-text-muted">or fork one of our public repos</span>
        <div className="h-px flex-1 bg-gh-border" />
      </div>

      {forkError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {forkError}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {repos.filter((repo) => repo.name !== "buggr").map((repo) => {
          const isForking = forkingRepo === repo.full_name;
          const repoUrl = `https://github.com/${repo.full_name}`;
          const isAlreadyForked = userRepos.some((userRepo) => userRepo.name === repo.name);
          
          return (
            <RepoCard
              key={repo.id}
              repo={repo}
              actions={
                <>
                  {/* View on GitHub button */}
                  <a
                    href={repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-md border border-gh-border px-2.5 py-1.5 text-xs text-gh-text-muted transition-colors hover:border-gh-text-muted hover:text-white"
                    title="View on GitHub"
                  >
                    <GitHubIcon className="h-3.5 w-3.5" />
                    View
                  </a>
                  
                  {/* Fork button */}
                  <Button
                    size="sm"
                    onClick={() => handleFork(repo)}
                    disabled={isForking || forkingRepo !== null || isAlreadyForked}
                    title={isAlreadyForked ? "Already forked to your account" : "Fork to your account"}
                  >
                    {isForking ? (
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <ForkIcon className="h-3.5 w-3.5" />
                    )}
                    {isAlreadyForked ? "Forked" : "Fork"}
                  </Button>
                </>
              }
            />
          );
        })}
      </div>
    </div>
  );
}

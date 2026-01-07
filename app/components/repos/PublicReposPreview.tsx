"use client";

import { useState, useEffect } from "react";
import { RepoCard, RepoCardData } from "./RepoCard";

/**
 * Displays a preview of public practice repositories on the landing page.
 * Fetches repos from the API and displays them in a read-only format.
 * Used for unauthenticated users to see available practice codebases.
 */
export function PublicReposPreview() {
  const [repos, setRepos] = useState<RepoCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {/* Skeleton loaders */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg border border-gh-border bg-gh-canvas-subtle px-4 py-3"
          >
            <div className="flex flex-col gap-2">
              <div className="h-4 w-40 animate-pulse rounded bg-gh-border" />
              <div className="h-3 w-64 animate-pulse rounded bg-gh-border" />
              <div className="mt-1 flex items-center gap-3">
                <div className="h-3 w-20 animate-pulse rounded bg-gh-border" />
                <div className="h-3 w-12 animate-pulse rounded bg-gh-border" />
              </div>
            </div>
            <div className="h-7 w-16 animate-pulse rounded bg-gh-border" />
          </div>
        ))}
      </div>
    );
  }

  if (error || repos.length === 0) {
    return (
      <div className="rounded-lg border border-gh-border bg-gh-canvas-subtle px-4 py-6 text-center text-sm text-gh-text-muted">
        Practice repositories will be available soon.
      </div>
    );
  }

  // Filter out the buggr repo itself
  const practiceRepos = repos.filter((repo) => repo.name !== "buggr");

  if (practiceRepos.length === 0) {
    return (
      <div className="rounded-lg border border-gh-border bg-gh-canvas-subtle px-4 py-6 text-center text-sm text-gh-text-muted">
        Practice repositories will be available soon.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {practiceRepos.map((repo) => (
        <RepoCard key={repo.id} repo={repo} />
      ))}
    </div>
  );
}


"use client";

import type { GitHubRepo, GitHubBranch, GitHubCommit } from "@/lib/github";
import type { BranchBuggerInfo } from "@/app/hooks/useRepoBranchSelector";
import { NotesPanel } from "@/app/components/NotesPanel";
import { Select } from "@/app/components/inputs/Select";
import { Button } from "@/app/components/inputs/Button";
import { TextButton } from "@/app/components/inputs/TextButton";
import { EmptyState, EmptyStateIcons } from "@/app/components/EmptyState";
import { CommitCard } from "@/app/components/commits/CommitCard";
import { BranchCard } from "@/app/components/branches";
import { Container } from "@/app/components/Container";
import { PublicReposList } from "@/app/components/PublicReposList";
import { BuggrIcon, CloseIcon, TrashIcon, CheckIcon, CopyIcon } from "@/app/components/icons";

interface LeftPanelProps {
  repos: GitHubRepo[];
  selectedRepo: GitHubRepo | null;
  onRepoSelect: (repo: GitHubRepo) => void;

  branches: GitHubBranch[];
  selectedBranch: string | null;
  loadingBranches: boolean;
  onBranchSelect: (branchName: string) => void;

  commits: GitHubCommit[];
  selectedCommit: GitHubCommit | null;
  loadingCommits: boolean;
  onCommitSelect: (commit: GitHubCommit) => void;

  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (show: boolean) => void;
  deletingBranch: boolean;
  onDeleteBranch: () => void;
  showDeleteAllConfirm: boolean;
  setShowDeleteAllConfirm: (show: boolean) => void;
  deletingAllBranches: boolean;
  onDeleteAllBuggeredBranches: () => void;
  copiedBranchLink: boolean;
  onCopyBranchLink: () => void;

  error: string | null;

  onClearSelection: () => void;
  onForkSuccess: (forkedRepo: GitHubRepo) => void;

  branchBuggerMap: Map<string, BranchBuggerInfo>;
  loadingBuggers: boolean;
}

function hasBuggrBranches(branches: GitHubBranch[]): boolean {
  return branches.some((b) => b.name.includes("buggr-"));
}

function countBuggrBranches(branches: GitHubBranch[]): number {
  return branches.filter((b) => b.name.includes("buggr-")).length;
}

function isSelectedBuggrBranch(branchName: string | null): boolean {
  return branchName?.includes("buggr-") ?? false;
}

export function LeftPanel({
  repos,
  selectedRepo,
  onRepoSelect,
  branches,
  selectedBranch,
  loadingBranches,
  onBranchSelect,
  commits,
  selectedCommit,
  loadingCommits,
  onCommitSelect,
  showDeleteConfirm,
  setShowDeleteConfirm,
  deletingBranch,
  onDeleteBranch,
  showDeleteAllConfirm,
  setShowDeleteAllConfirm,
  deletingAllBranches,
  onDeleteAllBuggeredBranches,
  copiedBranchLink,
  onCopyBranchLink,
  error,
  onClearSelection,
  onForkSuccess,
  branchBuggerMap,
  loadingBuggers,
}: LeftPanelProps) {

  const renderHeader = () => (
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gh-border bg-gh-canvas-subtle">
          <BuggrIcon className="h-5 w-5 text-white" />
        </div>
        <h1 className="font-mono text-xl font-bold text-white">Buggr</h1>
      </div>
      <NotesPanel />
    </div>
  );

  const renderRepoSelector = () => (
    <Select
      label="Repository"
      value={selectedRepo?.id ?? ""}
      onChange={(e) => {
        const repo = repos.find((r) => r.id === Number(e.target.value));
        if (repo) onRepoSelect(repo);
      }}
      placeholder="Choose a repository..."
      options={repos.map((repo) => ({
        value: repo.id,
        label: repo.full_name,
      }))}
    />
  );

  const renderActionButtons = () => {
    if (!selectedRepo) return null;

    return (
      <div className="mt-2 flex items-center justify-between">
        <TextButton onClick={onClearSelection} title="Clear selection">
          <CloseIcon className="h-3.5 w-3.5" />
          Clear selection
        </TextButton>

        {hasBuggrBranches(branches) && (
          <>
            {showDeleteAllConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gh-danger-fg">
                  Delete all {countBuggrBranches(branches)} buggered branches?
                </span>
                <Button variant="danger" size="sm" onClick={onDeleteAllBuggeredBranches} disabled={deletingAllBranches}>
                  {deletingAllBranches ? "Deleting..." : "Yes"}
                </Button>
                <TextButton onClick={() => setShowDeleteAllConfirm(false)} disabled={deletingAllBranches}>
                  No
                </TextButton>
              </div>
            ) : (
              <TextButton variant="danger" onClick={() => setShowDeleteAllConfirm(true)} disabled={deletingAllBranches}>
                <TrashIcon className="h-3.5 w-3.5" />
                Delete all buggered branches
              </TextButton>
            )}
          </>
        )}
      </div>
    );
  };

  const renderBranchesList = () => {
    if (!selectedRepo) return null;

    return (
      <div className="mt-4 flex min-h-0 flex-col">
        <div className="mb-3 flex items-center gap-2">
          <BuggrIcon className="h-4 w-4 text-gh-text-muted" />
          <h3 className="text-sm font-medium text-gh-text-muted">Branches</h3>
        </div>

        {loadingBranches ? (
          <Container className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gh-border border-t-gh-success" />
          </Container>
        ) : branches.length === 0 ? (
          <EmptyState icon={<BuggrIcon className="h-full w-full" />} title="No branches found" size="sm" />
        ) : (
          <Container scrollable className={selectedBranch ? "max-h-48" : ""}>
            {branches.map((branch) => (
              <BranchCard
                key={branch.name}
                branch={branch}
                isSelected={selectedBranch === branch.name}
                onClick={() => onBranchSelect(branch.name)}
                buggerInfo={branchBuggerMap.get(branch.name)}
                loadingBuggerInfo={loadingBuggers}
              />
            ))}
          </Container>
        )}
      </div>
    );
  };

  const renderSelectedBranchActions = () => {
    if (!selectedBranch || !isSelectedBuggrBranch(selectedBranch)) return null;

    return (
      <div className="flex items-center gap-2">
        {showDeleteConfirm ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gh-danger-fg">Delete branch?</span>
            <Button variant="danger" size="sm" onClick={onDeleteBranch} disabled={deletingBranch}>
              {deletingBranch ? "Deleting..." : "Yes"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)}>
              No
            </Button>
          </div>
        ) : (
          <>
            <Button variant="ghost" size="sm" onClick={onCopyBranchLink} title="Copy branch link to share">
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
              title="Delete this branch"
            >
              <TrashIcon className="h-3.5 w-3.5" />
              Delete
            </button>
          </>
        )}
      </div>
    );
  };

  const renderCommitsList = () => {
    if (!selectedBranch) return null;

    return (
      <div className="mt-4 flex min-h-0 flex-1 flex-col">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-gh-text-muted">
            Recent commits on <span className="font-mono text-white">{selectedBranch}</span>
          </h3>
          {renderSelectedBranchActions()}
        </div>

        {loadingCommits ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gh-border border-t-gh-success" />
          </div>
        ) : commits.length === 0 ? (
          <EmptyState icon={EmptyStateIcons.commits} title="No commits found" size="sm" />
        ) : (
          <Container scrollable>
            {commits.map((commit) => (
              <CommitCard
                key={commit.sha}
                commit={commit}
                isSelected={selectedCommit?.sha === commit.sha}
                onClick={() => onCommitSelect(commit)}
              />
            ))}
          </Container>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full w-[40%] flex-col border-r border-gh-border p-6">
      {renderHeader()}

      <div className="flex flex-col gap-4">
        {renderRepoSelector()}
      </div>

      {renderActionButtons()}

      {!selectedRepo && <PublicReposList onForkSuccess={onForkSuccess} userRepos={repos} />}

      {error && (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {renderBranchesList()}

      {renderCommitsList()}
    </div>
  );
}

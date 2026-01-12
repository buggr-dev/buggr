const GITHUB_API_BASE = "https://api.github.com";

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  owner: {
    login: string;
  };
}

export interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
  };
  protected: boolean;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  author: {
    login: string;
    avatar_url: string;
  } | null;
}

export interface GitHubCommitFile {
  sha: string;
  filename: string;
  status: "added" | "removed" | "modified" | "renamed" | "copied" | "changed" | "unchanged";
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  previous_filename?: string;
}

export interface GitHubCommitDetails extends GitHubCommit {
  files: GitHubCommitFile[];
  stats: {
    total: number;
    additions: number;
    deletions: number;
  };
}

/**
 * Forks a repository into the authenticated user's account.
 * 
 * @param accessToken - GitHub OAuth access token
 * @param owner - Repository owner (username or org)
 * @param repo - Repository name
 * @returns The forked repository object
 */
export async function forkRepository(
  accessToken: string,
  owner: string,
  repo: string
): Promise<GitHubRepo> {
  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/forks`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Failed to fork repository: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetches public repositories from a specific GitHub user or organization.
 * Does not require authentication.
 * 
 * @param username - GitHub username or organization name
 * @returns Array of public repository objects
 */
export async function fetchPublicRepos(username: string): Promise<GitHubRepo[]> {
  const response = await fetch(
    `${GITHUB_API_BASE}/users/${username}/repos?type=public&sort=updated&per_page=10`,
    {
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch public repos: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetches the authenticated user's repositories from GitHub.
 * 
 * @param accessToken - GitHub OAuth access token
 * @returns Array of repository objects
 */
export async function fetchUserRepos(accessToken: string): Promise<GitHubRepo[]> {
  const response = await fetch(`${GITHUB_API_BASE}/user/repos?sort=updated&per_page=100`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch repos: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetches branches for a specific repository.
 * 
 * @param accessToken - GitHub OAuth access token
 * @param owner - Repository owner (username or org)
 * @param repo - Repository name
 * @returns Array of branch objects
 */
export async function fetchRepoBranches(
  accessToken: string,
  owner: string,
  repo: string
): Promise<GitHubBranch[]> {
  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/branches?per_page=100`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch branches: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetches the most recent commits for a specific branch.
 * 
 * @param accessToken - GitHub OAuth access token
 * @param owner - Repository owner (username or org)
 * @param repo - Repository name
 * @param branch - Branch name
 * @param limit - Number of commits to fetch (default: 10)
 * @returns Array of commit objects
 */
export async function fetchBranchCommits(
  accessToken: string,
  owner: string,
  repo: string,
  branch: string,
  limit: number = 10
): Promise<GitHubCommit[]> {
  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits?sha=${encodeURIComponent(branch)}&per_page=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch commits: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetches details for a specific commit, including the list of changed files.
 * 
 * @param accessToken - GitHub OAuth access token
 * @param owner - Repository owner (username or org)
 * @param repo - Repository name
 * @param sha - Commit SHA
 * @returns Commit details including files
 */
export async function fetchCommitDetails(
  accessToken: string,
  owner: string,
  repo: string,
  sha: string
): Promise<GitHubCommitDetails> {
  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits/${sha}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch commit details: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Creates a new branch from a specific commit SHA.
 * 
 * @param accessToken - GitHub OAuth access token
 * @param owner - Repository owner (username or org)
 * @param repo - Repository name
 * @param branchName - Name for the new branch
 * @param sha - Commit SHA to branch from
 * @returns The created reference object
 */
export async function createBranch(
  accessToken: string,
  owner: string,
  repo: string,
  branchName: string,
  sha: string
): Promise<{ ref: string; url: string }> {
  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/refs`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: sha,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Failed to create branch: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Deletes a branch from a repository.
 * 
 * @param accessToken - GitHub OAuth access token
 * @param owner - Repository owner (username or org)
 * @param repo - Repository name
 * @param branchName - Name of the branch to delete
 * @returns void
 */
export async function deleteBranch(
  accessToken: string,
  owner: string,
  repo: string,
  branchName: string
): Promise<void> {
  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branchName)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Failed to delete branch: ${response.statusText}`);
  }
}

export interface GitHubFileContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  content: string;
  encoding: string;
}

/**
 * Metadata stored in .buggr.json for tracking bug session performance.
 */
export interface StressMetadata {
  /** Database ID of the Bugger record (for linking Results) */
  buggerId?: string;
  /** Bug level used: "low", "medium", or "high" */
  stressLevel: "low" | "medium" | "high";
  /** Number of bugs introduced */
  bugCount: number;
  /** ISO timestamp when the bug session was created */
  createdAt: string;
  /** User-facing symptom descriptions */
  symptoms: string[];
  /** Files that were buggered */
  filesBuggered: string[];
  /** Technical descriptions of changes made */
  changes: string[];
  /** Original commit SHA that was branched from */
  originalCommitSha: string;
  /** Repository owner */
  owner: string;
  /** Repository name */
  repo: string;
  /** Branch name */
  branch: string;
}

/**
 * Fetches the content of a file from a specific branch.
 * 
 * @param accessToken - GitHub OAuth access token
 * @param owner - Repository owner (username or org)
 * @param repo - Repository name
 * @param path - File path
 * @param branch - Branch name
 * @returns File content object
 */
export async function fetchFileContent(
  accessToken: string,
  owner: string,
  repo: string,
  path: string,
  branch: string
): Promise<GitHubFileContent> {
  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch file content: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Updates a file on a specific branch.
 * 
 * @param accessToken - GitHub OAuth access token
 * @param owner - Repository owner (username or org)
 * @param repo - Repository name
 * @param path - File path
 * @param content - New file content (will be base64 encoded)
 * @param message - Commit message
 * @param sha - Current file SHA (required for updates)
 * @param branch - Branch name
 * @returns Commit result
 */
export async function updateFile(
  accessToken: string,
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  sha: string,
  branch: string
): Promise<{ commit: { sha: string } }> {
  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        content: Buffer.from(content).toString("base64"),
        sha,
        branch,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Failed to update file: ${response.statusText}`);
  }

  return response.json();
}

/** Path where buggr metadata is stored in branches */
export const STRESS_METADATA_PATH = ".buggr.json";

/**
 * Creates a buggr metadata file in a branch.
 * This file stores information about the bug session for later retrieval (e.g., performance tracking).
 * 
 * @param accessToken - GitHub OAuth access token
 * @param metadata - Bug session metadata to store
 * @returns Commit result
 */
export async function createStressMetadata(
  accessToken: string,
  metadata: StressMetadata
): Promise<{ commit: { sha: string } }> {
  const { owner, repo, branch } = metadata;
  const content = JSON.stringify(metadata, null, 2);
  
  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${STRESS_METADATA_PATH}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "📊 Add buggr metadata",
        content: Buffer.from(content).toString("base64"),
        branch,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Failed to create stress metadata: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetches buggr metadata from a branch.
 * Returns null if the metadata file doesn't exist (branch wasn't created by Buggr).
 * 
 * @param accessToken - GitHub OAuth access token
 * @param owner - Repository owner (username or org)
 * @param repo - Repository name
 * @param branch - Branch name
 * @returns Buggr metadata or null if not found
 */
export async function fetchStressMetadata(
  accessToken: string,
  owner: string,
  repo: string,
  branch: string
): Promise<StressMetadata | null> {
  try {
    const fileContent = await fetchFileContent(
      accessToken,
      owner,
      repo,
      STRESS_METADATA_PATH,
      branch
    );
    
    const decodedContent = Buffer.from(fileContent.content, "base64").toString("utf-8");
    return JSON.parse(decodedContent) as StressMetadata;
  } catch {
    // File doesn't exist or couldn't be parsed - this branch wasn't created by Buggr
    return null;
  }
}

/**
 * Introduces chaos into code by adding breaking changes.
 * 
 * @param content - Original file content
 * @param filename - Name of the file (to determine language)
 * @returns Modified content with breaking changes
 */
export function introduceCodeChaos(content: string, filename: string): { content: string; changes: string[] } {
  const changes: string[] = [];
  let modifiedContent = content;
  
  const ext = filename.split(".").pop()?.toLowerCase();
  
  // TypeScript/JavaScript specific chaos
  if (ext === "ts" || ext === "tsx" || ext === "js" || ext === "jsx") {
    // Chaos 1: Change a random 'const' to 'cost' (typo)
    if (modifiedContent.includes("const ")) {
      const constMatches = modifiedContent.match(/const \w+/g);
      if (constMatches && constMatches.length > 0) {
        const randomConst = constMatches[Math.floor(Math.random() * constMatches.length)];
        modifiedContent = modifiedContent.replace(randomConst, randomConst.replace("const", "cost"));
        changes.push(`Introduced typo: 'const' → 'cost'`);
      }
    }
    
    // Chaos 2: Change === to == (potential logic bug)
    if (modifiedContent.includes("===")) {
      modifiedContent = modifiedContent.replace("===", "!==");
      changes.push(`Flipped comparison: '===' → '!=='`);
    }
    
    // Chaos 3: Remove a closing bracket
    const closingBrackets = modifiedContent.match(/\}/g);
    if (closingBrackets && closingBrackets.length > 2) {
      // Find and remove one closing bracket (not the last one)
      let count = 0;
      const targetIndex = Math.floor(Math.random() * (closingBrackets.length - 1));
      modifiedContent = modifiedContent.replace(/\}/g, (match) => {
        if (count === targetIndex) {
          count++;
          changes.push(`Removed a closing bracket '}'`);
          return ""; // Remove this bracket
        }
        count++;
        return match;
      });
    }
    
    // Chaos 4: Change a function name slightly
    const funcMatch = modifiedContent.match(/function\s+(\w+)/);
    if (funcMatch) {
      const originalName = funcMatch[1];
      const brokenName = originalName + "_broken";
      // Only change the definition, not the calls - this breaks references
      modifiedContent = modifiedContent.replace(
        new RegExp(`function\\s+${originalName}`),
        `function ${brokenName}`
      );
      changes.push(`Renamed function: '${originalName}' → '${brokenName}'`);
    }
  }
  
  // If no changes were made, add a syntax error comment that breaks things
  if (changes.length === 0) {
    modifiedContent = `// CHAOS INTRODUCED - FIX ME!\n${modifiedContent}\n/* unclosed comment`;
    changes.push("Added unclosed comment block");
  }
  
  return { content: modifiedContent, changes };
}


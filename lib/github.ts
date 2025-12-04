const GITHUB_API_BASE = "https://api.github.com";

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
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


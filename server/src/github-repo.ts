export const OPENPOSTMAN_REPO_NAME = "openpostman";
export const GITHUB_OAUTH_SCOPES = "read:user gist repo";

const REPO_DESCRIPTION = "Private OpenPostman workspace for this GitHub account.";

function githubHeaders(token: string): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "User-Agent": "openpostman.dev",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function repoUrl(owner: string): string {
  return `https://api.github.com/repos/${encodeURIComponent(owner)}/${OPENPOSTMAN_REPO_NAME}`;
}

export function openpostmanHtmlUrl(owner: string): string {
  return `https://github.com/${owner}/${OPENPOSTMAN_REPO_NAME}`;
}

export function parseGitHubUsername(raw: string): string | null {
  const trimmed = raw.trim().replace(/^@/, "");
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/.test(trimmed)) {
    return null;
  }
  return trimmed;
}

export async function inviteOpenpostmanCollaborator(
  token: string,
  owner: string,
  username: string,
): Promise<{ alreadyCollaborator: boolean }> {
  const collaborator = parseGitHubUsername(username);
  if (!collaborator) {
    throw new Error("Enter a valid GitHub username");
  }
  if (collaborator.toLowerCase() === owner.toLowerCase()) {
    throw new Error("That account already owns the repository");
  }

  await ensureOpenpostmanRepo(token, owner);

  const res = await fetch(
    `${repoUrl(owner)}/collaborators/${encodeURIComponent(collaborator)}`,
    {
      method: "PUT",
      headers: {
        ...githubHeaders(token),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ permission: "push" }),
    },
  );

  if (res.status === 204) {
    return { alreadyCollaborator: true };
  }
  if (res.status === 201) {
    return { alreadyCollaborator: false };
  }

  const text = await res.text();
  throw new Error(`Failed to invite ${collaborator} (${res.status}): ${text}`);
}

export async function ensureOpenpostmanRepo(token: string, owner: string): Promise<void> {
  const existing = await fetch(repoUrl(owner), { headers: githubHeaders(token) });
  if (existing.ok) {
    return;
  }
  if (existing.status !== 404) {
    const text = await existing.text();
    throw new Error(`Failed to look up ${OPENPOSTMAN_REPO_NAME} repo (${existing.status}): ${text}`);
  }

  const createRes = await fetch("https://api.github.com/user/repos", {
    method: "POST",
    headers: {
      ...githubHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: OPENPOSTMAN_REPO_NAME,
      description: REPO_DESCRIPTION,
      private: true,
      auto_init: true,
      has_issues: false,
      has_projects: false,
      has_wiki: false,
    }),
  });

  if (createRes.ok || createRes.status === 422) {
    return;
  }

  const text = await createRes.text();
  throw new Error(`Failed to create ${OPENPOSTMAN_REPO_NAME} repo (${createRes.status}): ${text}`);
}

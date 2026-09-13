export type HeaderRow = {
  key: string;
  value: string;
  enabled: boolean;
};

export type BodyType = "none" | "json" | "raw";

export type RequestExtract = {
  source: "body" | "header";
  path: string;
  variable: string;
};

export type ApiRequest = {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: HeaderRow[];
  body: string;
  bodyType: BodyType;
  extracts: RequestExtract[];
};

export type WebsiteGroup = {
  id: string;
  name: string;
  website: string;
};

export type Collection = {
  id: string;
  name: string;
  groupId: string | null;
  requests: ApiRequest[];
};

export type Environment = {
  id: string;
  name: string;
  variables: Record<string, string>;
};

export type Project = {
  id: string;
  name: string;
  groups: WebsiteGroup[];
  collections: Collection[];
  environments: Environment[];
  activeEnvironmentId: string | null;
};

export type Workspace = {
  version: 1;
  projects: Project[];
  activeProjectId: string | null;
};

export type User = {
  login: string;
  avatar: string;
  name: string | null;
};

export type ProxyResponse = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  timeMs: number;
  sizeBytes: number;
};

export function createId(): string {
  return crypto.randomUUID();
}

export function emptyEnvironment(name = "Default"): Environment {
  return {
    id: createId(),
    name,
    variables: {},
  };
}

export function emptyRequest(name = "New Request"): ApiRequest {
  return {
    id: createId(),
    name,
    method: "GET",
    url: "https://httpbin.org/get",
    headers: [{ key: "", value: "", enabled: true }],
    body: "",
    bodyType: "none",
    extracts: [],
  };
}

export function emptyGroup(name = "Website", website = ""): WebsiteGroup {
  return {
    id: createId(),
    name,
    website,
  };
}

export function emptyCollection(
  name = "My Collection",
  groupId: string | null = null,
): Collection {
  return {
    id: createId(),
    name,
    groupId,
    requests: [emptyRequest()],
  };
}

export function emptyProject(name = "My Project"): Project {
  return {
    id: createId(),
    name,
    groups: [],
    collections: [],
    environments: [],
    activeEnvironmentId: null,
  };
}

export function emptyWorkspace(): Workspace {
  const group = emptyGroup("Example site", "https://httpbin.org");
  const project: Project = {
    id: createId(),
    name: "My Project",
    groups: [group],
    collections: [emptyCollection("My Collection", group.id)],
    environments: [],
    activeEnvironmentId: null,
  };
  return {
    version: 1,
    projects: [project],
    activeProjectId: project.id,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeExtract(value: unknown): RequestExtract | null {
  if (!isRecord(value)) return null;
  if (value.source !== "body" && value.source !== "header") return null;
  if (typeof value.path !== "string" || typeof value.variable !== "string") return null;
  return { source: value.source, path: value.path, variable: value.variable };
}

function normalizeRequest(value: unknown): ApiRequest {
  if (!isRecord(value)) return emptyRequest();
  const bodyType =
    value.bodyType === "json" || value.bodyType === "raw" || value.bodyType === "none"
      ? value.bodyType
      : "none";
  const headers = Array.isArray(value.headers)
    ? (value.headers as HeaderRow[])
    : [{ key: "", value: "", enabled: true }];
  const extracts = Array.isArray(value.extracts)
    ? value.extracts.map(normalizeExtract).filter((e): e is RequestExtract => e !== null)
    : [];
  return {
    id: typeof value.id === "string" ? value.id : createId(),
    name: typeof value.name === "string" ? value.name : "New Request",
    method: typeof value.method === "string" ? value.method : "GET",
    url: typeof value.url === "string" ? value.url : "",
    headers,
    body: typeof value.body === "string" ? value.body : "",
    bodyType,
    extracts,
  };
}

function normalizeCollection(c: Record<string, unknown>): Collection {
  return {
    id: typeof c.id === "string" ? c.id : createId(),
    name: typeof c.name === "string" ? c.name : "Collection",
    groupId: typeof c.groupId === "string" ? c.groupId : null,
    requests: Array.isArray(c.requests) ? c.requests.map(normalizeRequest) : [],
  };
}

function normalizeEnvironment(value: unknown): Environment {
  if (!isRecord(value)) return emptyEnvironment();
  const variables =
    isRecord(value.variables)
      ? Object.fromEntries(
          Object.entries(value.variables).filter(
            (entry): entry is [string, string] => typeof entry[1] === "string",
          ),
        )
      : {};
  return {
    id: typeof value.id === "string" ? value.id : createId(),
    name: typeof value.name === "string" ? value.name : "Environment",
    variables,
  };
}

function normalizeGroup(g: Record<string, unknown>): WebsiteGroup {
  return {
    id: typeof g.id === "string" ? g.id : createId(),
    name: typeof g.name === "string" ? g.name : "Website",
    website: typeof g.website === "string" ? g.website : "",
  };
}

function copyEnvironments(value: unknown): Environment[] {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeEnvironment);
}

function pickActiveEnvironmentId(
  environments: Environment[],
  candidate: unknown,
): string | null {
  if (typeof candidate === "string" && environments.some((env) => env.id === candidate)) {
    return candidate;
  }
  return environments[0]?.id ?? null;
}

function normalizeProject(
  p: Record<string, unknown>,
  inherited: { environments: Environment[]; activeEnvironmentId: string | null },
): Project {
  const ownEnvironments = Array.isArray(p.environments)
    ? p.environments.map(normalizeEnvironment)
    : null;
  const environments =
    ownEnvironments && ownEnvironments.length > 0
      ? ownEnvironments
      : inherited.environments.map((env) => ({
          ...env,
          variables: { ...env.variables },
        }));
  const activeEnvironmentId = pickActiveEnvironmentId(
    environments,
    ownEnvironments && ownEnvironments.length > 0
      ? p.activeEnvironmentId
      : inherited.activeEnvironmentId,
  );
  return {
    id: typeof p.id === "string" ? p.id : createId(),
    name: typeof p.name === "string" ? p.name : "Project",
    groups: Array.isArray(p.groups)
      ? p.groups.filter(isRecord).map(normalizeGroup)
      : [],
    collections: Array.isArray(p.collections)
      ? p.collections.filter(isRecord).map(normalizeCollection)
      : [],
    environments,
    activeEnvironmentId,
  };
}

/** Normalize older workspaces (flat groups/collections) into projects. */
export function normalizeWorkspace(value: unknown): Workspace | null {
  if (!isRecord(value) || value.version !== 1) return null;

  const inheritedEnvironments = copyEnvironments(value.environments);
  const inheritedActiveId = pickActiveEnvironmentId(
    inheritedEnvironments,
    value.activeEnvironmentId,
  );
  const inherited = {
    environments: inheritedEnvironments,
    activeEnvironmentId: inheritedActiveId,
  };

  if (Array.isArray(value.projects) && value.projects.length > 0) {
    const projects = value.projects.filter(isRecord).map((p) => normalizeProject(p, inherited));
    const activeProjectId =
      typeof value.activeProjectId === "string" &&
      projects.some((p) => p.id === value.activeProjectId)
        ? value.activeProjectId
        : (projects[0]?.id ?? null);
    return {
      version: 1,
      projects,
      activeProjectId,
    };
  }

  // Legacy flat workspace → one default project
  if (!Array.isArray(value.collections)) return null;

  const groups = Array.isArray(value.groups)
    ? value.groups.filter(isRecord).map(normalizeGroup)
    : [];
  const collections = value.collections.filter(isRecord).map(normalizeCollection);
  const project: Project = {
    id: createId(),
    name: "My Project",
    groups,
    collections,
    environments: inherited.environments,
    activeEnvironmentId: inherited.activeEnvironmentId,
  };

  return {
    version: 1,
    projects: [project],
    activeProjectId: project.id,
  };
}

export function getActiveProject(workspace: Workspace): Project | null {
  return (
    workspace.projects.find((project) => project.id === workspace.activeProjectId) ??
    workspace.projects[0] ??
    null
  );
}

export function getActiveEnvironment(workspace: Workspace): Environment | null {
  const project = getActiveProject(workspace);
  if (!project) return null;
  return (
    project.environments.find((env) => env.id === project.activeEnvironmentId) ??
    project.environments[0] ??
    null
  );
}

export function ensureActiveEnvironment(workspace: Workspace): Workspace {
  const project = getActiveProject(workspace);
  if (!project) return workspace;
  if (project.environments.length > 0 && project.activeEnvironmentId) {
    const exists = project.environments.some((env) => env.id === project.activeEnvironmentId);
    if (exists) return workspace;
    return withActiveProject(workspace, (active) => ({
      ...active,
      activeEnvironmentId: active.environments[0]!.id,
    }));
  }
  if (project.environments.length > 0) {
    return withActiveProject(workspace, (active) => ({
      ...active,
      activeEnvironmentId: active.environments[0]!.id,
    }));
  }
  const env = emptyEnvironment();
  return withActiveProject(workspace, (active) => ({
    ...active,
    environments: [env],
    activeEnvironmentId: env.id,
  }));
}

export function patchActiveEnvironment(
  workspace: Workspace,
  updater: (env: Environment) => Environment,
): Workspace {
  const ensured = ensureActiveEnvironment(workspace);
  const project = getActiveProject(ensured);
  const envId = project?.activeEnvironmentId;
  if (!project || !envId) return ensured;
  return withActiveProject(ensured, (active) => ({
    ...active,
    environments: active.environments.map((env) => (env.id === envId ? updater(env) : env)),
  }));
}

export function withActiveProject(
  workspace: Workspace,
  updater: (project: Project) => Project,
): Workspace {
  const active = getActiveProject(workspace);
  if (!active) return workspace;
  const next = updater(active);
  return {
    ...workspace,
    activeProjectId: next.id,
    projects: workspace.projects.map((project) =>
      project.id === active.id ? next : project,
    ),
  };
}

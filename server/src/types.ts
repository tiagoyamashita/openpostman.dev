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

export const GIST_DESCRIPTION = "openpostman.dev-workspace";
export const GIST_FILENAME = "openpostman.dev-workspace.json";
/** Gist naming used before the project was renamed; still read and migrated on save. */
export const LEGACY_GIST_DESCRIPTION = "openputman-workspace";
export const LEGACY_GIST_FILENAME = "openputman-workspace.json";
export const PRIOR_GIST_DESCRIPTION = "openpostman-workspace";
export const PRIOR_GIST_FILENAME = "openpostman-workspace.json";

function createId(): string {
  return crypto.randomUUID();
}

export function emptyWorkspace(): Workspace {
  const groupId = createId();
  const projectId = createId();
  return {
    version: 1,
    projects: [
      {
        id: projectId,
        name: "My Project",
        groups: [
          {
            id: groupId,
            name: "Example site",
            website: "https://httpbin.org",
          },
        ],
        collections: [
          {
            id: createId(),
            name: "My Collection",
            groupId,
            requests: [
              {
                id: createId(),
                name: "New Request",
                method: "GET",
                url: "https://httpbin.org/get",
                headers: [{ key: "", value: "", enabled: true }],
                body: "",
                bodyType: "none",
                extracts: [],
              },
            ],
          },
        ],
        environments: [],
        activeEnvironmentId: null,
      },
    ],
    activeProjectId: projectId,
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
  if (!isRecord(value)) {
    return {
      id: createId(),
      name: "New Request",
      method: "GET",
      url: "https://httpbin.org/get",
      headers: [{ key: "", value: "", enabled: true }],
      body: "",
      bodyType: "none",
      extracts: [],
    };
  }
  const bodyType =
    value.bodyType === "json" || value.bodyType === "raw" || value.bodyType === "none"
      ? value.bodyType
      : "none";
  const extracts = Array.isArray(value.extracts)
    ? value.extracts.map(normalizeExtract).filter((e): e is RequestExtract => e !== null)
    : [];
  return {
    id: typeof value.id === "string" ? value.id : createId(),
    name: typeof value.name === "string" ? value.name : "New Request",
    method: typeof value.method === "string" ? value.method : "GET",
    url: typeof value.url === "string" ? value.url : "",
    headers: Array.isArray(value.headers)
      ? (value.headers as HeaderRow[])
      : [{ key: "", value: "", enabled: true }],
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

function normalizeGroup(g: Record<string, unknown>): WebsiteGroup {
  return {
    id: typeof g.id === "string" ? g.id : createId(),
    name: typeof g.name === "string" ? g.name : "Website",
    website: typeof g.website === "string" ? g.website : "",
  };
}

function normalizeEnvironment(value: unknown): Environment {
  if (!isRecord(value)) {
    return { id: createId(), name: "Default", variables: {} };
  }
  const variables = isRecord(value.variables)
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

function normalizeProject(
  p: Record<string, unknown>,
  inherited: Environment[],
  inheritedActiveId: string | null,
): Project {
  const own = Array.isArray(p.environments) ? p.environments.map(normalizeEnvironment) : [];
  const environments = own.length > 0 ? own : inherited.map((env) => ({ ...env, variables: { ...env.variables } }));
  const activeCandidate = own.length > 0 ? p.activeEnvironmentId : inheritedActiveId;
  const activeEnvironmentId =
    typeof activeCandidate === "string" && environments.some((env) => env.id === activeCandidate)
      ? activeCandidate
      : (environments[0]?.id ?? null);
  return {
    id: typeof p.id === "string" ? p.id : createId(),
    name: typeof p.name === "string" ? p.name : "Project",
    groups: Array.isArray(p.groups) ? p.groups.filter(isRecord).map(normalizeGroup) : [],
    collections: Array.isArray(p.collections)
      ? p.collections.filter(isRecord).map(normalizeCollection)
      : [],
    environments,
    activeEnvironmentId,
  };
}

export function normalizeWorkspace(value: unknown): Workspace | null {
  if (!isRecord(value) || value.version !== 1) return null;

  const inherited = Array.isArray(value.environments)
    ? value.environments.map(normalizeEnvironment)
    : [];
  const inheritedActiveId =
    typeof value.activeEnvironmentId === "string" ? value.activeEnvironmentId : null;

  if (Array.isArray(value.projects) && value.projects.length > 0) {
    const projects = value.projects
      .filter(isRecord)
      .map((p) => normalizeProject(p, inherited, inheritedActiveId));
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
    environments: inherited,
    activeEnvironmentId:
      inheritedActiveId && inherited.some((env) => env.id === inheritedActiveId)
        ? inheritedActiveId
        : (inherited[0]?.id ?? null),
  };

  return {
    version: 1,
    projects: [project],
    activeProjectId: project.id,
  };
}

export function isWorkspace(value: unknown): value is Workspace {
  return normalizeWorkspace(value) !== null;
}

import { describe, expect, it } from "vitest";
import {
  emptyWorkspace,
  ensureActiveEnvironment,
  getActiveProject,
  normalizeWorkspace,
} from "../src/types";

describe("emptyWorkspace", () => {
  it("starts with one project, one site, and one request", () => {
    const workspace = emptyWorkspace();
    const project = getActiveProject(workspace);
    expect(project?.name).toBe("My Project");
    expect(project?.groups).toHaveLength(1);
    expect(project?.collections).toHaveLength(1);
    expect(project?.collections[0]?.requests[0]?.url).toContain("httpbin.org");
  });
});

describe("normalizeWorkspace", () => {
  it("rejects payloads that are not version 1 objects", () => {
    expect(normalizeWorkspace(null)).toBeNull();
    expect(normalizeWorkspace({ version: 2, projects: [] })).toBeNull();
  });

  it("lifts a legacy flat collections list into a project", () => {
    const workspace = normalizeWorkspace({
      version: 1,
      collections: [
        {
          id: "c1",
          name: "Legacy",
          requests: [
            {
              id: "r1",
              name: "Ping",
              method: "GET",
              url: "https://example.com",
              headers: [],
              body: "",
              bodyType: "none",
            },
          ],
        },
      ],
      environments: [{ id: "e1", name: "Dev", variables: { host: "https://dev" } }],
      activeEnvironmentId: "e1",
    });
    expect(workspace?.projects).toHaveLength(1);
    expect(workspace?.projects[0]?.collections[0]?.name).toBe("Legacy");
    expect(workspace?.projects[0]?.environments[0]?.variables.host).toBe("https://dev");
  });

  it("keeps environments on each project instead of the workspace", () => {
    const workspace = normalizeWorkspace({
      version: 1,
      projects: [
        {
          id: "p1",
          name: "One",
          groups: [],
          collections: [],
          environments: [{ id: "e1", name: "Dev", variables: { host: "a" } }],
          activeEnvironmentId: "e1",
        },
        {
          id: "p2",
          name: "Two",
          groups: [],
          collections: [],
          environments: [{ id: "e2", name: "Prod", variables: { host: "b" } }],
          activeEnvironmentId: "e2",
        },
      ],
      activeProjectId: "p2",
    });
    expect(workspace?.projects[0]?.environments[0]?.variables.host).toBe("a");
    expect(workspace?.projects[1]?.environments[0]?.variables.host).toBe("b");
    expect(workspace && "environments" in workspace).toBe(false);
    expect((workspace as { environments?: unknown }).environments).toBeUndefined();
  });
});

describe("ensureActiveEnvironment", () => {
  it("creates a default environment on the active project when none exist", () => {
    const workspace = emptyWorkspace();
    expect(getActiveProject(workspace)?.environments).toHaveLength(0);
    const next = ensureActiveEnvironment(workspace);
    const project = getActiveProject(next);
    expect(project?.environments).toHaveLength(1);
    expect(project?.activeEnvironmentId).toBe(project?.environments[0]?.id);
  });
});

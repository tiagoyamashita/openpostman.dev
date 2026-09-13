import { describe, expect, it } from "vitest";
import {
  applyExportToWorkspace,
  buildExport,
  EXPORT_FORMAT,
  parseOpenPostmanExport,
} from "../src/exportFormat";
import { emptyWorkspace } from "../src/types";

describe("buildExport / parseOpenPostmanExport", () => {
  it("round-trips a workspace export", () => {
    const workspace = emptyWorkspace();
    const payload = buildExport("workspace", workspace, null, null);
    expect(payload.format).toBe(EXPORT_FORMAT);
    expect(payload.kind).toBe("workspace");
    const parsed = parseOpenPostmanExport(JSON.stringify(payload));
    expect(parsed.workspace?.projects[0]?.name).toBe("My Project");
  });

  it("exports only the current project and its environments", () => {
    const workspace = emptyWorkspace();
    const other = {
      ...workspace.projects[0]!,
      id: "p-other",
      name: "Other Project",
      environments: [{ id: "e-other", name: "Other", variables: { host: "other" } }],
      activeEnvironmentId: "e-other",
    };
    workspace.projects.push(other);
    const active = workspace.projects[0]!;
    active.environments = [{ id: "e-active", name: "Dev", variables: { token: "abc" } }];
    active.activeEnvironmentId = "e-active";
    workspace.activeProjectId = active.id;

    const payload = buildExport("workspace", workspace, null, null);
    expect(payload.workspace?.projects).toHaveLength(1);
    expect(payload.workspace?.projects[0]?.name).toBe("My Project");
    expect(payload.workspace?.projects[0]?.environments[0]?.variables.token).toBe("abc");
  });

  it("still loads exports written before the rename", () => {
    const workspace = emptyWorkspace();
    const parsed = parseOpenPostmanExport(
      JSON.stringify({
        format: "openputman",
        version: 1,
        kind: "workspace",
        exportedAt: "2026-01-01T00:00:00.000Z",
        workspace,
      }),
    );
    expect(parsed.format).toBe(EXPORT_FORMAT);
    expect(parsed.workspace?.projects).toHaveLength(1);
  });

  it("rejects empty or unknown files", () => {
    expect(() => parseOpenPostmanExport("")).toThrow(/empty/i);
    expect(() => parseOpenPostmanExport("{}")).toThrow(/Not an OpenPostman export/);
  });
});

describe("applyExportToWorkspace", () => {
  it("merges a collection without clobbering the current project", () => {
    const current = emptyWorkspace();
    const incoming = emptyWorkspace();
    incoming.projects[0]!.collections[0]!.name = "Imported";
    const payload = buildExport(
      "collection",
      incoming,
      incoming.projects[0]!.collections[0]!.id,
      null,
    );
    const result = applyExportToWorkspace(
      current,
      payload,
      current.projects[0]!.collections[0]!.id,
    );
    const names = result.workspace.projects[0]!.collections.map((c) => c.name);
    expect(names).toContain("My Collection");
    expect(names).toContain("Imported");
    expect(result.collectionId).toBeTruthy();
    expect(result.collectionId).not.toBe(incoming.projects[0]!.collections[0]!.id);
  });

  it("appends an imported request onto the active collection", () => {
    const current = emptyWorkspace();
    const collection = current.projects[0]!.collections[0]!;
    const payload = buildExport("request", current, collection.id, collection.requests[0]!.id);
    const result = applyExportToWorkspace(current, payload, collection.id);
    expect(result.workspace.projects[0]!.collections[0]!.requests.length).toBe(2);
  });

  it("imports an exported project alongside the current one, including env vars", () => {
    const current = emptyWorkspace();
    current.projects[0]!.name = "Keep me";
    const incoming = emptyWorkspace();
    incoming.projects[0]!.name = "Imported API";
    incoming.projects[0]!.environments = [
      { id: "e1", name: "Staging", variables: { base: "https://stg.example" } },
    ];
    incoming.projects[0]!.activeEnvironmentId = "e1";
    const payload = buildExport("workspace", incoming, null, null);
    const result = applyExportToWorkspace(current, payload, null);
    const names = result.workspace.projects.map((p) => p.name);
    expect(names).toContain("Keep me");
    expect(names).toContain("Imported API");
    const imported = result.workspace.projects.find((p) => p.name === "Imported API");
    expect(imported?.environments[0]?.variables.base).toBe("https://stg.example");
  });
});

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
});

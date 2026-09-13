import { beforeEach, describe, expect, it } from "vitest";
import { emptyWorkspace } from "../src/types";
import { loadLocalWorkspace, saveLocalWorkspace } from "../src/storage";

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear() {
      data.clear();
    },
    getItem(key: string) {
      return data.has(key) ? data.get(key)! : null;
    },
    key(index: number) {
      return [...data.keys()][index] ?? null;
    },
    removeItem(key: string) {
      data.delete(key);
    },
    setItem(key: string, value: string) {
      data.set(key, value);
    },
  };
}

describe("local workspace storage", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: memoryStorage(),
    });
  });

  it("round-trips a workspace under the current key", () => {
    const workspace = emptyWorkspace();
    workspace.projects[0]!.name = "Saved Project";
    saveLocalWorkspace(workspace);
    expect(loadLocalWorkspace().projects[0]?.name).toBe("Saved Project");
  });

  it("reads a legacy openputman key and drops it on save", () => {
    localStorage.setItem(
      "openputman-workspace",
      JSON.stringify({
        version: 1,
        projects: [
          { id: "p1", name: "Legacy Project", groups: [], collections: [] },
        ],
        activeProjectId: "p1",
        environments: [],
        activeEnvironmentId: null,
      }),
    );
    expect(loadLocalWorkspace().projects[0]?.name).toBe("Legacy Project");
    saveLocalWorkspace(loadLocalWorkspace());
    expect(localStorage.getItem("openputman-workspace")).toBeNull();
    expect(localStorage.getItem("openpostman.dev-workspace")).toBeTruthy();
  });

  it("returns an empty workspace when storage is junk", () => {
    localStorage.setItem("openpostman.dev-workspace", "not-json");
    expect(loadLocalWorkspace().projects[0]?.name).toBe("My Project");
  });
});

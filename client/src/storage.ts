import { emptyWorkspace, normalizeWorkspace, type Workspace } from "./types";
import { safeJsonParse } from "./json";

const STORAGE_KEY = "openpostman.dev-workspace";
const LEGACY_STORAGE_KEYS = ["openpostman-workspace", "openputman-workspace"];

export function loadLocalWorkspace(): Workspace {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw?.trim()) {
      for (const key of LEGACY_STORAGE_KEYS) {
        raw = localStorage.getItem(key);
        if (raw?.trim()) break;
      }
    }
    if (!raw?.trim()) return emptyWorkspace();
    const parsed = safeJsonParse(raw);
    return normalizeWorkspace(parsed) ?? emptyWorkspace();
  } catch {
    return emptyWorkspace();
  }
}

export function saveLocalWorkspace(workspace: Workspace): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
  for (const key of LEGACY_STORAGE_KEYS) {
    localStorage.removeItem(key);
  }
}

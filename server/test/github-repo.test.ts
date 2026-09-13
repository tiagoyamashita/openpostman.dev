import { afterEach, describe, expect, it, vi } from "vitest";
import { ensureOpenpostmanRepo } from "../src/github-repo.js";

const owner = "octocat";
const token = "gho_test";

function jsonResponse(status: number, body: unknown = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("ensureOpenpostmanRepo", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does nothing when the repo already exists", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(200, { name: "openpostman" }));

    await ensureOpenpostmanRepo(token, owner);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(String(fetchMock.mock.calls[0]![0])).toBe("https://api.github.com/repos/octocat/openpostman");
    expect((fetchMock.mock.calls[0]![1] as RequestInit).method ?? "GET").toBe("GET");
  });

  it("creates a private repo when GitHub returns 404", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse(404, { message: "Not Found" }))
      .mockResolvedValueOnce(jsonResponse(201, { name: "openpostman" }));

    await ensureOpenpostmanRepo(token, owner);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [url, init] = fetchMock.mock.calls[1]!;
    expect(String(url)).toBe("https://api.github.com/user/repos");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toMatchObject({
      name: "openpostman",
      private: true,
      auto_init: true,
    });
  });

  it("treats create 422 as already existing", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse(404, { message: "Not Found" }))
      .mockResolvedValueOnce(jsonResponse(422, { message: "Repository creation failed." }));

    await expect(ensureOpenpostmanRepo(token, owner)).resolves.toBeUndefined();
  });

  it("throws when lookup fails with an unexpected status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(500, { message: "boom" }));

    await expect(ensureOpenpostmanRepo(token, owner)).rejects.toThrow(/Failed to look up openpostman repo \(500\)/);
  });
});

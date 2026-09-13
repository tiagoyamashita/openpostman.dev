import { beforeAll, describe, expect, it, vi } from "vitest";
import request from "supertest";
import type { Express } from "express";

process.env.VERCEL = "1";
process.env.SESSION_SECRET = "test-session-secret-not-for-production";
process.env.GITHUB_CLIENT_ID = "test-client-id";
process.env.GITHUB_CLIENT_SECRET = "test-client-secret";
process.env.CLIENT_ORIGIN = "http://localhost:5173";
process.env.GITHUB_CALLBACK_URL = "http://localhost:4000/auth/github/callback";

describe("Express app", () => {
  let app: Express;

  beforeAll(async () => {
    ({ default: app } = await import("../src/index.js"));
  });

  it("reports health", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, name: "OpenPostman" });
  });

  it("rejects unauthenticated workspace access", async () => {
    const res = await request(app).get("/api/workspace");
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Unauthorized/i);
  });

  it("starts GitHub OAuth", async () => {
    const res = await request(app).get("/auth/github");
    expect(res.status).toBe(302);
    const location = res.headers.location ?? "";
    expect(location).toContain("https://github.com/login/oauth/authorize");
    expect(location).toContain("client_id=test-client-id");
    expect(location).toContain("scope=read%3Auser+gist+repo");
  });

  it("requires a url on the proxy", async () => {
    const res = await request(app).post("/api/proxy").send({ method: "GET" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/url is required/i);
  });

  it("does not proxy localhost", async () => {
    const res = await request(app)
      .post("/api/proxy")
      .send({ method: "GET", url: "http://localhost:8080/admin" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/blocked/i);
  });

  it("forwards a safe request and returns status, timing, and body", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 201,
        statusText: "Created",
        headers: { "content-type": "application/json", "x-test": "yes" },
      }),
    );

    const res = await request(app).post("/api/proxy").send({
      method: "POST",
      url: "http://8.8.8.8/echo",
      headers: { Authorization: "Bearer t", Host: "evil.example" },
      body: '{"ping":true}',
    });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(201);
    expect(res.body.body).toBe('{"ok":true}');
    expect(res.body.headers["x-test"]).toBe("yes");
    expect(res.body.timeMs).toBeGreaterThanOrEqual(0);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe("http://8.8.8.8/echo");
    const headers = init?.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer t");
    expect(headers.get("Host")).toBeNull();
    expect(init?.body).toBe('{"ping":true}');
    fetchMock.mockRestore();
  });
});

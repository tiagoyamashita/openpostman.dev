import { Router } from "express";
import { assertSafeUrl } from "../ssrf.js";

const router = Router();

const MAX_BODY_BYTES = 2 * 1024 * 1024;
const PROXY_TIMEOUT_MS = 30_000;

type ProxyBody = {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: string | null;
};

router.post("/proxy", async (req, res) => {
  const started = Date.now();
  try {
    const payload = req.body as ProxyBody;
    const method = (payload.method ?? "GET").toUpperCase();
    if (!payload.url || typeof payload.url !== "string") {
      res.status(400).json({ error: "url is required" });
      return;
    }

    const url = await assertSafeUrl(payload.url);
    const headers = new Headers();
    if (payload.headers && typeof payload.headers === "object") {
      for (const [key, value] of Object.entries(payload.headers)) {
        if (!key || value == null) continue;
        const lower = key.toLowerCase();
        if (lower === "host" || lower === "content-length") continue;
        headers.set(key, String(value));
      }
    }

    const hasBody = payload.body != null && payload.body !== "" && method !== "GET" && method !== "HEAD";
    if (hasBody && typeof payload.body === "string" && Buffer.byteLength(payload.body) > MAX_BODY_BYTES) {
      res.status(413).json({ error: "Request body too large" });
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);

    let upstream: Response;
    try {
      upstream = await fetch(url, {
        method,
        headers,
        body: hasBody ? payload.body! : undefined,
        signal: controller.signal,
        redirect: "follow",
      });
    } finally {
      clearTimeout(timer);
    }

    const buffer = Buffer.from(await upstream.arrayBuffer());
    if (buffer.byteLength > MAX_BODY_BYTES) {
      res.status(502).json({ error: "Upstream response too large" });
      return;
    }

    const responseHeaders: Record<string, string> = {};
    upstream.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    const text = buffer.toString("utf8");
    res.json({
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
      body: text,
      timeMs: Date.now() - started,
      sizeBytes: buffer.byteLength,
    });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.name === "AbortError"
          ? "Upstream request timed out"
          : err.message
        : "Proxy request failed";
    res.status(400).json({
      error: message,
      timeMs: Date.now() - started,
    });
  }
});

export default router;

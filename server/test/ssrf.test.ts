import { describe, expect, it, vi } from "vitest";
import { assertSafeUrl, isPrivateOrLocal } from "../src/ssrf.js";

vi.mock("node:dns/promises", () => ({
  lookup: vi.fn(async (hostname: string) => {
    if (hostname === "evil.internal") {
      return [{ address: "10.0.0.8", family: 4 }];
    }
    return [{ address: "93.184.216.34", family: 4 }];
  }),
}));

describe("isPrivateOrLocal", () => {
  it("flags loopback, RFC1918, and link-local addresses", () => {
    expect(isPrivateOrLocal("127.0.0.1")).toBe(true);
    expect(isPrivateOrLocal("10.0.0.1")).toBe(true);
    expect(isPrivateOrLocal("192.168.1.1")).toBe(true);
    expect(isPrivateOrLocal("169.254.1.1")).toBe(true);
    expect(isPrivateOrLocal("::1")).toBe(true);
    expect(isPrivateOrLocal("8.8.8.8")).toBe(false);
  });
});

describe("assertSafeUrl", () => {
  it("allows public http(s) URLs", async () => {
    await expect(assertSafeUrl("https://example.com/path")).resolves.toBeInstanceOf(URL);
    await expect(assertSafeUrl("http://8.8.8.8/")).resolves.toBeInstanceOf(URL);
  });

  it("blocks local, metadata, and non-http schemes", async () => {
    await expect(assertSafeUrl("not a url")).rejects.toThrow(/Invalid URL/);
    await expect(assertSafeUrl("ftp://example.com")).rejects.toThrow(/http and https/);
    await expect(assertSafeUrl("http://localhost/secret")).rejects.toThrow(/blocked/);
    await expect(assertSafeUrl("http://foo.localhost/")).rejects.toThrow(/blocked/);
    await expect(assertSafeUrl("http://printer.local/")).rejects.toThrow(/blocked/);
    await expect(assertSafeUrl("http://metadata.google.internal/")).rejects.toThrow(/blocked/);
    await expect(assertSafeUrl("http://127.0.0.1/")).rejects.toThrow(/blocked/);
    await expect(assertSafeUrl("http://10.1.2.3/")).rejects.toThrow(/blocked/);
  });

  it("blocks hostnames that resolve to a private address", async () => {
    await expect(assertSafeUrl("https://evil.internal/")).rejects.toThrow(
      /private or local IPs/,
    );
  });
});

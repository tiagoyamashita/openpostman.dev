import net from "node:net";
import ipaddr from "ipaddr.js";

export function isPrivateOrLocal(ip: string): boolean {
  if (ip === "::1" || ip === "0.0.0.0") return true;
  try {
    const parsed = ipaddr.parse(ip);
    const range = parsed.range();
    return (
      range === "loopback" ||
      range === "private" ||
      range === "linkLocal" ||
      range === "uniqueLocal" ||
      range === "carrierGradeNat" ||
      range === "reserved" ||
      range === "unspecified"
    );
  } catch {
    return true;
  }
}

export async function assertSafeUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https URLs are allowed");
  }

  const hostname = url.hostname;
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname === "metadata.google.internal"
  ) {
    throw new Error("Requests to local or metadata hosts are blocked");
  }

  if (net.isIP(hostname)) {
    if (isPrivateOrLocal(hostname)) {
      throw new Error("Requests to private or local IP addresses are blocked");
    }
    return url;
  }

  const { lookup } = await import("node:dns/promises");
  const records = await lookup(hostname, { all: true });
  for (const record of records) {
    if (isPrivateOrLocal(record.address)) {
      throw new Error("Requests resolving to private or local IPs are blocked");
    }
  }

  return url;
}

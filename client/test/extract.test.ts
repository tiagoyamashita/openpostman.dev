import { describe, expect, it } from "vitest";
import {
  applyExtracts,
  extractFromResponse,
  getByPath,
  isSuccessStatus,
  valueToString,
} from "../src/extract";
import type { ProxyResponse } from "../src/types";

const response: ProxyResponse = {
  status: 200,
  statusText: "OK",
  headers: { "X-Request-Id": "req-9", "content-type": "application/json" },
  body: JSON.stringify({ data: { token: "tok_1" }, items: [{ id: 7 }] }),
  timeMs: 12,
  sizeBytes: 40,
};

describe("getByPath / valueToString", () => {
  it("walks objects and array indexes", () => {
    const root = { items: [{ id: 7 }, { id: 8 }] };
    expect(getByPath(root, "items.1.id")).toBe(8);
    expect(getByPath(root, "items.9.id")).toBeUndefined();
    expect(valueToString(true)).toBe("true");
    expect(valueToString(null)).toBeNull();
  });
});

describe("extractFromResponse", () => {
  it("reads JSON body paths and headers case-insensitively", () => {
    expect(extractFromResponse(response, "body", "data.token")).toBe("tok_1");
    expect(extractFromResponse(response, "body", "items.0.id")).toBe("7");
    expect(extractFromResponse(response, "header", "x-request-id")).toBe("req-9");
    expect(extractFromResponse(response, "body", "missing")).toBeNull();
  });
});

describe("applyExtracts / isSuccessStatus", () => {
  it("writes successful extracts into a copy of the environment", () => {
    const result = applyExtracts(
      response,
      [
        { source: "body", path: "data.token", variable: "token" },
        { source: "header", path: "X-Request-Id", variable: "rid" },
        { source: "body", path: "nope", variable: "fail" },
      ],
      { token: "old" },
    );
    expect(result.vars).toEqual({ token: "tok_1", rid: "req-9" });
    expect(result.applied).toEqual(["token", "rid"]);
    expect(result.failed).toEqual(["fail"]);
  });

  it("treats 2xx and 3xx as success", () => {
    expect(isSuccessStatus(200)).toBe(true);
    expect(isSuccessStatus(302)).toBe(true);
    expect(isSuccessStatus(404)).toBe(false);
    expect(isSuccessStatus(500)).toBe(false);
  });
});

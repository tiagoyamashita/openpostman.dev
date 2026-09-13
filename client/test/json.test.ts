import { describe, expect, it } from "vitest";
import { formatJsonBody, safeJsonParse } from "../src/json";

describe("safeJsonParse", () => {
  it("returns undefined for empty input instead of throwing", () => {
    expect(safeJsonParse("")).toBeUndefined();
    expect(safeJsonParse("   ")).toBeUndefined();
  });

  it("returns undefined for invalid JSON", () => {
    expect(safeJsonParse("{not json")).toBeUndefined();
  });

  it("parses objects and arrays", () => {
    expect(safeJsonParse('{"a":1}')).toEqual({ a: 1 });
    expect(safeJsonParse("[1,2]")).toEqual([1, 2]);
  });
});

describe("formatJsonBody", () => {
  it("pretty-prints objects and leaves plain text alone", () => {
    expect(formatJsonBody('{"a":1}')).toBe('{\n  "a": 1\n}');
    expect(formatJsonBody("hello")).toBe("hello");
    expect(formatJsonBody("")).toBe("");
  });
});

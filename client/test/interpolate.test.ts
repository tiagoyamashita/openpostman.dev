import { describe, expect, it } from "vitest";
import { collectUnresolved, findUnresolved, interpolate } from "../src/interpolate";

describe("interpolate", () => {
  it("replaces named variables and leaves unknown tokens in place", () => {
    const vars = { base: "https://api.example.com", token: "abc" };
    expect(interpolate("{{base}}/v1?t={{token}}", vars)).toBe(
      "https://api.example.com/v1?t=abc",
    );
    expect(interpolate("{{ missing }} and {{base}}", vars)).toBe(
      "{{ missing }} and https://api.example.com",
    );
  });

  it("treats an empty string value as a real substitution", () => {
    expect(interpolate("x={{empty}}", { empty: "" })).toBe("x=");
  });
});

describe("findUnresolved / collectUnresolved", () => {
  it("lists unique missing names across several strings", () => {
    const vars = { a: "1" };
    expect(findUnresolved("{{a}} {{b}} {{b}}", vars)).toEqual(["b"]);
    expect(collectUnresolved(["{{a}}", "{{c}}/{{a}}"], vars)).toEqual(["c"]);
  });
});

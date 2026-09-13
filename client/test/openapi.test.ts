import { describe, expect, it } from "vitest";
import { parseOpenApiDocument } from "../src/openapi";

const openapi3 = JSON.stringify({
  openapi: "3.0.3",
  info: { title: "Pets" },
  servers: [{ url: "https://pets.example.com/v1" }],
  paths: {
    "/pets": {
      get: {
        summary: "List pets",
        parameters: [
          { in: "query", name: "limit", example: 10 },
          { in: "header", name: "X-Trace", example: "abc" },
        ],
      },
      post: {
        operationId: "createPet",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { name: { type: "string" } },
              },
            },
          },
        },
      },
    },
  },
});

const swagger2 = `
swagger: "2.0"
info:
  title: Legacy Pets
host: api.example.com
basePath: /v2
schemes:
  - https
paths:
  /echo:
    get:
      summary: Echo
`;

describe("parseOpenApiDocument", () => {
  it("builds one request per OpenAPI 3 operation", () => {
    const collection = parseOpenApiDocument(openapi3);
    expect(collection.name).toBe("Pets");
    expect(collection.requests).toHaveLength(2);
    const list = collection.requests.find((r) => r.method === "GET");
    const create = collection.requests.find((r) => r.method === "POST");
    expect(list?.name).toBe("List pets");
    expect(list?.url).toBe("https://pets.example.com/v1/pets?limit=10");
    expect(list?.headers.some((h) => h.key === "X-Trace" && h.value === "abc")).toBe(true);
    expect(create?.name).toBe("createPet");
    expect(create?.bodyType).toBe("json");
    expect(create?.body).toContain('"name"');
    expect(create?.headers.some((h) => h.key === "Content-Type")).toBe(true);
  });

  it("reads Swagger 2 YAML host and basePath", () => {
    const collection = parseOpenApiDocument(swagger2);
    expect(collection.name).toBe("Legacy Pets");
    expect(collection.requests[0]?.url).toBe("https://api.example.com/v2/echo");
  });

  it("rejects empty or unsupported documents", () => {
    expect(() => parseOpenApiDocument("")).toThrow(/empty/i);
    expect(() => parseOpenApiDocument('{"foo":1}')).toThrow(/Unsupported spec/);
    expect(() =>
      parseOpenApiDocument(JSON.stringify({ openapi: "3.0.0", info: {}, paths: {} })),
    ).toThrow(/No HTTP operations/);
  });
});

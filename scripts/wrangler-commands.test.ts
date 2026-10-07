import { describe, expect, it } from "vitest";
import {
  d1CreateArgs,
  d1InfoArgs,
  d1ListArgs,
  d1MigrateArgs,
  previewD1MigrateArgs,
} from "./wrangler-commands.ts";

describe("d1MigrateArgs", () => {
  it("migrates the production D1 from the source config, naming no environment", () => {
    expect(d1MigrateArgs()).toEqual([
      "wrangler",
      "d1",
      "migrations",
      "apply",
      "DB",
      "--remote",
      "--config",
      "wrangler.jsonc",
    ]);
  });
});

describe("previewD1MigrateArgs", () => {
  it("migrates a preview's D1 by name through its generated config", () => {
    expect(
      previewD1MigrateArgs("todo-preview-pr-42", "dist/server/wrangler.json"),
    ).toEqual([
      "wrangler",
      "d1",
      "migrations",
      "apply",
      "todo-preview-pr-42",
      "--remote",
      "--config",
      "dist/server/wrangler.json",
    ]);
  });
});

describe("d1ListArgs", () => {
  it("lists the account's D1 databases as JSON", () => {
    expect(d1ListArgs()).toEqual(["wrangler", "d1", "list", "--json"]);
  });
});

describe("d1InfoArgs", () => {
  it("describes one D1 database as JSON", () => {
    expect(d1InfoArgs("todo-preview-pr-42")).toEqual([
      "wrangler",
      "d1",
      "info",
      "todo-preview-pr-42",
      "--json",
    ]);
  });
});

describe("d1CreateArgs", () => {
  it("creates a D1 database without writing it into wrangler.jsonc", () => {
    expect(d1CreateArgs("todo-preview-pr-42")).toEqual([
      "wrangler",
      "d1",
      "create",
      "todo-preview-pr-42",
      "--update-config=false",
    ]);
  });
});

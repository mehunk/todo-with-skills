import { describe, expect, it } from "vitest";
import { d1MigrateArgs } from "./wrangler-commands.ts";

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

  it("migrates the preview D1 with --env preview", () => {
    expect(d1MigrateArgs("preview")).toEqual([
      "wrangler",
      "d1",
      "migrations",
      "apply",
      "DB",
      "--remote",
      "--env",
      "preview",
      "--config",
      "wrangler.jsonc",
    ]);
  });
});

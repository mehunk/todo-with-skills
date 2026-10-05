import { describe, expect, it } from "vitest";
import { productionUrlFrom } from "./production-url.ts";

// Lines shaped like the ND-JSON Wrangler writes to WRANGLER_OUTPUT_FILE_PATH
// during `wrangler deploy`.
const wranglerSession = JSON.stringify({
  version: 1,
  type: "wrangler-session",
  wrangler_version: "4.147.0",
});
const deploy = (targets: string[]) =>
  JSON.stringify({
    type: "deploy",
    version: 1,
    worker_name: "todo",
    version_id: "0b1d4c7e-0000-4000-8000-000000000000",
    targets,
  });

describe("productionUrlFrom", () => {
  it("returns the workers.dev URL from Wrangler's deploy entry", () => {
    const output = `${wranglerSession}\n${deploy(["https://todo.personal-d9e.workers.dev"])}\n`;

    expect(productionUrlFrom(output)).toBe(
      "https://todo.personal-d9e.workers.dev",
    );
  });

  it("picks the workers.dev target among routes and schedules", () => {
    const output = deploy([
      "example.com/*",
      "schedule: */5 * * * *",
      "todo.personal-d9e.workers.dev",
    ]);

    expect(productionUrlFrom(output)).toBe(
      "https://todo.personal-d9e.workers.dev",
    );
  });

  it("fails when the deploy has no workers.dev target", () => {
    expect(() => productionUrlFrom(deploy([]))).toThrow(/workers_dev/);
  });

  it("fails when Wrangler recorded no deploy", () => {
    expect(() => productionUrlFrom(wranglerSession)).toThrow(/no deploy entry/);
  });
});

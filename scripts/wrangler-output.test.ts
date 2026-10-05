import { describe, expect, it } from "vitest";
import { lastWranglerEntry } from "./wrangler-output.ts";

const line = (entry: Record<string, unknown>) => JSON.stringify(entry);

describe("lastWranglerEntry", () => {
  it("returns the last entry of the given type, skipping blank lines", () => {
    const output = [
      line({ type: "wrangler-session", version: 1 }),
      line({ type: "deploy", worker_name: "first" }),
      "",
      line({ type: "deploy", worker_name: "second" }),
      line({ type: "version-upload", worker_name: "other" }),
      "",
    ].join("\n");

    expect(lastWranglerEntry(output, "deploy")).toEqual({
      type: "deploy",
      worker_name: "second",
    });
  });

  it("returns undefined when no entry has the type", () => {
    expect(
      lastWranglerEntry(line({ type: "wrangler-session" }), "deploy"),
    ).toBeUndefined();
  });
});

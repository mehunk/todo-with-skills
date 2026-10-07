import { describe, expect, it } from "vitest";
import {
  OPEN_PR_LIST_LIMIT,
  openPrListArgs,
  openPrNumbers,
} from "./open-pull-requests.ts";

describe("openPrListArgs", () => {
  it("lists every open PR's number in one gh call", () => {
    expect(openPrListArgs()).toEqual([
      "pr",
      "list",
      "--state",
      "open",
      "--json",
      "number",
      "--limit",
      String(OPEN_PR_LIST_LIMIT),
    ]);
  });
});

describe("openPrNumbers", () => {
  it("reads the open PR numbers from gh's JSON output", () => {
    // Shaped like `gh pr list --state open --json number`.
    expect(openPrNumbers('[{"number":15},{"number":12},{"number":4}]')).toEqual(
      new Set([4, 12, 15]),
    );
  });

  it("reads no open PRs", () => {
    expect(openPrNumbers("[]")).toEqual(new Set());
  });

  it("rejects a listing that may have been cut off at the limit", () => {
    const full = JSON.stringify(
      Array.from({ length: OPEN_PR_LIST_LIMIT }, (_, i) => ({ number: i + 1 })),
    );
    expect(() => openPrNumbers(full)).toThrow(/may be incomplete/);
  });

  it.each([
    '{"number":4}',
    '[{"number":"4"}]',
    "[{}]",
  ])("rejects unexpected output %s", (output) => {
    expect(() => openPrNumbers(output)).toThrow(/Unexpected gh pr list output/);
  });
});

import { describe, expect, it } from "vitest";
import { parsePreviewAlias } from "./preview-alias.ts";

describe("parsePreviewAlias", () => {
  it.each(["pr-42", "fixes", "a", "spike-2"])("accepts %s", (alias) => {
    expect(parsePreviewAlias(alias)).toBe(alias);
  });

  it.each([
    "42",
    "-pr",
    "PR-42",
    "pr_42",
    "pr.42",
    "pr 42",
    "",
  ])("rejects %j", (alias) => {
    expect(() => parsePreviewAlias(alias)).toThrow(
      /lowercase letters, digits and dashes, starting with a letter/,
    );
  });

  it("rejects a missing alias with the usage line", () => {
    expect(() => parsePreviewAlias(undefined)).toThrow(
      "Usage: npm run preview:deploy -- <alias>   (e.g. pr-42)",
    );
  });

  it("names the given npm script in the usage line", () => {
    expect(() => parsePreviewAlias(undefined, "preview:teardown")).toThrow(
      "Usage: npm run preview:teardown -- <alias>   (e.g. pr-42)",
    );
  });
});

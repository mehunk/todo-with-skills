import { describe, expect, it } from "vitest";
import { previewAliasUrlFrom } from "./preview-url.ts";

// Lines shaped like the ND-JSON Wrangler writes to WRANGLER_OUTPUT_FILE_PATH.
const wranglerSession = JSON.stringify({
  version: 1,
  type: "wrangler-session",
  wrangler_version: "4.147.0",
});
const versionUpload = JSON.stringify({
  type: "version-upload",
  version: 1,
  worker_name: "todo-preview",
  version_id: "0b1d4c7e-0000-4000-8000-000000000000",
  preview_url: "https://0b1d4c7e-todo-preview.personal-d9e.workers.dev",
  preview_alias_url: "https://spike-todo-preview.personal-d9e.workers.dev",
});

describe("previewAliasUrlFrom", () => {
  it("returns the alias URL from Wrangler's version-upload entry", () => {
    expect(previewAliasUrlFrom(`${wranglerSession}\n${versionUpload}\n`)).toBe(
      "https://spike-todo-preview.personal-d9e.workers.dev",
    );
  });

  it("fails when Wrangler recorded no version upload", () => {
    expect(() => previewAliasUrlFrom(`${wranglerSession}\n`)).toThrow(
      /no version-upload/,
    );
  });

  it("fails when the upload has no alias URL (preview URLs disabled)", () => {
    const withoutAlias = JSON.stringify({
      type: "version-upload",
      version: 1,
      preview_url: null,
    });

    expect(() => previewAliasUrlFrom(withoutAlias)).toThrow(
      /no preview alias URL/,
    );
  });
});

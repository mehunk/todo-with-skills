import { lastWranglerEntry } from "./wrangler-output.ts";

/**
 * Reads the preview alias URL out of the ND-JSON file Wrangler writes to
 * WRANGLER_OUTPUT_FILE_PATH during `wrangler versions upload --preview-alias`.
 */
export function previewAliasUrlFrom(wranglerOutput: string): string {
  const upload = lastWranglerEntry(wranglerOutput, "version-upload");

  if (!upload) {
    throw new Error("Wrangler output has no version-upload entry");
  }
  if (typeof upload.preview_alias_url !== "string") {
    throw new Error(
      "Wrangler's version upload has no preview alias URL (are preview_urls enabled?)",
    );
  }
  return upload.preview_alias_url;
}

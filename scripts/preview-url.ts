/**
 * Reads the preview alias URL out of the ND-JSON file Wrangler writes to
 * WRANGLER_OUTPUT_FILE_PATH during `wrangler versions upload --preview-alias`.
 * Using that file instead of scraping the console output keeps the URL stable
 * across Wrangler's human-facing log changes.
 */
export function previewAliasUrlFrom(wranglerOutput: string): string {
  const upload = wranglerOutput
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => JSON.parse(line) as Record<string, unknown>)
    .filter((entry) => entry.type === "version-upload")
    .at(-1);

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

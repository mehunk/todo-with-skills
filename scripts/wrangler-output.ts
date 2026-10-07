/**
 * Wrangler writes one JSON object per line to WRANGLER_OUTPUT_FILE_PATH
 * (ND-JSON), each with a `type` ("wrangler-session", "deploy",
 * "version-upload", ...). Reading that file instead of scraping the console
 * output keeps the deploy scripts stable across Wrangler's log changes.
 */
export type WranglerEntry = Record<string, unknown>;

/** The last entry of `type` in Wrangler's ND-JSON output, if any. */
export function lastWranglerEntry(
  wranglerOutput: string,
  type: string,
): WranglerEntry | undefined {
  return wranglerOutput
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => JSON.parse(line) as WranglerEntry)
    .filter((entry) => entry.type === type)
    .at(-1);
}

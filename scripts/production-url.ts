/**
 * Reads the production workers.dev URL out of the ND-JSON file Wrangler writes
 * to WRANGLER_OUTPUT_FILE_PATH during `wrangler deploy`, so the smoke E2E runs
 * against the URL that was actually deployed.
 */
export function productionUrlFrom(wranglerOutput: string): string {
  const deploy = wranglerOutput
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => JSON.parse(line) as Record<string, unknown>)
    .filter((entry) => entry.type === "deploy")
    .at(-1);

  if (!deploy) {
    throw new Error("Wrangler output has no deploy entry");
  }
  const targets = Array.isArray(deploy.targets) ? deploy.targets : [];
  const workersDev = targets.find(
    (target): target is string =>
      typeof target === "string" && target.endsWith(".workers.dev"),
  );
  if (!workersDev) {
    throw new Error(
      "Wrangler's deploy has no workers.dev URL (is workers_dev enabled?)",
    );
  }
  return workersDev.startsWith("https://")
    ? workersDev
    : `https://${workersDev}`;
}

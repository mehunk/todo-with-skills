/**
 * Steps shared by `preview-deploy.ts` and `production-deploy.ts`. Every tool's
 * output goes to stderr so the scripts' stdout stays machine-readable (the
 * deployed URL is its only line). Pure helpers live in `wrangler-commands.ts`
 * and `wrangler-output.ts`, which the unit tests (run in workerd) can load.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * Runs `command`, streaming its stdout to stderr, with `env` as its whole
 * environment. Exits the script with the command's status if it fails, so a
 * failed step stops the release.
 */
export function run(command: string, args: string[], env: NodeJS.ProcessEnv) {
  console.error(`\n$ ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    stdio: ["inherit", process.stderr, "inherit"],
    env,
  });
  if (result.status !== 0) {
    console.error(`\n${command} ${args[0]} failed (exit ${result.status})`);
    process.exit(result.status ?? 1);
  }
}

/**
 * Calls `step` with a temporary WRANGLER_OUTPUT_FILE_PATH, then returns the
 * ND-JSON Wrangler wrote there. The temporary directory is always removed.
 */
export function captureWranglerOutput(
  step: (outputEnv: NodeJS.ProcessEnv) => void,
): string {
  const outputDir = mkdtempSync(path.join(tmpdir(), "wrangler-output-"));
  const outputFile = path.join(outputDir, "wrangler-output.ndjson");
  try {
    step({ WRANGLER_OUTPUT_FILE_PATH: outputFile });
    return readFileSync(outputFile, "utf8");
  } finally {
    rmSync(outputDir, { recursive: true, force: true });
  }
}

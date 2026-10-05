/**
 * Releases the app to the production `todo` Worker and prints its workers.dev
 * URL as the only line on stdout:
 *
 *   url=$(npm run -s production:deploy)
 *
 * Steps: build for the top-level (production) Wrangler environment, apply
 * migrations to the remote `todo` D1, then `wrangler deploy`. A failed step
 * stops the release, so a failed migration never ships new code. Nothing here
 * names the `preview` environment, so `todo-preview` is never touched.
 * All tool output goes to stderr so stdout stays machine-readable.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { productionUrlFrom } from "./production-url.ts";

// Production is the top level of wrangler.jsonc: never inherit an environment.
const env: NodeJS.ProcessEnv = { ...process.env };
delete env.CLOUDFLARE_ENV;
delete env.WRANGLER_ENV;

function run(command: string, args: string[], extra: NodeJS.ProcessEnv = {}) {
  console.error(`\n$ ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    stdio: ["inherit", process.stderr, "inherit"],
    env: { ...env, ...extra },
  });
  if (result.status !== 0) {
    console.error(`\n${command} ${args[0]} failed (exit ${result.status})`);
    process.exit(result.status ?? 1);
  }
}

// The build flattens the top-level config into dist/server/wrangler.json and
// points Wrangler at it (.wrangler/deploy/config.json) for the deploy below.
run("npx", ["vite", "build"]);

// Migrations read the source config explicitly: the built config does not
// carry migrations_dir.
run("npx", [
  "wrangler",
  "d1",
  "migrations",
  "apply",
  "DB",
  "--remote",
  "--config",
  "wrangler.jsonc",
]);

const outputDir = mkdtempSync(path.join(tmpdir(), "production-deploy-"));
const outputFile = path.join(outputDir, "wrangler-output.ndjson");
try {
  run("npx", ["wrangler", "deploy"], { WRANGLER_OUTPUT_FILE_PATH: outputFile });
  console.log(productionUrlFrom(readFileSync(outputFile, "utf8")));
} finally {
  rmSync(outputDir, { recursive: true, force: true });
}

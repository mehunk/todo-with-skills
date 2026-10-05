/**
 * Deploys the app to the `todo-preview` Worker under a preview alias
 * (ADR-0003) and prints the alias URL as the only line on stdout:
 *
 *   url=$(npm run -s preview:deploy -- pr-42)
 *
 * Steps: build for the `preview` Wrangler environment, build Storybook into
 * the static assets (served at /storybook/), apply migrations to the remote
 * `todo-preview` D1, then `wrangler versions upload --preview-alias`.
 * All tool output goes to stderr so stdout stays machine-readable.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { previewAliasUrlFrom } from "./preview-url.ts";

const alias = process.argv[2];
if (!alias) {
  console.error("Usage: npm run preview:deploy -- <alias>   (e.g. pr-42)");
  process.exit(1);
}

function run(command: string, args: string[], env: NodeJS.ProcessEnv = {}) {
  console.error(`\n$ ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    stdio: ["inherit", process.stderr, "inherit"],
    env: { ...process.env, ...env },
  });
  if (result.status !== 0) {
    console.error(`\n${command} ${args[0]} failed (exit ${result.status})`);
    process.exit(result.status ?? 1);
  }
}

// The build flattens the `preview` environment into dist/server/wrangler.json
// and points Wrangler at it (.wrangler/deploy/config.json), so the upload below
// targets `todo-preview` without --env.
run("npx", ["vite", "build"], { CLOUDFLARE_ENV: "preview" });

// Previews also ship Storybook: built into the app's static assets directory
// (dist/client, the built config's `assets.directory`) so the upload below
// serves it at <preview URL>/storybook/. Storybook emits relative asset paths,
// so the sub-path needs no base setting. Production deploys run `vite build`
// alone, which empties dist/, so they never carry it.
run("npx", [
  "storybook",
  "build",
  "--output-dir",
  "dist/client/storybook",
  "--quiet",
]);

// Migrations read the source config explicitly: the built config does not
// carry migrations_dir.
run("npx", [
  "wrangler",
  "d1",
  "migrations",
  "apply",
  "DB",
  "--remote",
  "--env",
  "preview",
  "--config",
  "wrangler.jsonc",
]);

const outputDir = mkdtempSync(path.join(tmpdir(), "preview-deploy-"));
const outputFile = path.join(outputDir, "wrangler-output.ndjson");
try {
  run(
    "npx",
    [
      "wrangler",
      "versions",
      "upload",
      "--preview-alias",
      alias,
      "--message",
      `Preview ${alias}`,
    ],
    { WRANGLER_OUTPUT_FILE_PATH: outputFile },
  );
  console.log(previewAliasUrlFrom(readFileSync(outputFile, "utf8")));
} finally {
  rmSync(outputDir, { recursive: true, force: true });
}

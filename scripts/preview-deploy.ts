/**
 * Deploys the app to the `todo-preview` Worker under a preview alias
 * (ADR-0003), bound to that alias's own D1 database (ADR-0004), and prints the
 * alias URL as the only line on stdout:
 *
 *   url=$(npm run -s preview:deploy -- pr-42)
 *
 * Steps: ensure the preview's D1 (`todo-preview-<alias>`) exists, creating it
 * on the first deploy; build for the `preview` Wrangler environment; build
 * Storybook into the static assets (served at /storybook/); bind the built
 * config's DB to the preview's D1; apply pending migrations to it; then
 * `wrangler versions upload --preview-alias`. A failed step stops the deploy,
 * so a failed migration never uploads. All tool output goes to stderr so
 * stdout stays machine-readable.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { captureWranglerOutput, run, runForOutput } from "./deploy-steps.ts";
import { parsePreviewAlias } from "./preview-alias.ts";
import {
  type D1Database,
  d1DatabaseFromInfo,
  findD1Database,
  previewDatabaseName,
  type WranglerConfig,
  withPreviewDatabase,
} from "./preview-database.ts";
import { previewAliasUrlFrom } from "./preview-url.ts";
import {
  d1CreateArgs,
  d1InfoArgs,
  d1ListArgs,
  previewD1MigrateArgs,
} from "./wrangler-commands.ts";

let alias: string;
try {
  alias = parsePreviewAlias(process.argv[2]);
} catch (error) {
  console.error((error as Error).message);
  process.exit(1);
}

const env = process.env;

// Idempotent: a re-run, a later push or a reopened PR reuses the database (and
// its data); only a missing one is created. Done before the build so a D1
// failure stops the deploy early.
function ensurePreviewDatabase(name: string): D1Database {
  const existing = findD1Database(runForOutput("npx", d1ListArgs(), env), name);
  if (existing) {
    console.error(`Reusing D1 database ${name} (${existing.id})`);
    return existing;
  }
  run("npx", d1CreateArgs(name), env);
  return d1DatabaseFromInfo(runForOutput("npx", d1InfoArgs(name), env));
}

const database = ensurePreviewDatabase(previewDatabaseName(alias));

// The build flattens the `preview` environment into dist/server/wrangler.json
// and points Wrangler at it (.wrangler/deploy/config.json), so the upload below
// targets `todo-preview` without --env.
run("npx", ["vite", "build"], { ...env, CLOUDFLARE_ENV: "preview" });

// Previews also ship Storybook: built into the app's static assets directory
// (dist/client, the built config's `assets.directory`) so the upload below
// serves it at <preview URL>/storybook/. Storybook emits relative asset paths,
// so the sub-path needs no base setting. Production deploys run `vite build`
// alone, which empties dist/, so they never carry it.
run(
  "npx",
  ["storybook", "build", "--output-dir", "dist/client/storybook", "--quiet"],
  env,
);

// The `preview` environment's DB binding is only a build template: rebind it
// to this preview's database in the built config, which both the migrations
// (via --config) and the upload (via the redirect above) then read.
const builtConfigPath = "dist/server/wrangler.json";
const template = JSON.parse(
  readFileSync(builtConfigPath, "utf8"),
) as WranglerConfig;
writeFileSync(
  builtConfigPath,
  JSON.stringify(withPreviewDatabase(template, database)),
);

run("npx", previewD1MigrateArgs(database.name, builtConfigPath), env);

const output = captureWranglerOutput((outputEnv) =>
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
    { ...env, ...outputEnv },
  ),
);
console.log(previewAliasUrlFrom(output));

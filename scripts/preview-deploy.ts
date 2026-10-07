/**
 * Deploys the app to the `todo-preview` Worker under a preview alias
 * (ADR-0003), bound to that alias's own D1 database (ADR-0004), and prints the
 * alias URL as the only line on stdout:
 *
 *   url=$(npm run -s preview:deploy -- pr-42)
 *
 * Steps: delete the D1 databases of PRs that are not open (looked up with
 * `gh`; skipped with a note when GitHub cannot be asked, e.g. locally without
 * auth); ensure the preview's D1 (`todo-preview-<alias>`) exists, creating it
 * on the first deploy, or fail naming the open previews if the account is at
 * its D1 limit; build for the `preview` Wrangler environment; build
 * Storybook into the static assets (served at /storybook/); bind the built
 * config's DB to the preview's D1; apply pending migrations to it; then
 * `wrangler versions upload --preview-alias`. A failed step stops the deploy,
 * so a failed migration never uploads. All tool output goes to stderr so
 * stdout stays machine-readable.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { captureWranglerOutput, run, runStep } from "./deploy-steps.ts";
import { openPrListArgs, openPrNumbers } from "./open-pull-requests.ts";
import { parsePreviewAlias, prNumberOfAlias } from "./preview-alias.ts";
import {
  type D1Database,
  d1DatabaseFromInfo,
  d1LimitMessage,
  findD1Database,
  isD1LimitError,
  notOpenPrDatabases,
  type PrPreviewDatabase,
  previewDatabaseName,
  prPreviewDatabases,
  type WranglerConfig,
  withPreviewDatabase,
} from "./preview-database.ts";
import { previewAliasUrlFrom } from "./preview-url.ts";
import {
  d1CreateArgs,
  d1DeleteArgs,
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

// The PR this deploy previews, when its alias is a PR's (`pr-<N>`).
const ownPr = prNumberOfAlias(alias);

// The open PR numbers, from one `gh` call, or undefined when GitHub cannot be
// asked (no gh, no `gh auth login` or GH_TOKEN, an API error). Never prompts.
// This deploy's own PR always counts as open, even if GitHub lags behind.
function openPullRequests(): ReadonlySet<number> | undefined {
  const listed = runStep(
    "gh",
    openPrListArgs(),
    { ...env, GH_PROMPT_DISABLED: "1" },
    { capture: "stdout", stdin: "ignore" },
  );
  if (!listed.ok) return undefined;
  try {
    const open = openPrNumbers(listed.output);
    if (ownPr !== undefined) open.add(ownPr);
    return open;
  } catch (error) {
    console.error((error as Error).message);
    return undefined;
  }
}

// The account's D1 slots are few (ADR-0004), so before ensuring its own
// database a deploy deletes the `todo-preview-pr-<N>` databases of PRs that
// are not open: closed ones (a missed or failed teardown) and numbers that
// are no PR at all (e.g. a hand-run `pr-9999`). It only runs once GitHub has
// said which PRs are open (`open`), so an unknown state never counts as not
// open; this deploy's own PR is in `open`. A failed delete is reported and
// skipped.
function deleteNotOpenPrDatabases(
  databases: PrPreviewDatabase[],
  open: ReadonlySet<number>,
) {
  const notOpen = notOpenPrDatabases(databases, open);
  if (notOpen.length === 0) {
    console.error("No preview databases of PRs that are not open to delete");
  }
  for (const database of notOpen) {
    if (runStep("npx", d1DeleteArgs(database.name), env).ok) {
      console.error(
        `Deleted D1 database ${database.name} (PR #${database.pr} is not open)`,
      );
    } else {
      console.error(
        `Could not delete D1 database ${database.name}; continuing`,
      );
    }
  }
}

// Idempotent: a re-run, a later push or a reopened PR reuses the database (and
// its data); only a missing one is created. Done before the build so a D1
// failure, the account's database limit included, stops the deploy early.
function ensurePreviewDatabase(name: string): D1Database {
  const listing = run("npx", d1ListArgs(), env, { capture: "stdout" });
  const prDatabases = prPreviewDatabases(listing);
  const open = openPullRequests();
  if (open) {
    deleteNotOpenPrDatabases(prDatabases, open);
  } else {
    console.error(
      "Skipping cleanup of preview databases of PRs that are not open: could not list open PRs with gh (needs GH_TOKEN or `gh auth login`)",
    );
  }
  const existing = findD1Database(listing, name);
  if (existing) {
    console.error(`Reusing D1 database ${name} (${existing.id})`);
    return existing;
  }
  const created = runStep("npx", d1CreateArgs(name), env, { capture: "all" });
  if (!created.ok) {
    if (isD1LimitError(created.output)) {
      console.error(`\n${d1LimitMessage(prDatabases, open)}`);
    }
    process.exit(created.exitCode);
  }
  return d1DatabaseFromInfo(
    run("npx", d1InfoArgs(name), env, { capture: "stdout" }),
  );
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

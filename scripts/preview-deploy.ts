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
import { captureWranglerOutput, run } from "./deploy-steps.ts";
import { parsePreviewAlias } from "./preview-alias.ts";
import { previewAliasUrlFrom } from "./preview-url.ts";
import { d1MigrateArgs } from "./wrangler-commands.ts";

let alias: string;
try {
  alias = parsePreviewAlias(process.argv[2]);
} catch (error) {
  console.error((error as Error).message);
  process.exit(1);
}

const env = process.env;

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

run("npx", d1MigrateArgs("preview"), env);

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

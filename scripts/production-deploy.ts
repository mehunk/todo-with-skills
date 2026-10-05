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
import { captureWranglerOutput, run } from "./deploy-steps.ts";
import { productionUrlFrom } from "./production-url.ts";
import { d1MigrateArgs } from "./wrangler-commands.ts";

// Production is the top level of wrangler.jsonc: never inherit an environment.
const productionEnv: NodeJS.ProcessEnv = { ...process.env };
delete productionEnv.CLOUDFLARE_ENV;
delete productionEnv.WRANGLER_ENV;

// The build flattens the top-level config into dist/server/wrangler.json and
// points Wrangler at it (.wrangler/deploy/config.json) for the deploy below.
run("npx", ["vite", "build"], productionEnv);

run("npx", d1MigrateArgs(), productionEnv);

const output = captureWranglerOutput((outputEnv) =>
  run("npx", ["wrangler", "deploy"], { ...productionEnv, ...outputEnv }),
);
console.log(productionUrlFrom(output));

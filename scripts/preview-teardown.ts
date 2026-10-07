/**
 * Deletes a preview alias's own D1 database, `todo-preview-<alias>`
 * (ADR-0004), freeing one of the account's limited database slots:
 *
 *   npm run -s preview:teardown -- pr-42
 *
 * Idempotent: a database that does not exist (already torn down, or a PR that
 * never deployed) counts as success. The alias's Worker version is left as is,
 * so its preview URL stops working once its database is gone. A later deploy
 * of the same alias creates a fresh database. Prints nothing on stdout; all
 * tool output goes to stderr.
 */
import { run } from "./deploy-steps.ts";
import { parsePreviewAlias } from "./preview-alias.ts";
import { findD1Database, previewDatabaseName } from "./preview-database.ts";
import { d1DeleteArgs, d1ListArgs } from "./wrangler-commands.ts";

let alias: string;
try {
  alias = parsePreviewAlias(process.argv[2], "preview:teardown");
} catch (error) {
  console.error((error as Error).message);
  process.exit(1);
}

const env = process.env;
const name = previewDatabaseName(alias);

if (
  findD1Database(run("npx", d1ListArgs(), env, { capture: "stdout" }), name)
) {
  run("npx", d1DeleteArgs(name), env);
  console.error(`Deleted D1 database ${name}`);
} else {
  console.error(`No D1 database ${name}: nothing to tear down`);
}

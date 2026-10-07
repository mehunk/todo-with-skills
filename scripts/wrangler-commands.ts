/**
 * `npx` args applying pending migrations to the remote D1 `database` (a
 * binding or database name) as configured in the config file `configPath`.
 */
function remoteD1MigrateArgs(database: string, configPath: string): string[] {
  return [
    "wrangler",
    "d1",
    "migrations",
    "apply",
    database,
    "--remote",
    "--config",
    configPath,
  ];
}

/**
 * `npx` args applying pending migrations to the production `todo` D1 (the
 * top-level config). They read the source config explicitly, so a leftover
 * built preview config is never used.
 */
export function d1MigrateArgs(): string[] {
  return remoteD1MigrateArgs("DB", "wrangler.jsonc");
}

/**
 * `npx` args applying pending migrations to a preview's own D1 (ADR-0004).
 * Remote migrations only target a database listed in a config file, so they
 * go through the generated per-preview config at `configPath`.
 */
export function previewD1MigrateArgs(
  databaseName: string,
  configPath: string,
): string[] {
  return remoteD1MigrateArgs(databaseName, configPath);
}

/** `npx` args listing the account's D1 databases as JSON on stdout. */
export function d1ListArgs(): string[] {
  return ["wrangler", "d1", "list", "--json"];
}

/** `npx` args printing one D1 database (with its id) as JSON on stdout. */
export function d1InfoArgs(databaseName: string): string[] {
  return ["wrangler", "d1", "info", databaseName, "--json"];
}

/**
 * `npx` args creating a D1 database. `d1 create` has no JSON output (read the
 * id back with `d1InfoArgs`), and run interactively it offers to add the
 * binding to wrangler.jsonc, which a preview database must never be.
 */
export function d1CreateArgs(databaseName: string): string[] {
  return ["wrangler", "d1", "create", databaseName, "--update-config=false"];
}

/**
 * `npx` args deleting a D1 database without the confirmation prompt, so it
 * runs unattended in CI. Wrangler fails for a missing database, so teardown
 * looks the database up first, and treats a missing one, or a delete failing
 * because it went missing meanwhile (`isD1NotFoundError`), as already gone.
 */
export function d1DeleteArgs(databaseName: string): string[] {
  return ["wrangler", "d1", "delete", databaseName, "--skip-confirmation"];
}

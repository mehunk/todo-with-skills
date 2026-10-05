/**
 * `npx` args applying pending migrations to the remote D1 of `wranglerEnv`
 * (the top-level, production, config when omitted). They read the source
 * config explicitly: the built config does not carry migrations_dir.
 */
export function d1MigrateArgs(wranglerEnv?: string): string[] {
  return [
    "wrangler",
    "d1",
    "migrations",
    "apply",
    "DB",
    "--remote",
    ...(wranglerEnv ? ["--env", wranglerEnv] : []),
    "--config",
    "wrangler.jsonc",
  ];
}

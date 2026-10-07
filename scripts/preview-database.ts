/**
 * Each preview alias gets its own D1 database (ADR-0004). These pure helpers
 * name it, find it in Wrangler's JSON output and bind it in the built config;
 * `preview-deploy.ts` runs the Wrangler commands around them.
 */

/** The D1 database of preview `alias`: `pr-42` gives `todo-preview-pr-42`. */
export function previewDatabaseName(alias: string): string {
  return `todo-preview-${alias}`;
}

/** A remote D1 database, as a binding needs it. */
export type D1Database = { name: string; id: string };

/** Wrangler's JSON shape of a D1 database (`d1 list --json`, `d1 info --json`). */
type WranglerD1Entry = { uuid?: unknown; name?: unknown };

function toD1Database(entry: WranglerD1Entry): D1Database {
  if (typeof entry.uuid !== "string" || typeof entry.name !== "string") {
    throw new Error(
      `Wrangler returned no database id for ${JSON.stringify(entry)}`,
    );
  }
  return { name: entry.name, id: entry.uuid };
}

/**
 * The database named exactly `name` in `wrangler d1 list --json` output, or
 * undefined when the account has none (the deploy then creates it).
 */
export function findD1Database(
  listing: string,
  name: string,
): D1Database | undefined {
  const entry = (JSON.parse(listing) as WranglerD1Entry[]).find(
    (database) => database.name === name,
  );
  return entry && toD1Database(entry);
}

/**
 * The database described by `wrangler d1 info <name> --json` output. The
 * deploy reads a new database's id this way: `d1 create` has no JSON output.
 */
export function d1DatabaseFromInfo(info: string): D1Database {
  return toD1Database(JSON.parse(info) as WranglerD1Entry);
}

/** A Wrangler config (JSON), as far as these helpers read it. */
export type WranglerConfig = {
  d1_databases?: Record<string, unknown>[];
  [key: string]: unknown;
};

/**
 * The per-preview config: `template` (the `preview` build's config, whose
 * `DB` binding is only a placeholder) with `DB` bound to `database`. Its
 * migrations_dir and every other setting are kept, so the same file serves
 * both `d1 migrations apply` and `versions upload`.
 */
export function withPreviewDatabase(
  template: WranglerConfig,
  database: D1Database,
): WranglerConfig {
  const databases = template.d1_databases ?? [];
  if (!databases.some((binding) => binding.binding === "DB")) {
    throw new Error('The built Wrangler config has no D1 binding "DB"');
  }
  return {
    ...template,
    d1_databases: databases.map((binding) =>
      binding.binding === "DB"
        ? {
            ...binding,
            database_name: database.name,
            database_id: database.id,
          }
        : binding,
    ),
  };
}

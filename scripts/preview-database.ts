/**
 * Each preview alias gets its own D1 database (ADR-0004). These pure helpers
 * name it, find it in Wrangler's JSON output and bind it in the built config;
 * `preview-deploy.ts` runs the Wrangler commands around them.
 */
import { prNumberOfAlias, prPreviewAlias } from "./preview-alias.ts";

/** Every preview database's name is this prefix and the preview's alias. */
const PREVIEW_DATABASE_PREFIX = "todo-preview-";

/** The D1 database of preview `alias`: `pr-42` gives `todo-preview-pr-42`. */
export function previewDatabaseName(alias: string): string {
  return `${PREVIEW_DATABASE_PREFIX}${alias}`;
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

/** A PR preview's database: `todo-preview-pr-<pr>`. */
export type PrPreviewDatabase = { name: string; pr: number };

/**
 * The databases in `wrangler d1 list --json` output named exactly like a PR
 * preview's (`todo-preview-pr-<N>`): the only candidates for cleanup. The
 * whole name must be the prefix followed by a PR's alias, so production's
 * `todo`, the old shared `todo-preview` and any other preview alias's
 * database never match.
 */
export function prPreviewDatabases(listing: string): PrPreviewDatabase[] {
  return (JSON.parse(listing) as WranglerD1Entry[]).flatMap(({ name }) => {
    if (typeof name !== "string" || !name.startsWith(PREVIEW_DATABASE_PREFIX)) {
      return [];
    }
    const pr = prNumberOfAlias(name.slice(PREVIEW_DATABASE_PREFIX.length));
    return pr === undefined ? [] : [{ name, pr }];
  });
}

/**
 * The PR preview databases to delete before a deploy: those whose PR is not in
 * `openPrs`, whether it is closed or no PR at all (e.g. a hand-run
 * `pr-9999`). Only call this with the open set from a successful lookup; an
 * unknown PR state must never count as not open.
 */
export function notOpenPrDatabases(
  databases: PrPreviewDatabase[],
  openPrs: ReadonlySet<number>,
): PrPreviewDatabase[] {
  return databases.filter((database) => !openPrs.has(database.pr));
}

/**
 * Whether `d1 create`'s output says the account is at its D1 database limit
 * (10 on Workers Free). Wrangler 4.147 rewords Cloudflare API error 7406 as
 * "You have reached the maximum number of D1 databases for your account.";
 * the match is loose so a rewording still counts: the error code, or a line
 * naming a database together with a limit or maximum (but not a rate limit).
 */
export function isD1LimitError(output: string): boolean {
  if (/\bcode:\s*7406\b/.test(output)) return true;
  return output
    .split("\n")
    .some(
      (line) =>
        /database/i.test(line) &&
        /\blimit\b|maximum number/i.test(line) &&
        !/rate limit/i.test(line),
    );
}

/**
 * Why a deploy stopped at the D1 limit and how to recover, naming the PR
 * previews among `databases` that hold a slot. With the open PRs known
 * (`openPrs`), only open PRs' previews are named, so a database whose delete
 * failed is never passed off as an open preview; with them unknown, every PR
 * preview database is named as just that.
 */
export function d1LimitMessage(
  databases: PrPreviewDatabase[],
  openPrs: ReadonlySet<number> | undefined,
): string {
  const named = openPrs
    ? databases.filter((database) => openPrs.has(database.pr))
    : databases;
  const previews =
    named
      .map((database) => database.pr)
      .sort((a, b) => a - b)
      .map(prPreviewAlias)
      .join(", ") || "none";
  const label = openPrs ? "open previews" : "preview databases";
  return `D1 database limit reached (${label}: ${previews}). Close a PR (its database is deleted on close), then use "Re-run failed jobs" on this PR.`;
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

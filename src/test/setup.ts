import { applyD1Migrations } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { afterEach, beforeAll } from "vitest";

// vitest-pool-workers isolates storage per test FILE: each file starts with an
// empty D1, to which all migrations are applied here.
beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
});

// Within a file, isolate each test by deleting every row it left behind and
// resetting AUTOINCREMENT counters.
// Schema (tables, migrations) is kept; seed data in `beforeEach` or the test
// itself, never in `beforeAll`.
afterEach(async () => {
  const { results } = await env.DB.prepare(
    `select name from sqlite_master
     where type = 'table'
       and name not like 'sqlite_%'
       and name not like '_cf_%'
       and name <> 'd1_migrations'`,
  ).all<{ name: string }>();
  if (results.length === 0) return;

  // sqlite_sequence holds AUTOINCREMENT counters; it exists only once some
  // table uses AUTOINCREMENT. Clearing it restarts those ids at 1.
  const sequence = await env.DB.prepare(
    "select 1 from sqlite_master where type = 'table' and name = 'sqlite_sequence'",
  ).first();

  // The batch is one transaction; deferring FK checks to its end lets tables
  // be emptied in any order.
  await env.DB.batch([
    env.DB.prepare("pragma defer_foreign_keys = on"),
    ...results.map(({ name }) =>
      env.DB.prepare(`delete from "${name.replaceAll('"', '""')}"`),
    ),
    ...(sequence ? [env.DB.prepare("delete from sqlite_sequence")] : []),
  ]);
});

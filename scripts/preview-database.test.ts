import { describe, expect, it } from "vitest";
import {
  d1DatabaseFromInfo,
  d1LimitMessage,
  findD1Database,
  isD1LimitError,
  isD1NotFoundError,
  notOpenPrDatabases,
  previewDatabaseName,
  prPreviewDatabases,
  withPreviewDatabase,
} from "./preview-database.ts";

// Shaped like `wrangler d1 list --json` and `wrangler d1 info --json`.
const listing = JSON.stringify([
  {
    uuid: "41280b99-8a3f-4e2f-b12d-8c928c201838",
    name: "todo",
    created_at: "2026-09-01T00:00:00.000Z",
    version: "production",
    num_tables: 3,
    file_size: 61440,
  },
  {
    uuid: "e6c87de0-4e97-4c4e-ac52-5816849502c8",
    name: "todo-preview",
    created_at: "2026-09-02T00:00:00.000Z",
    version: "production",
    num_tables: 3,
    file_size: 61440,
  },
  {
    uuid: "0f6e2c1a-1111-4222-8333-944455556666",
    name: "todo-preview-pr-4",
    created_at: "2026-10-07T00:00:00.000Z",
    version: "production",
    num_tables: 3,
    file_size: 61440,
  },
]);

describe("previewDatabaseName", () => {
  it.each([
    ["pr-42", "todo-preview-pr-42"],
    ["spike-2", "todo-preview-spike-2"],
  ])("names the D1 of alias %s %s", (alias, name) => {
    expect(previewDatabaseName(alias)).toBe(name);
  });
});

describe("findD1Database", () => {
  it("finds a database by its exact name", () => {
    expect(findD1Database(listing, "todo-preview-pr-4")).toEqual({
      name: "todo-preview-pr-4",
      id: "0f6e2c1a-1111-4222-8333-944455556666",
    });
  });

  it.each([
    "todo-preview-pr-42",
    "todo-preview-pr",
    "pr-4",
  ])("returns undefined for missing %s, so the deploy creates it", (name) => {
    expect(findD1Database(listing, name)).toBeUndefined();
  });

  it("returns undefined for an empty account", () => {
    expect(findD1Database("[]", "todo-preview-pr-4")).toBeUndefined();
  });
});

describe("d1DatabaseFromInfo", () => {
  it("reads the name and id of a database from its info", () => {
    const info = JSON.stringify({
      uuid: "0f6e2c1a-1111-4222-8333-944455556666",
      name: "todo-preview-pr-4",
      created_at: "2026-10-07T00:00:00.000Z",
      num_tables: 0,
      running_in_region: "APAC",
      database_size: 12288,
      read_queries_24h: 0,
      write_queries_24h: 0,
      rows_read_24h: 0,
      rows_written_24h: 0,
    });

    expect(d1DatabaseFromInfo(info)).toEqual({
      name: "todo-preview-pr-4",
      id: "0f6e2c1a-1111-4222-8333-944455556666",
    });
  });

  it("rejects output without a database id", () => {
    expect(() => d1DatabaseFromInfo(JSON.stringify({ name: "x" }))).toThrow(
      /no database id/,
    );
  });
});

describe("withPreviewDatabase", () => {
  // Trimmed from the `preview` build's dist/server/wrangler.json.
  const template = {
    name: "todo-preview",
    main: "index.js",
    assets: { directory: "../client" },
    d1_databases: [
      {
        binding: "DB",
        database_name: "todo-preview",
        database_id: "e6c87de0-4e97-4c4e-ac52-5816849502c8",
        migrations_dir: "../../migrations",
      },
    ],
    kv_namespaces: [],
  };
  const database = {
    name: "todo-preview-pr-4",
    id: "0f6e2c1a-1111-4222-8333-944455556666",
  };

  it("binds DB to the preview's database, keeping the migrations and everything else", () => {
    expect(withPreviewDatabase(template, database)).toEqual({
      name: "todo-preview",
      main: "index.js",
      assets: { directory: "../client" },
      d1_databases: [
        {
          binding: "DB",
          database_name: "todo-preview-pr-4",
          database_id: "0f6e2c1a-1111-4222-8333-944455556666",
          migrations_dir: "../../migrations",
        },
      ],
      kv_namespaces: [],
    });
  });

  it("leaves the template unchanged", () => {
    withPreviewDatabase(template, database);
    expect(template.d1_databases[0].database_name).toBe("todo-preview");
  });

  it("rejects a template without a DB binding", () => {
    expect(() =>
      withPreviewDatabase({ name: "todo-preview", d1_databases: [] }, database),
    ).toThrow(/no D1 binding "DB"/);
  });
});

describe("prPreviewDatabases", () => {
  const names = (...databaseNames: string[]) =>
    JSON.stringify(databaseNames.map((name, i) => ({ uuid: `id-${i}`, name })));

  it("selects the databases named like a PR preview's, with their PR number", () => {
    expect(
      prPreviewDatabases(
        names(
          "todo",
          "todo-preview",
          "todo-preview-pr-4",
          "todo-preview-pr-12",
        ),
      ),
    ).toEqual([
      { name: "todo-preview-pr-4", pr: 4 },
      { name: "todo-preview-pr-12", pr: 12 },
    ]);
  });

  it.each([
    "todo",
    "todo-preview",
    "todo-preview-pr",
    "todo-preview-pr-",
    "todo-preview-pr-0",
    "todo-preview-pr-07",
    "todo-preview-pr-4-old",
    "todo-preview-pr-x",
    "todo-preview-spike-2",
    "other-todo-preview-pr-4",
    "TODO-PREVIEW-PR-4",
  ])("never selects %s", (name) => {
    expect(prPreviewDatabases(names(name))).toEqual([]);
  });

  it("selects nothing in an empty account", () => {
    expect(prPreviewDatabases("[]")).toEqual([]);
  });
});

describe("notOpenPrDatabases", () => {
  const listing = JSON.stringify(
    [
      "todo",
      "todo-preview",
      "todo-preview-pr-3",
      "todo-preview-pr-4",
      "todo-preview-pr-12",
      "todo-preview-spike-2",
    ].map((name, i) => ({ uuid: `id-${i}`, name })),
  );

  it("chooses the databases of PRs not in the open set", () => {
    expect(
      notOpenPrDatabases(prPreviewDatabases(listing), new Set([4])),
    ).toEqual([
      { name: "todo-preview-pr-3", pr: 3 },
      { name: "todo-preview-pr-12", pr: 12 },
    ]);
  });

  it("leaves every open PR's database alone", () => {
    expect(
      notOpenPrDatabases(prPreviewDatabases(listing), new Set([3, 4, 12, 99])),
    ).toEqual([]);
  });

  it("never chooses todo, todo-preview or a non-PR preview's database", () => {
    const chosen = notOpenPrDatabases(prPreviewDatabases(listing), new Set());
    expect(chosen.map((database) => database.name)).toEqual([
      "todo-preview-pr-3",
      "todo-preview-pr-4",
      "todo-preview-pr-12",
    ]);
  });
});

describe("isD1LimitError", () => {
  it.each([
    // Wrangler 4.147's message for Cloudflare API error 7406.
    `✘ [ERROR] You have reached the maximum number of D1 databases for your account.

  On the Workers Free plan? Upgrade to create more:
  https://dash.cloudflare.com/abc/workers/plans`,
    // The raw API error, should Wrangler stop rewording it.
    "✘ [ERROR] A request to the Cloudflare API (/accounts/abc/d1/database) failed.\n  Database limit exceeded [code: 7406]",
    "Error: account has hit its D1 database limit",
  ])("recognises %s", (output) => {
    expect(isD1LimitError(output)).toBe(true);
  });

  it.each([
    "✘ [ERROR] A database with that name already exists",
    "✘ [ERROR] Authentication error [code: 10000]",
    "✘ [ERROR] Rate limit exceeded, retry later [code: 971]",
    "",
  ])("does not mistake %s for the limit", (output) => {
    expect(isD1LimitError(output)).toBe(false);
  });
});

describe("isD1NotFoundError", () => {
  it.each([
    // Wrangler 4.147's lookup by name, when the database is gone.
    "✘ [ERROR] Couldn't find a D1 DB with name or binding 'todo-preview-pr-42' in your config or the API. Run 'wrangler d1 create todo-preview-pr-42' to create it.",
    // The DELETE itself, should the database vanish after the lookup.
    "✘ [ERROR] A request to the Cloudflare API (/accounts/abc/d1/database/0f6e2c1a) failed.\n  The database 0f6e2c1a could not be found [code: 7404]",
  ])("recognises %s", (output) => {
    expect(isD1NotFoundError(output)).toBe(true);
  });

  it.each([
    "✘ [ERROR] Authentication error [code: 10000]",
    "✘ [ERROR] A request to the Cloudflare API failed.\n  Internal error [code: 7500]",
    "✘ [ERROR] Couldn't find an account",
    "",
  ])("does not mistake %s for a missing database", (output) => {
    expect(isD1NotFoundError(output)).toBe(false);
  });
});

describe("d1LimitMessage", () => {
  const databases = [
    { name: "todo-preview-pr-15", pr: 15 },
    { name: "todo-preview-pr-12", pr: 12 },
    { name: "todo-preview-pr-9", pr: 9 },
    { name: "todo-preview-pr-4", pr: 4 },
  ];
  const recovery =
    'Close a PR (its database is deleted on close), then use "Re-run failed jobs" on this PR.';

  it("names the open previews holding databases, in PR order, and the recovery", () => {
    expect(d1LimitMessage(databases, new Set([4, 12, 15, 99]))).toBe(
      `D1 database limit reached (open previews: pr-4, pr-12, pr-15). ${recovery}`,
    );
  });

  it("leaves out the databases of PRs not known to be open, e.g. a failed delete", () => {
    expect(d1LimitMessage(databases, new Set([12]))).toBe(
      `D1 database limit reached (open previews: pr-12). ${recovery}`,
    );
  });

  it("says so when no open preview holds a database", () => {
    expect(d1LimitMessage([], new Set([3]))).toBe(
      `D1 database limit reached (open previews: none). ${recovery}`,
    );
  });

  it("names every PR preview database, not open previews, when the open PRs are unknown", () => {
    expect(d1LimitMessage(databases, undefined)).toBe(
      `D1 database limit reached (preview databases: pr-4, pr-9, pr-12, pr-15). ${recovery}`,
    );
  });
});

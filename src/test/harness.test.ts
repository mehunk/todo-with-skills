import { env } from "cloudflare:workers";
import { beforeAll, describe, expect, it } from "vitest";

// Guards the test harness itself: later tests rely on these guarantees.
describe("Workers test harness", () => {
  it("applies D1 migrations before tests run", async () => {
    const table = await env.DB.prepare(
      "select name from sqlite_master where type = 'table' and name = 'd1_migrations'",
    ).first<{ name: string }>();

    expect(table).toEqual({ name: "d1_migrations" });
  });

  describe("per-test isolation", () => {
    beforeAll(async () => {
      await env.DB.batch([
        env.DB.prepare(
          "create table harness_parent (id integer primary key, note text)",
        ),
        env.DB.prepare(
          "create table harness_child (id integer primary key, parent_id integer not null references harness_parent (id))",
        ),
      ]);
    });

    // These two tests run in order: the second proves the first's rows are gone,
    // including rows linked by a foreign key.
    it("lets a test write rows", async () => {
      await env.DB.batch([
        env.DB.prepare(
          "insert into harness_parent (id, note) values (1, 'left behind')",
        ),
        env.DB.prepare("insert into harness_child (parent_id) values (1)"),
      ]);

      expect(await countRows()).toEqual({ parents: 1, children: 1 });
    });

    it("starts the next test with empty tables", async () => {
      expect(await countRows()).toEqual({ parents: 0, children: 0 });
    });
  });

  describe("per-test autoincrement reset", () => {
    beforeAll(async () => {
      await env.DB.prepare(
        "create table harness_counter (id integer primary key autoincrement, note text)",
      ).run();
    });

    // Both tests insert one row; each must get id 1, proving sqlite_sequence
    // does not carry ids over from the previous test.
    it("gives the first test's row id 1", async () => {
      expect(await insertCounterRow()).toBe(1);
    });

    it("gives the next test's row id 1 again", async () => {
      expect(await insertCounterRow()).toBe(1);
    });
  });
});

async function insertCounterRow() {
  const row = await env.DB.prepare(
    "insert into harness_counter (note) values ('x') returning id",
  ).first<{ id: number }>();
  return row?.id;
}

function countRows() {
  return env.DB.prepare(
    `select (select count(*) from harness_parent) as parents,
            (select count(*) from harness_child) as children`,
  ).first<{ parents: number; children: number }>();
}

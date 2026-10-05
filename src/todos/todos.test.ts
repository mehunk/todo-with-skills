import { env } from "cloudflare:workers";
import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { createDb } from "#/db";
import { createTodos } from "#/todos";

describe("Todos module", () => {
  it("is created against the test D1 database", () => {
    expect(createTodos(createDb(env.DB))).toBeDefined();
  });

  it("round-trips a query through Drizzle and D1", async () => {
    const db = createDb(env.DB);

    const row = await db.get<{ answer: number }>(sql`select 42 as answer`);

    expect(row).toEqual({ answer: 42 });
  });
});

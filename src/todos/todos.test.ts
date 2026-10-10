import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { createDb } from "#/db";
import { createTodos } from "#/todos";

const ALICE = "user_alice";
const BOB = "user_bob";

function todos() {
  return createTodos(createDb(env.DB));
}

describe("createList", () => {
  it("creates a List with the trimmed name", async () => {
    const result = await todos().createList(ALICE, { name: "  Groceries  " });

    expect(result).toEqual({
      ok: true,
      list: { id: expect.any(String), name: "Groceries" },
    });
  });

  it.each([
    ["an empty", ""],
    ["a whitespace-only", "   "],
  ])("rejects %s name and creates nothing", async (_, name) => {
    const result = await todos().createList(ALICE, { name });

    expect(result).toEqual({ ok: false, error: "Enter a List name" });
    expect(await todos().listLists(ALICE)).toEqual([]);
  });

  it("rejects a name longer than 100 characters and creates nothing", async () => {
    const result = await todos().createList(ALICE, { name: "a".repeat(101) });

    expect(result).toEqual({
      ok: false,
      error: "List names can be at most 100 characters",
    });
    expect(await todos().listLists(ALICE)).toEqual([]);
  });

  it("accepts a name of exactly 100 characters, after trimming", async () => {
    const name = "a".repeat(100);

    const result = await todos().createList(ALICE, { name: ` ${name} ` });

    expect(result).toMatchObject({ ok: true, list: { name } });
  });

  it("allows two Lists with the same name", async () => {
    await todos().createList(ALICE, { name: "Groceries" });
    await todos().createList(ALICE, { name: "Groceries" });

    expect(await todos().listLists(ALICE)).toEqual([
      { id: expect.any(String), name: "Groceries" },
      { id: expect.any(String), name: "Groceries" },
    ]);
  });
});

describe("listLists", () => {
  it("returns the Owner's Lists in creation order", async () => {
    const names = ["Work", "Groceries", "Books", "Weekend", "Errands"];
    const created = [];
    for (const name of names) {
      created.push(await createdList(ALICE, name));
    }

    expect(await todos().listLists(ALICE)).toEqual(created);
  });

  it("never returns another Owner's Lists", async () => {
    const alices = await createdList(ALICE, "Alice's");
    const bobs = await createdList(BOB, "Bob's");

    expect(await todos().listLists(ALICE)).toEqual([alices]);
    expect(await todos().listLists(BOB)).toEqual([bobs]);
  });
});

describe("getList", () => {
  it("returns the Owner's List", async () => {
    const list = await createdList(ALICE, "Groceries");

    expect(await todos().getList(ALICE, list.id)).toEqual({ ok: true, list });
  });

  it("reports not found for an unknown ID", async () => {
    expect(await todos().getList(ALICE, crypto.randomUUID())).toEqual({
      ok: false,
      error: "not-found",
    });
  });

  it("reports not found for another Owner's List", async () => {
    const bobs = await createdList(BOB, "Bob's");

    expect(await todos().getList(ALICE, bobs.id)).toEqual({
      ok: false,
      error: "not-found",
    });
  });
});

async function createdList(ownerId: string, name: string) {
  const result = await todos().createList(ownerId, { name });
  if (!result.ok) throw new Error(result.error);
  return result.list;
}

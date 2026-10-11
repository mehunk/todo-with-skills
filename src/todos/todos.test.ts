import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { createDb } from "#/db";
import { createTodos, openCount } from "#/todos";

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
  it("returns the Owner's new List, with no Todos", async () => {
    const list = await createdList(ALICE, "Groceries");

    expect(await todos().getList(ALICE, list.id)).toEqual({
      ok: true,
      list: { ...list, todos: [] },
    });
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

describe("addTodo", () => {
  it("adds a Todo with the trimmed title, not Completed", async () => {
    const list = await createdList(ALICE, "Groceries");

    const result = await todos().addTodo(ALICE, list.id, { title: "  Milk  " });

    expect(result).toEqual({
      ok: true,
      todo: { id: expect.any(String), title: "Milk", completed: false },
    });
  });

  it.each([
    ["an empty", ""],
    ["a whitespace-only", "   "],
  ])("rejects %s title and adds nothing", async (_, title) => {
    const list = await createdList(ALICE, "Groceries");

    const result = await todos().addTodo(ALICE, list.id, { title });

    expect(result).toEqual({ ok: false, error: "Enter a Todo title" });
    expect(await todos().getList(ALICE, list.id)).toMatchObject({
      list: { todos: [] },
    });
  });

  it("rejects a title longer than 500 characters and adds nothing", async () => {
    const list = await createdList(ALICE, "Groceries");

    const result = await todos().addTodo(ALICE, list.id, {
      title: "a".repeat(501),
    });

    expect(result).toEqual({
      ok: false,
      error: "Todo titles can be at most 500 characters",
    });
    expect(await todos().getList(ALICE, list.id)).toMatchObject({
      list: { todos: [] },
    });
  });

  it("accepts a title of exactly 500 characters, after trimming", async () => {
    const list = await createdList(ALICE, "Groceries");
    const title = "a".repeat(500);

    const result = await todos().addTodo(ALICE, list.id, {
      title: ` ${title} `,
    });

    expect(result).toMatchObject({ ok: true, todo: { title } });
  });

  it("reports not found for an unknown List", async () => {
    const result = await todos().addTodo(ALICE, crypto.randomUUID(), {
      title: "Milk",
    });

    expect(result).toEqual({ ok: false, error: "not-found" });
  });

  it("reports not found for another Owner's List and adds nothing", async () => {
    const bobs = await createdList(BOB, "Bob's");

    const result = await todos().addTodo(ALICE, bobs.id, { title: "Milk" });

    expect(result).toEqual({ ok: false, error: "not-found" });
    expect(await todos().getList(BOB, bobs.id)).toMatchObject({
      list: { todos: [] },
    });
  });
});

describe("deleteTodo", () => {
  it("deletes only that Todo; the List's other Todos remain", async () => {
    const list = await createdList(ALICE, "Groceries");
    const milk = await addedTodo(ALICE, list.id, "Milk");
    const eggs = await addedTodo(ALICE, list.id, "Eggs");
    const bread = await addedTodo(ALICE, list.id, "Bread");

    expect(await todos().deleteTodo(ALICE, eggs.id)).toEqual({ ok: true });

    expect(await todos().getList(ALICE, list.id)).toMatchObject({
      list: { todos: [milk, bread] },
    });
  });

  it("reports not found for an unknown Todo", async () => {
    expect(await todos().deleteTodo(ALICE, crypto.randomUUID())).toEqual({
      ok: false,
      error: "not-found",
    });
  });

  it("reports not found for a Todo already Deleted", async () => {
    const list = await createdList(ALICE, "Groceries");
    const milk = await addedTodo(ALICE, list.id, "Milk");
    await todos().deleteTodo(ALICE, milk.id);

    expect(await todos().deleteTodo(ALICE, milk.id)).toEqual({
      ok: false,
      error: "not-found",
    });
  });

  it("reports not found for another Owner's Todo and leaves it unchanged", async () => {
    const bobs = await createdList(BOB, "Bob's");
    const milk = await addedTodo(BOB, bobs.id, "Milk");

    expect(await todos().deleteTodo(ALICE, milk.id)).toEqual({
      ok: false,
      error: "not-found",
    });
    expect(await todos().getList(BOB, bobs.id)).toMatchObject({
      list: { todos: [milk] },
    });
  });
});

describe("getList with Todos", () => {
  it("returns the List's Todos in creation order", async () => {
    const list = await createdList(ALICE, "Groceries");
    const titles = ["Milk", "Eggs", "Bread", "Apples", "Coffee"];
    const added = [];
    for (const title of titles) {
      added.push(await addedTodo(ALICE, list.id, title));
    }

    expect(await todos().getList(ALICE, list.id)).toMatchObject({
      ok: true,
      list: { todos: added },
    });
    expect(added.map((todo) => todo.title)).toEqual(titles);
  });

  it("counts the Todos that are not Completed as open", async () => {
    const list = await createdList(ALICE, "Groceries");
    const milk = await addedTodo(ALICE, list.id, "Milk");
    await addedTodo(ALICE, list.id, "Eggs");
    await addedTodo(ALICE, list.id, "Bread");
    await todos().setCompleted(ALICE, milk.id, true);

    const result = await todos().getList(ALICE, list.id);

    expect(result.ok && openCount(result.list.todos)).toBe(2);
  });

  it("returns only that List's Todos", async () => {
    const groceries = await createdList(ALICE, "Groceries");
    const work = await createdList(ALICE, "Work");
    const milk = await addedTodo(ALICE, groceries.id, "Milk");
    const report = await addedTodo(ALICE, work.id, "Report");

    expect(await todos().getList(ALICE, groceries.id)).toMatchObject({
      list: { todos: [milk] },
    });
    expect(await todos().getList(ALICE, work.id)).toMatchObject({
      list: { todos: [report] },
    });
  });
});

describe("setCompleted", () => {
  it("completes a Todo, which then no longer counts as open", async () => {
    const list = await createdList(ALICE, "Groceries");
    const milk = await addedTodo(ALICE, list.id, "Milk");
    const eggs = await addedTodo(ALICE, list.id, "Eggs");

    const result = await todos().setCompleted(ALICE, milk.id, true);

    expect(result).toEqual({ ok: true, todo: { ...milk, completed: true } });
    expect(await todos().getList(ALICE, list.id)).toMatchObject({
      list: { todos: [{ ...milk, completed: true }, eggs] },
    });
  });

  it("reopens a Completed Todo, back in its creation-order place", async () => {
    const list = await createdList(ALICE, "Groceries");
    const milk = await addedTodo(ALICE, list.id, "Milk");
    const eggs = await addedTodo(ALICE, list.id, "Eggs");
    const bread = await addedTodo(ALICE, list.id, "Bread");
    await todos().setCompleted(ALICE, eggs.id, true);

    const result = await todos().setCompleted(ALICE, eggs.id, false);

    expect(result).toEqual({ ok: true, todo: eggs });
    expect(await todos().getList(ALICE, list.id)).toMatchObject({
      list: { todos: [milk, eggs, bread] },
    });
  });

  it.each([
    true,
    false,
  ])("is idempotent when setting Completed to %s twice", async (completed) => {
    const list = await createdList(ALICE, "Groceries");
    const milk = await addedTodo(ALICE, list.id, "Milk");

    await todos().setCompleted(ALICE, milk.id, completed);
    const result = await todos().setCompleted(ALICE, milk.id, completed);

    expect(result).toEqual({ ok: true, todo: { ...milk, completed } });
    expect(await todos().getList(ALICE, list.id)).toMatchObject({
      list: { todos: [{ ...milk, completed }] },
    });
  });

  it("reports not found for an unknown Todo", async () => {
    const result = await todos().setCompleted(ALICE, crypto.randomUUID(), true);

    expect(result).toEqual({ ok: false, error: "not-found" });
  });

  it("reports not found for another Owner's Todo and leaves it unchanged", async () => {
    const bobs = await createdList(BOB, "Bob's");
    const milk = await addedTodo(BOB, bobs.id, "Milk");

    const result = await todos().setCompleted(ALICE, milk.id, true);

    expect(result).toEqual({ ok: false, error: "not-found" });
    expect(await todos().getList(BOB, bobs.id)).toMatchObject({
      list: { todos: [milk] },
    });
  });
});

describe("clearCompleted", () => {
  it("removes only the Completed Todos and returns how many it removed", async () => {
    const list = await createdList(ALICE, "Groceries");
    const milk = await addedTodo(ALICE, list.id, "Milk");
    const eggs = await addedTodo(ALICE, list.id, "Eggs");
    const bread = await addedTodo(ALICE, list.id, "Bread");
    await todos().setCompleted(ALICE, milk.id, true);
    await todos().setCompleted(ALICE, bread.id, true);

    const result = await todos().clearCompleted(ALICE, list.id);

    expect(result).toEqual({ ok: true, cleared: 2 });
    expect(await todos().getList(ALICE, list.id)).toMatchObject({
      list: { todos: [eggs] },
    });
  });

  it("leaves the Owner's other Lists unchanged", async () => {
    const groceries = await createdList(ALICE, "Groceries");
    const work = await createdList(ALICE, "Work");
    const milk = await addedTodo(ALICE, groceries.id, "Milk");
    const report = await addedTodo(ALICE, work.id, "Report");
    await todos().setCompleted(ALICE, milk.id, true);
    await todos().setCompleted(ALICE, report.id, true);

    const result = await todos().clearCompleted(ALICE, groceries.id);

    expect(result).toEqual({ ok: true, cleared: 1 });
    expect(await todos().getList(ALICE, work.id)).toMatchObject({
      list: { todos: [{ ...report, completed: true }] },
    });
  });

  it("removes nothing and returns 0 when no Todo is Completed", async () => {
    const list = await createdList(ALICE, "Groceries");
    const milk = await addedTodo(ALICE, list.id, "Milk");

    const result = await todos().clearCompleted(ALICE, list.id);

    expect(result).toEqual({ ok: true, cleared: 0 });
    expect(await todos().getList(ALICE, list.id)).toMatchObject({
      list: { todos: [milk] },
    });
  });

  it("reports not found for an unknown List", async () => {
    const result = await todos().clearCompleted(ALICE, crypto.randomUUID());

    expect(result).toEqual({ ok: false, error: "not-found" });
  });

  it("reports not found for another Owner's List and leaves it unchanged", async () => {
    const bobs = await createdList(BOB, "Bob's");
    const milk = await addedTodo(BOB, bobs.id, "Milk");
    await todos().setCompleted(BOB, milk.id, true);

    const result = await todos().clearCompleted(ALICE, bobs.id);

    expect(result).toEqual({ ok: false, error: "not-found" });
    expect(await todos().getList(BOB, bobs.id)).toMatchObject({
      list: { todos: [{ ...milk, completed: true }] },
    });
  });
});

async function addedTodo(ownerId: string, listId: string, title: string) {
  const result = await todos().addTodo(ownerId, listId, { title });
  if (!result.ok) throw new Error(result.error);
  return result.todo;
}

async function createdList(ownerId: string, name: string) {
  const result = await todos().createList(ownerId, { name });
  if (!result.ok) throw new Error(result.error);
  return result.list;
}

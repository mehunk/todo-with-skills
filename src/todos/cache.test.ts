import { describe, expect, it } from "vitest";
import type { Todo } from "#/todos";
import { restoreTodos } from "./cache";

const todo = (id: string, completed = false): Todo => ({
  id,
  title: id,
  completed,
});

describe("restoreTodos", () => {
  it("puts a Deleted Todo back in its creation-order place", () => {
    const before = [todo("milk"), todo("eggs"), todo("bread")];
    const now = [todo("milk"), todo("bread")];

    expect(restoreTodos(now, [todo("eggs")], before)).toEqual(before);
  });

  it("keeps a Todo added and a Todo Completed while the Delete was saving", () => {
    const before = [todo("milk"), todo("eggs"), todo("bread")];
    const now = [todo("milk", true), todo("bread"), todo("jam")];

    expect(restoreTodos(now, [todo("eggs")], before)).toEqual([
      todo("milk", true),
      todo("eggs"),
      todo("bread"),
      todo("jam"),
    ]);
  });

  it("puts back several cleared Todos, including the first and last", () => {
    const before = [
      todo("milk", true),
      todo("eggs"),
      todo("bread", true),
      todo("jam", true),
    ];
    const cleared = before.filter((each) => each.completed);
    const now = [todo("eggs"), todo("tea")];

    expect(restoreTodos(now, cleared, before)).toEqual([
      todo("milk", true),
      todo("eggs"),
      todo("bread", true),
      todo("jam", true),
      todo("tea"),
    ]);
  });

  it("doesn't duplicate a Todo that is already back in the List", () => {
    const before = [todo("milk"), todo("eggs")];

    expect(restoreTodos(before, [todo("eggs")], before)).toEqual(before);
  });
});

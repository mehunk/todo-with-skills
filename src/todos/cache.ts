import type { Todo } from "#/todos";

/**
 * Undoes an optimistic removal: puts the `removed` Todos back into `todos`
 * (the cached List now) in creation order, taken from `before` (the List's
 * Todos when they were removed). Everything else in `todos` stays as it is,
 * so changes that landed meanwhile survive.
 */
export function restoreTodos(
  todos: readonly Todo[],
  removed: readonly Todo[],
  before: readonly Todo[],
): Todo[] {
  const present = new Set(todos.map((todo) => todo.id));
  const position = new Map(before.map((todo, index) => [todo.id, index]));
  const pending = removed
    .filter((todo) => !present.has(todo.id))
    .sort(
      (a, b) =>
        (position.get(a.id) ?? Infinity) - (position.get(b.id) ?? Infinity),
    );

  const restored: Todo[] = [];
  for (const todo of todos) {
    // A Todo missing from `before` was added since, so it is newer than all.
    const at = position.get(todo.id) ?? Infinity;
    while (
      pending.length > 0 &&
      (position.get(pending[0].id) ?? Infinity) < at
    ) {
      restored.push(pending.shift() as Todo);
    }
    restored.push(todo);
  }
  return [...restored, ...pending];
}

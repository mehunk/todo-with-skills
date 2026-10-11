import { useSuspenseQuery } from "@tanstack/react-query";
import {
  isTodoSaving,
  listQueryOptions,
  useAddTodoFromTitle,
} from "#/todos/queries";
import { AddTodoRow } from "./AddTodoRow";
import { EmptyList } from "./EmptyList";
import { TodoRow } from "./TodoRow";

/**
 * The selected List's Todo table: its Todos in creation order, then the Add
 * Todo row, then the "Empty List" state while it has no Todos. Reads the
 * List query, which the route loader prefetches. Render it with
 * `key={listId}`, so a half-typed title or error stays with its List.
 */
export function ListTodos({ listId }: { listId: string }) {
  const { data: list } = useSuspenseQuery(listQueryOptions(listId));
  const addTodo = useAddTodoFromTitle(listId);
  const todos = list?.todos ?? [];

  return (
    <div className="flex flex-col">
      {todos.length > 0 && (
        <ul aria-label="Todos">
          {todos.map((todo) => (
            <li key={todo.id}>
              <TodoRow todo={todo} saving={isTodoSaving(todo)} />
            </li>
          ))}
        </ul>
      )}
      <AddTodoRow
        onSubmit={addTodo.add}
        onValueChange={addTodo.clearError}
        error={addTodo.error}
      />
      {todos.length === 0 && <EmptyList />}
    </div>
  );
}

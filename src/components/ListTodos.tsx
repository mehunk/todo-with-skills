import { useSuspenseQuery } from "@tanstack/react-query";
import type { Todo } from "#/todos";
import {
  isTodoSaving,
  listQueryOptions,
  useAddTodoFromTitle,
  useClearCompleted,
  useDeleteTodo,
  useSetTodoCompleted,
} from "#/todos/queries";
import { AddTodoRow } from "./AddTodoRow";
import { CompletedSection } from "./CompletedSection";
import { EmptyList } from "./EmptyList";
import { TodoActions } from "./TodoActions";
import { TodoRow } from "./TodoRow";

/**
 * The selected List's Todo table: its open Todos in creation order, then the
 * Add Todo row, then the "Empty List" state while it has no Todos, and the
 * Completed section (also in creation order) while any Todo is Completed.
 * Reads the List query, which the route loader prefetches. Render it with
 * `key={listId}`, so a half-typed title or error stays with its List.
 */
export function ListTodos({ listId }: { listId: string }) {
  const { data: list } = useSuspenseQuery(listQueryOptions(listId));
  const addTodo = useAddTodoFromTitle(listId);
  const deleteTodo = useDeleteTodo(listId);
  const setCompleted = useSetTodoCompleted(listId);
  const clearCompleted = useClearCompleted(listId);
  const todos = list?.todos ?? [];
  const openTodos = todos.filter((todo) => !todo.completed);
  const completedTodos = todos.filter((todo) => todo.completed);

  const row = (todo: Todo) => (
    <li key={todo.id}>
      <TodoRow
        todo={todo}
        saving={isTodoSaving(todo)}
        onCompletedChange={(completed) =>
          setCompleted.mutate({ todoId: todo.id, completed })
        }
        actions={
          // A Todo still saving has no server ID to Delete yet.
          !isTodoSaving(todo) && (
            <TodoActions
              todoTitle={todo.title}
              onDelete={() => deleteTodo.mutate(todo.id)}
            />
          )
        }
      />
    </li>
  );

  return (
    <div className="flex flex-col">
      {openTodos.length > 0 && <ul aria-label="Todos">{openTodos.map(row)}</ul>}
      <AddTodoRow
        onSubmit={addTodo.add}
        onValueChange={addTodo.clearError}
        error={addTodo.error}
      />
      {todos.length === 0 && <EmptyList />}
      {completedTodos.length > 0 && (
        <CompletedSection
          count={completedTodos.length}
          onClearCompleted={() => clearCompleted.mutate()}
        >
          <ul aria-label="Completed">{completedTodos.map(row)}</ul>
        </CompletedSection>
      )}
    </div>
  );
}

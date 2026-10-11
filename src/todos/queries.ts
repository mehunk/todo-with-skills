import {
  type QueryClient,
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import type { List, ListWithTodos, NewList, Result, Todo } from "#/todos";
import { restoreTodos } from "./cache";
import {
  addTodo,
  clearCompleted,
  createList,
  deleteTodo,
  fetchList,
  fetchLists,
  setTodoCompleted,
} from "./functions";
import { listNameSchema, todoTitleSchema } from "./schemas";

// TanStack Query wiring for Lists and Todos: query options shared by route
// loaders and components, and the optimistic mutations.

const listsKey = ["lists"] as const;

/** What a server function produced, or throws why it couldn't. */
function unwrap<T extends object>(result: Result<T>) {
  if (!result.ok) throw new Error(result.error);
  return result;
}

export const listsQueryOptions = () =>
  queryOptions({ queryKey: listsKey, queryFn: () => fetchLists() });

/**
 * The List with its Todos; resolves to null when the List doesn't exist or
 * isn't the Owner's.
 */
export const listQueryOptions = (listId: string) =>
  queryOptions({
    queryKey: [...listsKey, listId],
    queryFn: () => fetchList({ data: { listId } }),
  });

const OPTIMISTIC_ID_PREFIX = "optimistic-";

/**
 * True while a List created optimistically is still saving: it has no server
 * ID yet, so it has no address to navigate to.
 */
export const isListSaving = (list: List) =>
  list.id.startsWith(OPTIMISTIC_ID_PREFIX);

/**
 * True while a Todo added optimistically is still saving: it has no server ID
 * yet, so nothing else can be done to it.
 */
export const isTodoSaving = (todo: Todo) =>
  todo.id.startsWith(OPTIMISTIC_ID_PREFIX);

export const SAVE_FAILED_MESSAGE = "Couldn't save — try again";

/**
 * Creates a List optimistically: it joins the Owner's Lists at once, and is
 * removed again with the "Couldn't save" toast if saving fails. Callers pass
 * `onSuccess` to `mutate` to select the saved List.
 */
export function useCreateList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: NewList) => {
      return unwrap(await createList({ data: input })).list;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: listsKey, exact: true });
      const optimistic: List = {
        id: `${OPTIMISTIC_ID_PREFIX}${crypto.randomUUID()}`,
        name: input.name.trim(),
      };
      queryClient.setQueryData<List[]>(listsKey, (lists) => [
        ...(lists ?? []),
        optimistic,
      ]);
      return { optimisticId: optimistic.id };
    },
    onError: (_error, _input, context) => {
      if (context) {
        queryClient.setQueryData<List[]>(listsKey, (lists) =>
          lists?.filter((list) => list.id !== context.optimisticId),
        );
      }
      toast.error(SAVE_FAILED_MESSAGE);
    },
    onSuccess: (list, _input, context) => {
      queryClient.setQueryData<List[]>(listsKey, (lists) =>
        lists?.map((each) => (each.id === context.optimisticId ? list : each)),
      );
      const created: ListWithTodos = { ...list, todos: [] };
      queryClient.setQueryData(listQueryOptions(list.id).queryKey, created);
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: listsKey, exact: true }),
  });
}

/**
 * Creating a List from a typed name, shared by the "No Lists" empty state and
 * the sidebar's new-List input. `create` validates the name, keeping its
 * error in `error`; a valid name creates the List, which is opened once it is
 * saved (after `onSaved`). Returns whether the name was valid.
 */
export function useCreateListFromName({
  onSaved,
}: {
  onSaved?: () => void;
} = {}) {
  const navigate = useNavigate();
  const createList = useCreateList();
  const [error, setError] = useState<string>();

  const create = (name: string) => {
    const parsed = listNameSchema.safeParse(name);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return false;
    }
    createList.mutate(
      { name: parsed.data },
      {
        onSuccess: (list) => {
          onSaved?.();
          navigate({ to: "/lists/$listId", params: { listId: list.id } });
        },
      },
    );
    return true;
  };

  return {
    create,
    error,
    clearError: () => setError(undefined),
    isPending: createList.isPending,
  };
}

/** Applies `update` to the cached List, when it is loaded. */
function updateCachedList(
  queryClient: QueryClient,
  listId: string,
  update: (list: ListWithTodos) => ListWithTodos,
) {
  queryClient.setQueryData(listQueryOptions(listId).queryKey, (list) =>
    list ? update(list) : list,
  );
}

/**
 * An optimistic change to one List's Todos: `optimistic` applies it to the
 * cached List at once. If saving fails, `rollback` undoes only this change
 * (given the List as it was before it, so changes that landed meanwhile
 * survive) and the "Couldn't save" toast shows; once saved, `saved` can swap
 * in what the server returned. The List is refetched when its last pending
 * change settles, so a refetch never drops another change's optimistic Todos.
 */
function useListMutation<TVariables, TData>({
  listId,
  mutationFn,
  optimistic,
  rollback,
  saved,
}: {
  listId: string;
  mutationFn: (variables: TVariables) => Promise<TData>;
  optimistic: (list: ListWithTodos, variables: TVariables) => ListWithTodos;
  rollback: (
    list: ListWithTodos,
    variables: TVariables,
    before: ListWithTodos,
  ) => ListWithTodos;
  saved?: (
    list: ListWithTodos,
    data: TData,
    variables: TVariables,
  ) => ListWithTodos;
}) {
  const queryClient = useQueryClient();
  const { queryKey } = listQueryOptions(listId);

  return useMutation({
    mutationKey: queryKey,
    mutationFn,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey, exact: true });
      const before = queryClient.getQueryData(queryKey);
      updateCachedList(queryClient, listId, (list) =>
        optimistic(list, variables),
      );
      return { before };
    },
    onError: (_error, variables, context) => {
      const before = context?.before;
      if (before) {
        updateCachedList(queryClient, listId, (list) =>
          rollback(list, variables, before),
        );
      }
      toast.error(SAVE_FAILED_MESSAGE);
    },
    onSuccess: (data, variables) => {
      if (saved) {
        updateCachedList(queryClient, listId, (list) =>
          saved(list, data, variables),
        );
      }
    },
    onSettled: () => {
      // This mutation still counts as pending here.
      if (queryClient.isMutating({ mutationKey: queryKey }) === 1) {
        return queryClient.invalidateQueries({ queryKey, exact: true });
      }
    },
  });
}

/**
 * Adds a Todo optimistically to the end of the List: it appears at once
 * (still saving, with a temporary ID), and is removed again with the
 * "Couldn't save" toast if saving fails.
 */
export function useAddTodo(listId: string) {
  return useListMutation({
    listId,
    mutationFn: async ({ title }: { title: string; optimisticId: string }) => {
      return unwrap(await addTodo({ data: { listId, title } })).todo;
    },
    optimistic: (list, { title, optimisticId }) => ({
      ...list,
      todos: [...list.todos, { id: optimisticId, title, completed: false }],
    }),
    rollback: (list, { optimisticId }) => ({
      ...list,
      todos: list.todos.filter((todo) => todo.id !== optimisticId),
    }),
    saved: (list, saved, { optimisticId }) => ({
      ...list,
      todos: list.todos.map((todo) =>
        todo.id === optimisticId ? saved : todo,
      ),
    }),
  });
}

/**
 * Adding a Todo from the typed title in the Add Todo row. `add` validates the
 * title, keeping its error in `error`; a valid title is added optimistically.
 * Returns whether the title was valid (so the row clears its input).
 */
export function useAddTodoFromTitle(listId: string) {
  const addTodo = useAddTodo(listId);
  const [error, setError] = useState<string>();

  const add = (title: string) => {
    const parsed = todoTitleSchema.safeParse(title);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return false;
    }
    setError(undefined);
    addTodo.mutate({
      title: parsed.data,
      optimisticId: `${OPTIMISTIC_ID_PREFIX}${crypto.randomUUID()}`,
    });
    return true;
  };

  return { add, error, clearError: () => setError(undefined) };
}

/**
 * Deletes a Todo optimistically: it disappears from the cached List at once
 * (the open count follows), and comes back in its place with the
 * "Couldn't save" toast if deleting fails.
 */
export function useDeleteTodo(listId: string) {
  return useListMutation({
    listId,
    mutationFn: async (todoId: string) => {
      unwrap(await deleteTodo({ data: { todoId } }));
    },
    optimistic: (list, todoId) => ({
      ...list,
      todos: list.todos.filter((todo) => todo.id !== todoId),
    }),
    rollback: (list, todoId, before) => ({
      ...list,
      todos: restoreTodos(
        list.todos,
        before.todos.filter((todo) => todo.id === todoId),
        before.todos,
      ),
    }),
  });
}

/** The List with the Todo `todoId` marked Completed or reopened. */
const withCompleted = (
  list: ListWithTodos,
  todoId: string,
  completed: boolean,
): ListWithTodos => ({
  ...list,
  todos: list.todos.map((todo) =>
    todo.id === todoId ? { ...todo, completed } : todo,
  ),
});

/**
 * Marks a Todo Completed or reopens it optimistically: it moves between the
 * open Todos and the Completed section at once (the open count follows), and
 * moves back with the "Couldn't save" toast if saving fails.
 */
export function useSetTodoCompleted(listId: string) {
  return useListMutation({
    listId,
    mutationFn: async ({
      todoId,
      completed,
    }: {
      todoId: string;
      completed: boolean;
    }) => {
      return unwrap(await setTodoCompleted({ data: { todoId, completed } }))
        .todo;
    },
    optimistic: (list, { todoId, completed }) =>
      withCompleted(list, todoId, completed),
    rollback: (list, { todoId, completed }) =>
      withCompleted(list, todoId, !completed),
  });
}

/**
 * Clear Completed, optimistically: the List's Completed Todos disappear from
 * the cached List at once (hiding the Completed section), and come back in
 * their places with the "Couldn't save" toast if clearing fails.
 */
export function useClearCompleted(listId: string) {
  return useListMutation({
    listId,
    mutationFn: async () => {
      return unwrap(await clearCompleted({ data: { listId } })).cleared;
    },
    optimistic: (list) => ({
      ...list,
      todos: list.todos.filter((todo) => !todo.completed),
    }),
    rollback: (list, _variables, before) => ({
      ...list,
      todos: restoreTodos(
        list.todos,
        before.todos.filter((todo) => todo.completed),
        before.todos,
      ),
    }),
  });
}

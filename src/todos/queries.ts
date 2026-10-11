import {
  type QueryClient,
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  type List,
  type ListWithTodos,
  type NewList,
  openCount,
  type Todo,
} from "#/todos";
import { addTodo, createList, fetchList, fetchLists } from "./functions";
import { listNameSchema, todoTitleSchema } from "./schemas";

// TanStack Query wiring for Lists and Todos: query options shared by route
// loaders and components, and the optimistic mutations.

const listsKey = ["lists"] as const;

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
      const result = await createList({ data: input });
      if (!result.ok) throw new Error(result.error);
      return result.list;
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
      const created: ListWithTodos = { ...list, todos: [], openCount: 0 };
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

/**
 * Applies `update` to the cached List (when it is loaded), keeping its open
 * count in step with its Todos.
 */
export function updateCachedList(
  queryClient: QueryClient,
  listId: string,
  update: (list: ListWithTodos) => ListWithTodos,
) {
  queryClient.setQueryData(listQueryOptions(listId).queryKey, (list) => {
    if (!list) return list;
    const updated = update(list);
    return { ...updated, openCount: openCount(updated.todos) };
  });
}

/**
 * An optimistic change to one List's Todos: `optimistic` applies it to the
 * cached List at once (the open count follows). If saving fails, `rollback`
 * undoes it (by default the cached List is restored as it was) and the
 * "Couldn't save" toast shows; once saved, `saved` can swap in what the
 * server returned. The List is refetched when its last pending change settles,
 * so a refetch never drops another change's optimistic Todos.
 */
export function useListMutation<TVariables, TData>({
  listId,
  mutationFn,
  optimistic,
  rollback,
  saved,
}: {
  listId: string;
  mutationFn: (variables: TVariables) => Promise<TData>;
  optimistic: (list: ListWithTodos, variables: TVariables) => ListWithTodos;
  rollback?: (list: ListWithTodos, variables: TVariables) => ListWithTodos;
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
      const previous = queryClient.getQueryData(queryKey);
      updateCachedList(queryClient, listId, (list) =>
        optimistic(list, variables),
      );
      return { previous };
    },
    onError: (_error, variables, context) => {
      if (rollback) {
        updateCachedList(queryClient, listId, (list) =>
          rollback(list, variables),
        );
      } else if (context) {
        queryClient.setQueryData(queryKey, context.previous);
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
      const result = await addTodo({ data: { listId, title } });
      if (!result.ok) throw new Error(result.error);
      return result.todo;
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

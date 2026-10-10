import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import type { List, NewList } from "#/todos";
import { createList, fetchList, fetchLists } from "./functions";
import { listNameSchema } from "./schemas";

// TanStack Query wiring for Lists: query options shared by route loaders and
// components, and the optimistic create mutation.

const listsKey = ["lists"] as const;

export const listsQueryOptions = () =>
  queryOptions({ queryKey: listsKey, queryFn: () => fetchLists() });

/** Resolves to null when the List doesn't exist or isn't the Owner's. */
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
      queryClient.setQueryData(listQueryOptions(list.id).queryKey, list);
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

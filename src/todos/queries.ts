import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type { List, NewList } from "#/todos";
import { createList, fetchList, fetchLists } from "./functions";

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
        id: `optimistic-${crypto.randomUUID()}`,
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

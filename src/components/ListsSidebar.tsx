import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  isListSaving,
  listsQueryOptions,
  useCreateList,
} from "#/todos/queries";
import { listNameSchema } from "#/todos/schemas";
import { useCloseSidebarDrawer } from "./AppShell";
import { Sidebar } from "./Sidebar";

/**
 * The signed-in sidebar: the Owner's Lists from the Lists query. Selecting a
 * List navigates to its address (so back/forward move between Lists) and
 * closes the mobile drawer. `+` opens the new-List input; a created List
 * appears at once and is selected as soon as it is saved (it has no address
 * before that). Route loaders prefetch the Lists query.
 */
export function ListsSidebar({ selectedListId }: { selectedListId?: string }) {
  const { data: lists } = useSuspenseQuery(listsQueryOptions());
  const navigate = useNavigate();
  const closeDrawer = useCloseSidebarDrawer();
  const createList = useCreateList();
  const [newListOpen, setNewListOpen] = useState(false);
  const [newListError, setNewListError] = useState<string>();

  const closeNewList = () => {
    setNewListOpen(false);
    setNewListError(undefined);
  };

  return (
    <Sidebar
      lists={lists}
      selectedListId={selectedListId}
      savingListIds={new Set(lists.filter(isListSaving).map((list) => list.id))}
      onSelectList={(listId) => {
        closeDrawer();
        if (listId !== selectedListId) {
          navigate({ to: "/lists/$listId", params: { listId } });
        }
      }}
      onAddList={() => setNewListOpen(true)}
      newListOpen={newListOpen}
      newListError={newListError}
      onNewListNameChange={() => setNewListError(undefined)}
      onCancelNewList={closeNewList}
      onCreateList={(name) => {
        const parsed = listNameSchema.safeParse(name);
        if (!parsed.success) {
          setNewListError(parsed.error.issues[0].message);
          return;
        }
        closeNewList();
        createList.mutate(
          { name: parsed.data },
          {
            onSuccess: (list) => {
              closeDrawer();
              navigate({ to: "/lists/$listId", params: { listId: list.id } });
            },
          },
        );
      }}
    />
  );
}

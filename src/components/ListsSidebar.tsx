import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { listsQueryOptions } from "#/todos/queries";
import { useCloseSidebarDrawer } from "./AppShell";
import { Sidebar } from "./Sidebar";

/**
 * The signed-in sidebar: the Owner's Lists from the Lists query. Selecting a
 * List navigates to its address (so back/forward move between Lists) and
 * closes the mobile drawer. Route loaders prefetch the Lists query.
 */
export function ListsSidebar({ selectedListId }: { selectedListId?: string }) {
  const { data: lists } = useSuspenseQuery(listsQueryOptions());
  const navigate = useNavigate();
  const closeDrawer = useCloseSidebarDrawer();

  return (
    <Sidebar
      lists={lists}
      selectedListId={selectedListId}
      onSelectList={(listId) => {
        closeDrawer();
        if (listId !== selectedListId) {
          navigate({ to: "/lists/$listId", params: { listId } });
        }
      }}
    />
  );
}

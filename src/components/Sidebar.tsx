import { PlusIcon } from "lucide-react";
import { Button } from "#/components/ui/button";
import { cn } from "#/lib/utils";
import type { List } from "#/todos";

type SidebarProps = {
  /** The Owner's Lists, in creation order. */
  lists: List[];
  /** The List shown in the main card, if any. */
  selectedListId?: string;
  /** Called when the Owner clicks a List. */
  onSelectList: (listId: string) => void;
  /** Called when the Owner clicks `+`. */
  onAddList?: () => void;
};

/**
 * The sidebar card's content (docs/ui.md Layout): "My Lists" with a `+`
 * button, then one row per List with the selected one highlighted. Below `sm`
 * rows and the `+` button are at least 44px tall.
 */
export function Sidebar({
  lists,
  selectedListId,
  onSelectList,
  onAddList,
}: SidebarProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex h-11 items-center justify-between pl-2 sm:h-9">
        <span className="text-sm font-semibold">My Lists</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 sm:size-8"
          aria-label="New List"
          onClick={onAddList}
        >
          <PlusIcon className="size-4" />
        </Button>
      </div>

      {lists.length === 0 ? (
        <p className="p-2 text-xs text-muted-foreground">No Lists yet</p>
      ) : (
        <nav aria-label="My Lists">
          <ul className="flex flex-col gap-0.5">
            {lists.map((list) => {
              const selected = list.id === selectedListId;
              return (
                <li key={list.id}>
                  <button
                    type="button"
                    aria-current={selected ? "page" : undefined}
                    title={list.name}
                    onClick={() => onSelectList(list.id)}
                    className={cn(
                      "flex h-11 w-full items-center rounded-lg px-2 text-left text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:h-9",
                      selected
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted",
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate">{list.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
}

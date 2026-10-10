import { PlusIcon } from "lucide-react";
import { Button } from "#/components/ui/button";
import { cn } from "#/lib/utils";
import type { List } from "#/todos";
import { ListNameInput } from "./ListNameInput";

type SidebarProps = {
  /** The Owner's Lists, in creation order. */
  lists: List[];
  /** The List shown in the main card, if any. */
  selectedListId?: string;
  /** Lists still saving: shown, but not selectable until they have an ID. */
  savingListIds?: ReadonlySet<string>;
  /** Called when the Owner clicks a List. */
  onSelectList: (listId: string) => void;
  /** Called when the Owner clicks `+`. */
  onAddList?: () => void;
  /** Shows the focused new-List input at the bottom. */
  newListOpen?: boolean;
  /** Validation error shown under the new-List input. */
  newListError?: string;
  /** Called with the typed name when the Owner presses Enter. */
  onCreateList?: (name: string) => void;
  /** Called when the Owner presses Esc in the new-List input. */
  onCancelNewList?: () => void;
  /** Called as the Owner types a new List's name. */
  onNewListNameChange?: (name: string) => void;
};

/**
 * The sidebar card's content (docs/ui.md Layout): "My Lists" with a `+`
 * button, then one row per List with the selected one highlighted, then the
 * new-List input while it is open. Below `sm` rows and the `+` button are at
 * least 44px tall.
 */
export function Sidebar({
  lists,
  selectedListId,
  savingListIds,
  onSelectList,
  onAddList,
  newListOpen = false,
  newListError,
  onCreateList,
  onCancelNewList,
  onNewListNameChange,
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
        !newListOpen && (
          <p className="p-2 text-xs text-muted-foreground">No Lists yet</p>
        )
      ) : (
        <nav aria-label="My Lists">
          <ul className="flex flex-col gap-0.5">
            {lists.map((list) => {
              const selected = list.id === selectedListId;
              const saving = savingListIds?.has(list.id) ?? false;
              return (
                <li key={list.id}>
                  <Button
                    type="button"
                    variant={selected ? "default" : "ghost"}
                    aria-current={selected ? "page" : undefined}
                    aria-busy={saving || undefined}
                    disabled={saving}
                    title={list.name}
                    onClick={() => onSelectList(list.id)}
                    className={cn(
                      "h-11 w-full justify-start rounded-lg px-2 text-left font-normal disabled:opacity-100 sm:h-9",
                      selected
                        ? "hover:bg-primary"
                        : "hover:bg-muted hover:text-foreground dark:hover:bg-muted",
                      saving && "text-muted-foreground",
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate">{list.name}</span>
                  </Button>
                </li>
              );
            })}
          </ul>
        </nav>
      )}

      {newListOpen && onCreateList && (
        <ListNameInput
          autoFocus
          className="p-0.5"
          error={newListError}
          onSubmit={onCreateList}
          onCancel={onCancelNewList}
          onValueChange={onNewListNameChange}
        />
      )}
    </div>
  );
}

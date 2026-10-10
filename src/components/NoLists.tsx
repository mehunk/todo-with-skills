import { ListTodoIcon } from "lucide-react";
import { ListNameInput } from "./ListNameInput";

type NoListsProps = {
  /** Called with the typed name when the Owner presses Enter. */
  onCreate: (name: string) => void;
  /** Called as the Owner types, e.g. to clear a shown error. */
  onNameChange?: (name: string) => void;
  /** Validation error shown under the List name input. */
  error?: string;
};

/**
 * The "No Lists" empty state in the main card (docs/ui.md Empty states): icon,
 * "Create your first List", one line of help and the List name input.
 */
export function NoLists({ onCreate, onNameChange, error }: NoListsProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-16 text-center">
      <ListTodoIcon className="size-10 text-muted-foreground" aria-hidden />
      <h2 className="text-base font-semibold">Create your first List</h2>
      <p className="max-w-xs text-sm text-muted-foreground">
        Lists hold your Todos. Name one and press Enter.
      </p>
      <ListNameInput
        className="mt-2 max-w-xs"
        autoFocus
        onSubmit={onCreate}
        onValueChange={onNameChange}
        error={error}
      />
    </div>
  );
}

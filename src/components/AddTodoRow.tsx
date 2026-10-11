import { PlusIcon } from "lucide-react";
import { useId, useState } from "react";
import { Input } from "#/components/ui/input";
import { cn } from "#/lib/utils";

type AddTodoRowProps = {
  /**
   * Called with the typed title when the Owner presses Enter. Return true
   * when the Todo is being added, so the row clears its input (focus stays).
   */
  onSubmit: (title: string) => boolean;
  /** Called as the Owner types, e.g. to clear a shown error. */
  onValueChange?: (title: string) => void;
  /** Validation error shown under the input. */
  error?: string;
  autoFocus?: boolean;
  className?: string;
};

/**
 * The inline "Add Todo" row at the end of the open Todos (docs/ui.md Layout):
 * a `+` icon in the checkbox column and an input that is borderless until
 * focused. A validation error appears directly under it.
 */
export function AddTodoRow({
  onSubmit,
  onValueChange,
  error,
  autoFocus,
  className,
}: AddTodoRowProps) {
  const [title, setTitle] = useState("");
  const errorId = useId();

  return (
    <form
      className={cn("border-b px-4 py-1", className)}
      onSubmit={(event) => {
        event.preventDefault();
        if (onSubmit(title)) setTitle("");
      }}
    >
      <div className="flex min-h-11 items-center gap-3 sm:min-h-8">
        <PlusIcon
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <Input
          aria-label="Add Todo"
          placeholder="Add Todo"
          autoComplete="off"
          autoFocus={autoFocus}
          value={title}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => {
            setTitle(event.target.value);
            onValueChange?.(event.target.value);
          }}
          className="-ml-2 h-8 border-transparent bg-transparent px-2 shadow-none dark:bg-transparent"
        />
      </div>
      {error && (
        <p id={errorId} className="pb-1 pl-7 text-xs text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}

import { Ellipsis, Trash2 } from "lucide-react";
import { Button } from "#/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";

type TodoActionsProps = {
  /** The Todo's title, naming the actions for screen readers. */
  todoTitle: string;
  /** Deletes the Todo straight away, without confirmation. */
  onDelete: () => void;
};

/**
 * A Todo row's actions, for `TodoRow`'s `actions` slot (docs/ui.md). From
 * `md` up, a Delete icon button that fades in while the row is hovered (or
 * holds focus), and is always visible on touch screens (coarse pointer), with
 * a 44px tap target there; below `md`, an always-visible `⋯` menu holding
 * Delete, with a 44px tap target.
 */
export function TodoActions({ todoTitle, onDelete }: TodoActionsProps) {
  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Delete ${todoTitle}`}
        onClick={onDelete}
        className="relative hidden text-muted-foreground opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:text-destructive md:inline-flex pointer-coarse:opacity-100 pointer-coarse:after:absolute pointer-coarse:after:-inset-1.5"
      >
        <Trash2 />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${todoTitle}`}
            className="relative text-muted-foreground after:absolute after:-inset-1.5 md:hidden"
          >
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem variant="destructive" onSelect={onDelete}>
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

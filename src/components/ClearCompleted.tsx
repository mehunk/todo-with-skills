import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "#/components/ui/dialog";

type ClearCompletedProps = {
  /** How many Todos are Completed, named in the confirmation. */
  count: number;
  /** Clears the Completed Todos; called only once the Owner confirms. */
  onConfirm: () => void;
  /** The confirmation dialog is open at first (for stories). */
  defaultOpen?: boolean;
};

/**
 * The "Clear Completed" button beside the "Completed (N)" toggle. It opens a
 * confirmation dialog: the destructive "Clear Completed" button clears the
 * Completed Todos, Cancel (or Esc) closes it without changing anything.
 */
export function ClearCompleted({
  count,
  onConfirm,
  defaultOpen,
}: ClearCompletedProps) {
  const todos = count === 1 ? "1 Completed Todo" : `${count} Completed Todos`;

  return (
    <Dialog defaultOpen={defaultOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="xs"
          // A 44px tap target on phones (docs/ui.md), without a taller row.
          className="relative text-muted-foreground after:absolute after:inset-x-0 after:-inset-y-2.5 sm:after:hidden"
        >
          Clear Completed
        </Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Clear Completed?</DialogTitle>
          <DialogDescription>
            This permanently removes {todos} from this List.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="destructive" onClick={onConfirm}>
              Clear Completed
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

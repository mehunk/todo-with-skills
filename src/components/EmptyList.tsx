import { ListChecksIcon } from "lucide-react";

/**
 * The "Empty List" state (docs/ui.md Empty states), shown under the Add Todo
 * row while the List has no Todos.
 */
export function EmptyList() {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
      <ListChecksIcon className="size-8 text-muted-foreground" aria-hidden />
      <p className="text-sm text-muted-foreground">
        Nothing here yet. Add your first Todo.
      </p>
    </div>
  );
}

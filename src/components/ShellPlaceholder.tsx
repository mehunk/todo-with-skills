import { ListTodoIcon } from "lucide-react";

/**
 * Placeholder content for the signed-in AppShell until the Lists and Todos
 * spec replaces it with the real sidebar and Todo table.
 */
export function PlaceholderSidebar() {
  return (
    <>
      <div className="flex h-9 items-center px-2">
        <span className="text-sm font-semibold">My Lists</span>
      </div>
      <p className="px-2 py-1.5 text-xs text-muted-foreground">No Lists yet</p>
    </>
  );
}

export function PlaceholderHeader() {
  return (
    <h1 className="min-w-0 flex-1 truncate text-base font-semibold">Todo</h1>
  );
}

export function PlaceholderMain() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-16 text-center">
      <ListTodoIcon className="size-10 text-muted-foreground" aria-hidden />
      <h2 className="text-base font-semibold">Create your first List</h2>
      <p className="max-w-xs text-sm text-muted-foreground">
        Lists hold your Todos. Creating Lists is coming next.
      </p>
    </div>
  );
}

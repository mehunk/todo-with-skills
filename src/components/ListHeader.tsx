/**
 * The main card header for a selected List: its name (truncated) and how many
 * of its Todos are still open, "N open", in `tabular-nums`.
 */
export function ListHeader({
  name,
  openCount,
}: {
  name: string;
  openCount: number;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-baseline gap-2">
      <h1 className="min-w-0 truncate text-base font-semibold">{name}</h1>
      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
        {openCount} open
      </span>
    </div>
  );
}

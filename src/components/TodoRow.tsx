import { type ReactNode, useId } from "react";
import { Checkbox } from "#/components/ui/checkbox";
import { cn } from "#/lib/utils";
import type { Todo } from "#/todos";

type TodoRowProps = {
  todo: Todo;
  /** Still saving (no server ID yet): shown muted, checkbox disabled. */
  saving?: boolean;
  /**
   * Called when the Owner ticks or unticks the checkbox. Without it the
   * checkbox is shown but disabled.
   */
  onCompletedChange?: (completed: boolean) => void;
  /** Row actions (e.g. Delete), in the last grid column. */
  actions?: ReactNode;
  className?: string;
};

/**
 * One row of the Todo table (docs/ui.md Layout): checkbox · title · actions,
 * separated by `border-b`. Long titles wrap. Rows are at least `h-10`, and at
 * least 44px tall below `sm`, where the checkbox's tap target is 44px too.
 */
export function TodoRow({
  todo,
  saving = false,
  onCompletedChange,
  actions,
  className,
}: TodoRowProps) {
  const titleId = useId();

  return (
    <div
      aria-busy={saving || undefined}
      className={cn(
        "group grid min-h-11 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b px-4 py-2 transition-colors hover:bg-muted/50 sm:min-h-10",
        className,
      )}
    >
      <Checkbox
        aria-labelledby={titleId}
        checked={todo.completed}
        disabled={saving || !onCompletedChange}
        onCheckedChange={(checked) => onCompletedChange?.(checked === true)}
        className="relative after:absolute after:-inset-3.5 disabled:opacity-100 sm:after:-inset-2"
      />
      <span
        id={titleId}
        className={cn("text-sm", saving && "text-muted-foreground")}
      >
        {todo.title}
      </span>
      <div className="flex items-center">{actions}</div>
    </div>
  );
}

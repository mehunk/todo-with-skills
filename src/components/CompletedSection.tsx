import { ChevronRightIcon } from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import { cn } from "#/lib/utils";
import { ClearCompleted } from "./ClearCompleted";

type CompletedSectionProps = {
  /** How many Todos are Completed: the toggle reads "Completed (N)". */
  count: number;
  /** The Completed Todo rows, shown while the section is expanded. */
  children: ReactNode;
  /** Expanded at first (docs/ui.md: expanded by default). */
  defaultExpanded?: boolean;
  /**
   * Clears the Completed Todos once the Owner confirms; shows the
   * "Clear Completed" button beside the toggle.
   */
  onClearCompleted?: () => void;
  className?: string;
};

/**
 * The Completed section below the Todo table (docs/ui.md Layout): a
 * "Completed (N)" toggle, expanded by default, that collapses and expands the
 * Completed Todos, with "Clear Completed" beside it. Callers hide it when
 * there are no Completed Todos.
 */
export function CompletedSection({
  count,
  children,
  defaultExpanded = true,
  onClearCompleted,
  className,
}: CompletedSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const contentId = useId();

  return (
    <section className={cn("flex flex-col", className)}>
      <div className="flex min-h-11 items-center justify-between gap-2 border-b px-4 sm:min-h-10">
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={contentId}
          onClick={() => setExpanded((was) => !was)}
          className="-ml-1 flex min-h-11 items-center gap-1.5 rounded-md px-1 text-xs text-muted-foreground tabular-nums outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:min-h-8"
        >
          <ChevronRightIcon
            aria-hidden
            className={cn(
              "size-4 transition-transform",
              expanded && "rotate-90",
            )}
          />
          Completed ({count})
        </button>
        {onClearCompleted && (
          <ClearCompleted count={count} onConfirm={onClearCompleted} />
        )}
      </div>
      <div id={contentId} hidden={!expanded}>
        {expanded && children}
      </div>
    </section>
  );
}

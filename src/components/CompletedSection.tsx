import { ChevronRightIcon } from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import { Button } from "#/components/ui/button";
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
        <Button
          variant="ghost"
          size="sm"
          aria-expanded={expanded}
          aria-controls={contentId}
          onClick={() => setExpanded((was) => !was)}
          className="-ml-1 min-h-11 gap-1.5 px-1 text-xs font-normal text-muted-foreground tabular-nums hover:bg-transparent hover:text-foreground has-[>svg]:px-1 sm:min-h-8 dark:hover:bg-transparent"
        >
          <ChevronRightIcon
            aria-hidden
            className={cn(
              "size-4 transition-transform",
              expanded && "rotate-90",
            )}
          />
          Completed ({count})
        </Button>
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

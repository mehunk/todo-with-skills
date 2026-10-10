import { useId, useState } from "react";
import { Input } from "#/components/ui/input";
import { cn } from "#/lib/utils";

type ListNameInputProps = {
  /** Called with the typed name when the Owner presses Enter. */
  onSubmit: (name: string) => void;
  /** Called when the Owner presses Esc. */
  onCancel?: () => void;
  /** Called as the Owner types, e.g. to clear a shown error. */
  onValueChange?: (name: string) => void;
  /** Validation error shown under the input. */
  error?: string;
  autoFocus?: boolean;
  className?: string;
};

/**
 * The List name input used to create a List: Enter submits, Esc cancels, and a
 * validation error appears directly under it (docs/ui.md Feedback).
 */
export function ListNameInput({
  onSubmit,
  onCancel,
  onValueChange,
  error,
  autoFocus,
  className,
}: ListNameInputProps) {
  const [name, setName] = useState("");
  const errorId = useId();

  return (
    <form
      className={cn("flex w-full flex-col gap-1.5", className)}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(name);
      }}
    >
      <Input
        aria-label="List name"
        placeholder="List name"
        autoComplete="off"
        autoFocus={autoFocus}
        value={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => {
          setName(event.target.value);
          onValueChange?.(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape" && onCancel) {
            event.preventDefault();
            onCancel();
          }
        }}
      />
      {error && (
        <p id={errorId} className="text-left text-xs text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}

import { cn } from "#/lib/utils";
import { APP_VERSION } from "#/lib/version";

/** The app version in small muted text; shared by the Footer and the AppShell. */
export function AppVersion({
  version = APP_VERSION,
  className,
}: {
  /** Override for Storybook; defaults to the package.json version. */
  version?: string;
  className?: string;
}) {
  return (
    <p className={cn("text-xs text-muted-foreground tabular-nums", className)}>
      {version}
    </p>
  );
}

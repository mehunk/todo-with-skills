import { MenuIcon } from "lucide-react";
import { createContext, type ReactNode, useContext, useState } from "react";
import { Button } from "#/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "#/components/ui/sheet";
import { cn } from "#/lib/utils";
import { AppVersion } from "./AppVersion";

const CloseDrawerContext = createContext<() => void>(() => {});

/**
 * Closes the mobile sidebar drawer. Sidebar content calls it after the Owner
 * selects a List; on desktop it does nothing visible.
 */
export function useCloseSidebarDrawer() {
  return useContext(CloseDrawerContext);
}

type AppShellProps = {
  /** Sidebar card content: a card on ≥ md, a left drawer below md. */
  sidebar: ReactNode;
  /** Main card header content, placed after the mobile menu button. */
  header: ReactNode;
  /** Main card body. */
  children: ReactNode;
  /** Start with the drawer open (Storybook). */
  defaultDrawerOpen?: boolean;
};

/**
 * Signed-in layout from docs/ui.md "Layout": a muted canvas with a sidebar
 * card beside a main card.
 */
export function AppShell({
  sidebar,
  header,
  children,
  defaultDrawerOpen = false,
}: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(defaultDrawerOpen);
  const closeDrawer = () => setDrawerOpen(false);

  return (
    <CloseDrawerContext.Provider value={closeDrawer}>
      <div className="flex flex-1 flex-col bg-muted/50 p-3 md:p-5">
        <div className="mx-auto flex w-full max-w-6xl flex-1 gap-5">
          <aside className="hidden w-64 shrink-0 md:flex">
            <SidebarCard>{sidebar}</SidebarCard>
          </aside>

          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetContent
              side="left"
              showCloseButton={false}
              className="w-72 gap-0 border-0 bg-transparent p-3 shadow-none outline-none sm:max-w-72 md:hidden"
            >
              <SheetTitle className="sr-only">My Lists</SheetTitle>
              <SheetDescription className="sr-only">
                Choose a List to show
              </SheetDescription>
              <SidebarCard className="flex-1">{sidebar}</SidebarCard>
            </SheetContent>
          </Sheet>

          <main className="flex min-w-0 flex-1 flex-col rounded-xl border bg-card text-card-foreground shadow-sm">
            <header className="flex min-h-14 items-center gap-2 border-b px-4 py-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="-ml-2 md:hidden"
                aria-label="Open Lists"
                onClick={() => setDrawerOpen(true)}
              >
                <MenuIcon className="size-5" />
              </Button>
              {header}
            </header>
            <div className="flex flex-1 flex-col">{children}</div>
          </main>
        </div>
        <AppVersion className="mx-auto mt-3 w-full max-w-6xl text-right" />
      </div>
    </CloseDrawerContext.Provider>
  );
}

function SidebarCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full flex-col rounded-xl border bg-card p-2 text-card-foreground shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

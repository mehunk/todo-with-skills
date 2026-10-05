import { Show, SignInButton, UserButton } from "@clerk/tanstack-react-start";
import { Link } from "@tanstack/react-router";
import { ListChecksIcon } from "lucide-react";
import { Button } from "#/components/ui/button";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <nav className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-md text-sm font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <ListChecksIcon className="size-4" aria-hidden />
          Todo
        </Link>
        <Link
          to="/about"
          className="rounded-md text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
          activeProps={{ className: "text-foreground" }}
        >
          About
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Show when="signed-in">
            <UserButton />
          </Show>
          <Show when="signed-out">
            <SignInButton>
              <Button variant="outline" size="sm">
                Sign in
              </Button>
            </SignInButton>
          </Show>
        </div>
      </nav>
    </header>
  );
}

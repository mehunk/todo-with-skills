import { Show, SignInButton } from "@clerk/tanstack-react-start";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "#/components/AppShell";
import Footer from "#/components/Footer";
import { Landing } from "#/components/Landing";
import {
  PlaceholderHeader,
  PlaceholderMain,
  PlaceholderSidebar,
} from "#/components/ShellPlaceholder";
import { Button } from "#/components/ui/button";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <>
      <Show when="signed-in">
        <AppShell
          sidebar={<PlaceholderSidebar />}
          header={<PlaceholderHeader />}
        >
          <PlaceholderMain />
        </AppShell>
      </Show>
      <Show when="signed-out">
        <Landing
          signIn={
            <SignInButton>
              <Button size="lg">Sign in to get started</Button>
            </SignInButton>
          }
        />
        <Footer />
      </Show>
    </>
  );
}

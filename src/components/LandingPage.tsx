import { SignInButton } from "@clerk/tanstack-react-start";
import { fetchOwnerId } from "#/todos/functions";
import Footer from "./Footer";
import { Landing } from "./Landing";
import { Button } from "./ui/button";

/**
 * The loader of an app route: runs `load` (prefetching, redirects, 404s) only
 * for a signed-in Owner. The route's component renders `<LandingPage />` when
 * `signedIn` is false.
 */
export async function loadIfSignedIn(
  load: () => Promise<void>,
): Promise<{ signedIn: boolean }> {
  if (!(await fetchOwnerId())) return { signedIn: false };
  await load();
  return { signedIn: true };
}

/** What a signed-out visitor sees on every app route. */
export function LandingPage() {
  return (
    <>
      <Landing
        signIn={
          <SignInButton>
            <Button size="lg">Sign in to get started</Button>
          </SignInButton>
        }
      />
      <Footer />
    </>
  );
}

import { SignInButton } from "@clerk/tanstack-react-start";
import Footer from "./Footer";
import { Landing } from "./Landing";
import { Button } from "./ui/button";

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

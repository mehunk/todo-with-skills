import { useAuth } from "@clerk/tanstack-react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

/**
 * Route loaders read the Owner on the server, so when Clerk signs someone in
 * or out in the page (no reload), re-run them, then drop the cached data of
 * whoever was signed in before. Signing in as someone else always passes
 * through signed out, so no loader ever sees another Owner's cached Lists.
 */
export function AuthSync() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const previous = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (!isLoaded) return;
    const current = userId ?? null;
    const changed =
      previous.current !== undefined && previous.current !== current;
    previous.current = current;
    if (!changed) return;
    // Clear only once the loaders have moved off the old Owner's data, so no
    // mounted component refetches it as someone else (or no one).
    void router.invalidate().then(() => queryClient.clear());
  }, [isLoaded, userId, queryClient, router]);

  return null;
}

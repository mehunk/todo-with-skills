import { clerk } from "@clerk/testing/playwright";
import type { Page } from "@playwright/test";

/**
 * Signs `page` in as the dedicated E2E test user (E2E_CLERK_USER_EMAIL) with
 * a Clerk sign-in token: no password, no UI. The page must already be on a
 * page of the app that loads Clerk, e.g. after `page.goto("/")`.
 */
export async function signIn(page: Page) {
  const emailAddress = process.env.E2E_CLERK_USER_EMAIL;
  if (!emailAddress) throw new Error("E2E_CLERK_USER_EMAIL is not set");
  await clerk.signIn({ page, emailAddress });
}

import { readFileSync } from "node:fs";
import type { Page } from "@playwright/test";
import { signIn } from "./support/auth";
import { expect, test } from "./support/fixtures";

// Read from package.json so a version bump never needs a test edit.
const { version } = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as { version: string };
const versionText = `v${version}`;

const landingHeading = (page: Page) =>
  page.getByRole("heading", { name: "A calm place for your Todos." });

test("a visitor signs in to the app shell and signs out to the landing page", async ({
  page,
}) => {
  await test.step("a visitor sees the landing page", async () => {
    await page.goto("/");
    await expect(landingHeading(page)).toBeVisible();
    await expect(page.getByText(versionText, { exact: true })).toBeVisible();
  });

  await test.step("after signing in, the app shell is visible", async () => {
    await signIn(page);
    await expect(page.getByText("My Lists")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Create your first List" }),
    ).toBeVisible();
    await expect(page.getByText(versionText, { exact: true })).toBeVisible();
  });

  await test.step("signing out returns to the landing page", async () => {
    await page.getByRole("button", { name: "Open user menu" }).click();
    await page
      .getByRole("dialog", { name: "Account panel" })
      .getByRole("button", { name: "Sign out" })
      .click();
    await expect(landingHeading(page)).toBeVisible();
  });
});

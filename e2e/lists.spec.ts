import { randomUUID } from "node:crypto";
import type { Page } from "@playwright/test";
import { signIn } from "./support/auth";
import { expect, test } from "./support/fixtures";

const LIST_PATH = /\/lists\/[0-9a-f-]{36}$/;

const listTitle = (page: Page) =>
  page.getByRole("main").getByRole("heading", { level: 1 });

test("an Owner opening / lands on a List and stays on it after a reload", async ({
  page,
  testData,
}) => {
  await page.goto("/");
  await signIn(page);

  // The shared E2E user may have no Lists yet: then / shows the "No Lists"
  // empty state instead, and creating a List there must select it.
  const createFirst = page.getByRole("heading", {
    name: "Create your first List",
  });
  await expect(async () => {
    const landed =
      LIST_PATH.test(new URL(page.url()).pathname) ||
      (await createFirst.isVisible());
    expect(landed).toBe(true);
  }).toPass();
  if (await createFirst.isVisible()) {
    const name = testData.uniqueName("First List");
    await page.getByRole("textbox", { name: "List name" }).fill(name);
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(LIST_PATH);
    await expect(listTitle(page)).toHaveText(name);
    // No Delete List yet, so this List stays (spec #12 Further Notes).
  }

  await page.goto("/");
  await expect(page).toHaveURL(LIST_PATH);
  const listUrl = page.url();
  await expect(listTitle(page)).not.toBeEmpty();
  const name = (await listTitle(page).textContent()) ?? "";

  await page.reload();
  await expect(page).toHaveURL(listUrl);
  await expect(listTitle(page)).toHaveText(name);
});

test("a List address that isn't the Owner's shows Page not found", async ({
  page,
}) => {
  await page.goto("/");
  await signIn(page);
  await expect(page.getByText("My Lists")).toBeVisible();

  // Unknown and other Owners' IDs behave the same (module tests cover both).
  await page.goto(`/lists/${randomUUID()}`);

  await expect(
    page.getByRole("heading", { name: "Page not found" }),
  ).toBeVisible();
});

test("a signed-out visitor opening a List address sees the landing page", async ({
  page,
}) => {
  await page.goto(`/lists/${randomUUID()}`);

  await expect(
    page.getByRole("heading", { name: "A calm place for your Todos." }),
  ).toBeVisible();
});

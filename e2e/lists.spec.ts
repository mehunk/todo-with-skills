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

/** The sidebar's List rows: the desktop sidebar card (not the mobile drawer). */
const sidebarLists = (page: Page) =>
  page.getByRole("navigation", { name: "My Lists" }).getByRole("button");

/**
 * Signs in and makes sure the shared E2E user has at least one List, creating
 * one from the "No Lists" empty state if needed. Ends on a List page.
 */
async function signInToAList(page: Page, uniqueName: (name: string) => string) {
  await page.goto("/");
  await signIn(page);
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
    await page
      .getByRole("textbox", { name: "List name" })
      .fill(uniqueName("Sidebar List"));
    await page.keyboard.press("Enter");
  }
  await expect(page).toHaveURL(LIST_PATH);
}

test("clicking a List in the sidebar opens it, and back returns to the previous List", async ({
  page,
  testData,
}) => {
  await signInToAList(page, testData.uniqueName);
  const firstUrl = page.url();
  await expect(sidebarLists(page).first()).toBeVisible();

  // Selecting each List shows it: highlighted row, address and header name.
  // The shared user may have one List or many; the full two-List flow with
  // sidebar create is covered once creating from the sidebar lands.
  for (const row of [sidebarLists(page).last(), sidebarLists(page).first()]) {
    const name = (await row.textContent()) ?? "";
    await row.click();
    await expect(page).toHaveURL(LIST_PATH);
    await expect(listTitle(page)).toHaveText(name);
    await expect(row).toHaveAttribute("aria-current", "page");
  }
  await expect(page).toHaveURL(firstUrl);

  const lastName = (await sidebarLists(page).last().textContent()) ?? "";
  await sidebarLists(page).last().click();
  await expect(listTitle(page)).toHaveText(lastName);
  await page.goBack();
  await expect(page).toHaveURL(firstUrl);
  await page.goForward();
  await expect(listTitle(page)).toHaveText(lastName);
});

test("on a phone, selecting a List closes the drawer", async ({
  page,
  testData,
}) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await signInToAList(page, testData.uniqueName);

  await page.getByRole("button", { name: "Open Lists" }).click();
  const drawer = page.getByRole("dialog", { name: "My Lists" });
  await expect(drawer).toBeVisible();
  const row = drawer
    .getByRole("navigation", { name: "My Lists" })
    .getByRole("button")
    .first();
  const name = (await row.textContent()) ?? "";
  await row.click();

  await expect(drawer).toBeHidden();
  await expect(listTitle(page)).toHaveText(name);
});

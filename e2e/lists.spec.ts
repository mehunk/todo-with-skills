import { randomUUID } from "node:crypto";
import type { Page } from "@playwright/test";
import { signIn } from "./support/auth";
import { expect, test } from "./support/fixtures";

const LIST_PATH = /\/lists\/[0-9a-f-]{36}$/;

const listTitle = (page: Page) =>
  page.getByRole("main").getByRole("heading", { level: 1 });

/** The sidebar's List rows: the desktop sidebar card (not the mobile drawer). */
const sidebarLists = (page: Page) =>
  page.getByRole("navigation", { name: "My Lists" }).getByRole("button");

/**
 * After signing in at /, waits until the Owner has either been sent to a List
 * or shown the "No Lists" empty state (the shared E2E user may have no Lists
 * yet). True for the empty state.
 */
async function showsNoLists(page: Page) {
  const createFirst = page.getByRole("heading", {
    name: "Create your first List",
  });
  await expect(async () => {
    const landed =
      LIST_PATH.test(new URL(page.url()).pathname) ||
      (await createFirst.isVisible());
    expect(landed).toBe(true);
  }).toPass();
  return createFirst.isVisible();
}

test("an Owner opening / lands on a List and stays on it after a reload", async ({
  page,
  testData,
}) => {
  await page.goto("/");
  await signIn(page);

  // With no Lists yet, / shows the "No Lists" empty state instead, and
  // creating a List there must select it.
  if (await showsNoLists(page)) {
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

/**
 * Signs in and makes sure the shared E2E user has at least one List, creating
 * one from the "No Lists" empty state if needed. Ends on a List page.
 */
async function signInToAList(page: Page, uniqueName: (name: string) => string) {
  await page.goto("/");
  await signIn(page);
  if (await showsNoLists(page)) {
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
  // The shared user may have one List or many; the two-List flow with sidebar
  // create is the "creates two Lists from the sidebar" test below.
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

/** Opens the sidebar's new-List input, types `name` and presses Enter. */
async function createListFromSidebar(page: Page, name: string) {
  await page.getByRole("button", { name: "New List" }).click();
  const input = page.getByRole("textbox", { name: "List name" });
  await expect(input).toBeFocused();
  await input.fill(name);
  await input.press("Enter");
}

test("an Owner creates two Lists from the sidebar and switches between them", async ({
  page,
  testData,
}) => {
  await signInToAList(page, testData.uniqueName);
  const first = testData.uniqueName("Sidebar First");
  const second = testData.uniqueName("Sidebar Second");
  const row = (name: string) =>
    sidebarLists(page).and(page.getByRole("button", { name, exact: true }));

  // Each new List appears in the sidebar and is selected once created.
  // No Delete List yet, so these Lists stay (spec #12 Further Notes).
  await createListFromSidebar(page, first);
  await expect(listTitle(page)).toHaveText(first);
  await expect(page).toHaveURL(LIST_PATH);
  await expect(row(first)).toHaveAttribute("aria-current", "page");
  const firstUrl = page.url();

  await createListFromSidebar(page, second);
  await expect(listTitle(page)).toHaveText(second);
  await expect(page).not.toHaveURL(firstUrl);
  await expect(page).toHaveURL(LIST_PATH);
  await expect(row(second)).toHaveAttribute("aria-current", "page");
  await expect(row(first)).not.toHaveAttribute("aria-current", "page");
  const secondUrl = page.url();

  // The sidebar shows Lists in creation order: the first before the second.
  const names = await sidebarLists(page).allTextContents();
  expect(names.indexOf(first)).toBeGreaterThanOrEqual(0);
  expect(names.indexOf(first)).toBeLessThan(names.indexOf(second));

  await row(first).click();
  await expect(page).toHaveURL(firstUrl);
  await expect(listTitle(page)).toHaveText(first);
  await expect(row(first)).toHaveAttribute("aria-current", "page");

  await row(second).click();
  await expect(page).toHaveURL(secondUrl);
  await expect(listTitle(page)).toHaveText(second);

  await page.reload();
  await expect(page).toHaveURL(secondUrl);
  await expect(listTitle(page)).toHaveText(second);
  await expect(row(second)).toHaveAttribute("aria-current", "page");
});

test("the sidebar's new-List input rejects an empty name and Esc cancels it", async ({
  page,
  testData,
}) => {
  await signInToAList(page, testData.uniqueName);
  const listUrl = page.url();
  await expect(sidebarLists(page).first()).toBeVisible();

  await page.getByRole("button", { name: "New List" }).click();
  const input = page.getByRole("textbox", { name: "List name" });
  await expect(input).toBeFocused();
  await input.fill("   ");
  await input.press("Enter");
  await expect(page.getByText("Enter a List name")).toBeVisible();
  await expect(input).toBeVisible();

  // A name typed and then abandoned with Esc creates nothing.
  const abandoned = testData.uniqueName("Abandoned");
  await input.fill(abandoned);
  await input.press("Escape");
  await expect(input).toBeHidden();
  await expect(page).toHaveURL(listUrl);

  await page.reload();
  await expect(sidebarLists(page).first()).toBeVisible();
  await expect(sidebarLists(page).filter({ hasText: abandoned })).toHaveCount(
    0,
  );
});

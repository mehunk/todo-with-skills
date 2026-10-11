import { expect, type Page } from "@playwright/test";
import { signIn } from "./auth";

export const LIST_PATH = /\/lists\/[0-9a-f-]{36}$/;

/** The main card's heading: the selected List's name. */
export const listTitle = (page: Page) =>
  page.getByRole("main").getByRole("heading", { level: 1 });

/** The sidebar's List rows: the desktop sidebar card (not the mobile drawer). */
export const sidebarLists = (page: Page) =>
  page.getByRole("navigation", { name: "My Lists" }).getByRole("button");

/**
 * After signing in at /, waits until the Owner has either been sent to a List
 * or shown the "No Lists" empty state (the shared E2E user may have no Lists
 * yet). True for the empty state.
 */
export async function showsNoLists(page: Page) {
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

/**
 * Signs in and makes sure the shared E2E user has at least one List, creating
 * one from the "No Lists" empty state if needed. Ends on a List page.
 */
export async function signInToAList(
  page: Page,
  uniqueName: (name: string) => string,
) {
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

/** Opens the sidebar's new-List input, types `name` and presses Enter. */
export async function createListFromSidebar(page: Page, name: string) {
  await page.getByRole("button", { name: "New List" }).click();
  const input = page.getByRole("textbox", { name: "List name" });
  await expect(input).toBeFocused();
  await input.fill(name);
  await input.press("Enter");
}

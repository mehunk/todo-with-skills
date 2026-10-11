import type { Page } from "@playwright/test";
import { expect, test } from "./support/fixtures";
import {
  createListFromSidebar,
  listTitle,
  signInToAList,
} from "./support/lists";

/** The selected List's Todo rows, in the order shown. */
const todoRows = (page: Page) =>
  page.getByRole("list", { name: "Todos" }).getByRole("listitem");

/** The header's "N open" count. */
const openCount = (page: Page) =>
  page.getByRole("main").getByText(/^\d+ open$/);

test("an Owner Deletes one Todo; it is gone, also after a reload, and the others remain", async ({
  page,
  testData,
}) => {
  // A new, uniquely named List of this test's own (the shared E2E user's
  // other Lists may hold anything).
  await signInToAList(page, testData.uniqueName);
  const name = testData.uniqueName("Delete");
  await createListFromSidebar(page, name);
  await expect(listTitle(page)).toHaveText(name);

  const [milk, eggs, bread] = ["Milk", "Eggs", "Bread"].map((title) =>
    testData.uniqueName(title),
  );
  const addTodo = page.getByRole("textbox", { name: "Add Todo" });
  for (const title of [milk, eggs, bread]) {
    await addTodo.fill(title);
    await addTodo.press("Enter");
  }
  await expect(todoRows(page)).toHaveText([milk, eggs, bread]);
  await expect(openCount(page)).toHaveText("3 open");

  // On desktop the Delete action fades in while the row is hovered.
  await todoRows(page).filter({ hasText: eggs }).hover();
  await page.getByRole("button", { name: `Delete ${eggs}` }).click();

  await expect(todoRows(page)).toHaveText([milk, bread]);
  await expect(openCount(page)).toHaveText("2 open");

  await page.reload();
  await expect(todoRows(page)).toHaveText([milk, bread]);
  await expect(openCount(page)).toHaveText("2 open");
});

import { expect, test } from "./support/fixtures";
import { reloadWhenSaved } from "./support/saves";
import { addTodo, openCount, openNewList, todoRows } from "./support/todos";

test("an Owner Deletes one Todo; it is gone, also after a reload, and the others remain", async ({
  page,
  testData,
}) => {
  await openNewList(page, testData, "Delete");
  const [milk, eggs, bread] = ["Milk", "Eggs", "Bread"].map((title) =>
    testData.uniqueName(title),
  );
  for (const title of [milk, eggs, bread]) await addTodo(page, title);
  await expect(todoRows(page)).toHaveText([milk, eggs, bread]);
  await expect(openCount(page)).toHaveText("3 open");

  // On desktop the Delete action fades in while the row is hovered.
  await todoRows(page).filter({ hasText: eggs }).hover();
  await page.getByRole("button", { name: `Delete ${eggs}` }).click();

  await expect(todoRows(page)).toHaveText([milk, bread]);
  await expect(openCount(page)).toHaveText("2 open");

  await reloadWhenSaved(page);
  await expect(todoRows(page)).toHaveText([milk, bread]);
  await expect(openCount(page)).toHaveText("2 open");
});

test.describe("on a touch tablet", () => {
  // At least `md` wide, but a coarse pointer with no hover (docs/ui.md).
  test.use({
    viewport: { width: 1024, height: 768 },
    hasTouch: true,
    isMobile: true,
  });

  test("the Delete action is always visible, without hovering", async ({
    page,
    testData,
  }) => {
    await openNewList(page, testData, "Touch Delete");
    const milk = testData.uniqueName("Milk");
    await addTodo(page, milk);

    const deleteMilk = page.getByRole("button", { name: `Delete ${milk}` });
    await expect(deleteMilk).toHaveCSS("opacity", "1");
    await deleteMilk.tap();
    await expect(todoRows(page)).toHaveCount(0);
  });
});

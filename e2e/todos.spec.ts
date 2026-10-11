import type { Page } from "@playwright/test";
import { expect, test } from "./support/fixtures";
import {
  createListFromSidebar,
  listTitle,
  sidebarLists,
  signInToAList,
} from "./support/lists";
import type { TestData } from "./support/test-data";

/** The selected List's Todo rows, in the order shown. */
const todoRows = (page: Page) =>
  page.getByRole("list", { name: "Todos" }).getByRole("listitem");

const addTodoInput = (page: Page) =>
  page.getByRole("textbox", { name: "Add Todo" });

/** The header's "N open" count. */
const openCount = (page: Page) =>
  page.getByRole("main").getByText(/^\d+ open$/);

const emptyList = (page: Page) =>
  page.getByText("Nothing here yet. Add your first Todo.");

/**
 * Signs in and opens a new, uniquely named List of this test's own (the
 * shared E2E user's other Lists may hold anything). Returns its name.
 * No Delete List yet, so the List stays (spec #12 Further Notes).
 */
async function openNewList(page: Page, testData: TestData, label: string) {
  await signInToAList(page, testData.uniqueName);
  const name = testData.uniqueName(label);
  await createListFromSidebar(page, name);
  await expect(listTitle(page)).toHaveText(name);
  return name;
}

/** Types `title` into the Add Todo row and presses Enter. */
async function addTodo(page: Page, title: string) {
  await addTodoInput(page).fill(title);
  await addTodoInput(page).press("Enter");
}

test("an Owner adds three Todos and sees them in creation order, also after a reload", async ({
  page,
  testData,
}) => {
  await openNewList(page, testData, "Todos");
  await expect(emptyList(page)).toBeVisible();
  await expect(openCount(page)).toHaveText("0 open");

  const titles = ["Milk", "Eggs", "Bread"].map((title) =>
    testData.uniqueName(title),
  );
  for (const title of titles) {
    await addTodo(page, title);
    // Enter clears the input and keeps focus for the next Todo.
    await expect(addTodoInput(page)).toHaveValue("");
    await expect(addTodoInput(page)).toBeFocused();
  }

  await expect(todoRows(page)).toHaveText(titles);
  await expect(openCount(page)).toHaveText("3 open");
  await expect(emptyList(page)).toBeHidden();

  await page.reload();
  await expect(todoRows(page)).toHaveText(titles);
  await expect(openCount(page)).toHaveText("3 open");
});

test("an empty title shows the validation error and adds nothing", async ({
  page,
  testData,
}) => {
  await openNewList(page, testData, "Empty Title");

  await addTodoInput(page).press("Enter");
  await expect(page.getByText("Enter a Todo title")).toBeVisible();

  await addTodo(page, "   ");
  await expect(page.getByText("Enter a Todo title")).toBeVisible();
  await expect(todoRows(page)).toHaveCount(0);
  await expect(emptyList(page)).toBeVisible();
  await expect(openCount(page)).toHaveText("0 open");

  // Typing clears the error; a valid title is then added.
  const title = testData.uniqueName("Valid");
  await addTodo(page, title);
  await expect(page.getByText("Enter a Todo title")).toBeHidden();
  await expect(todoRows(page)).toHaveText([title]);
});

test("switching Lists shows only the selected List's Todos", async ({
  page,
  testData,
}) => {
  const first = await openNewList(page, testData, "First");
  const firstTodo = testData.uniqueName("First Todo");
  await addTodo(page, firstTodo);
  await expect(todoRows(page)).toHaveText([firstTodo]);

  const second = testData.uniqueName("Second");
  await createListFromSidebar(page, second);
  await expect(listTitle(page)).toHaveText(second);
  await expect(todoRows(page)).toHaveCount(0);
  await expect(emptyList(page)).toBeVisible();
  const secondTodos = [
    testData.uniqueName("Second Todo"),
    testData.uniqueName("Second Todo"),
  ];
  for (const title of secondTodos) await addTodo(page, title);
  await expect(todoRows(page)).toHaveText(secondTodos);
  await expect(openCount(page)).toHaveText("2 open");

  const row = (name: string) =>
    sidebarLists(page).and(page.getByRole("button", { name, exact: true }));

  await row(first).click();
  await expect(listTitle(page)).toHaveText(first);
  await expect(todoRows(page)).toHaveText([firstTodo]);
  await expect(openCount(page)).toHaveText("1 open");

  await row(second).click();
  await expect(listTitle(page)).toHaveText(second);
  await expect(todoRows(page)).toHaveText(secondTodos);
  await expect(openCount(page)).toHaveText("2 open");
});

/** The checkbox of the Todo titled `title`, wherever it is shown. */
const todoCheckbox = (page: Page, title: string) =>
  page.getByRole("checkbox", { name: title, exact: true });

/** The Completed section's rows, in the order shown. */
const completedRows = (page: Page) =>
  page
    .getByRole("list", { name: "Completed", exact: true })
    .getByRole("listitem");

/** The "Completed (N)" toggle. */
const completedToggle = (page: Page) =>
  page.getByRole("button", { name: /^Completed \(\d+\)$/ });

test("an Owner completes a Todo and reopens it, back in its place", async ({
  page,
  testData,
}) => {
  await openNewList(page, testData, "Complete");
  const [milk, eggs, bread] = ["Milk", "Eggs", "Bread"].map((title) =>
    testData.uniqueName(title),
  );
  for (const title of [milk, eggs, bread]) await addTodo(page, title);
  await expect(todoRows(page)).toHaveText([milk, eggs, bread]);
  // No Completed Todos: no Completed section.
  await expect(completedToggle(page)).toBeHidden();

  await todoCheckbox(page, eggs).check();
  await expect(todoRows(page)).toHaveText([milk, bread]);
  await expect(completedToggle(page)).toHaveText("Completed (1)");
  await expect(completedRows(page)).toHaveText([eggs]);
  await expect(todoCheckbox(page, eggs)).toBeChecked();
  await expect(openCount(page)).toHaveText("2 open");

  await page.reload();
  await expect(todoRows(page)).toHaveText([milk, bread]);
  await expect(completedRows(page)).toHaveText([eggs]);
  await expect(openCount(page)).toHaveText("2 open");

  await todoCheckbox(page, eggs).uncheck();
  await expect(todoRows(page)).toHaveText([milk, eggs, bread]);
  await expect(completedToggle(page)).toBeHidden();
  await expect(openCount(page)).toHaveText("3 open");

  await page.reload();
  await expect(todoRows(page)).toHaveText([milk, eggs, bread]);
  await expect(completedToggle(page)).toBeHidden();
});

test("the Completed section is expanded by default and collapses and expands", async ({
  page,
  testData,
}) => {
  await openNewList(page, testData, "Completed Section");
  const [milk, eggs] = ["Milk", "Eggs"].map((title) =>
    testData.uniqueName(title),
  );
  for (const title of [milk, eggs]) await addTodo(page, title);
  await todoCheckbox(page, milk).check();
  await todoCheckbox(page, eggs).check();

  await expect(completedToggle(page)).toHaveText("Completed (2)");
  await expect(completedToggle(page)).toHaveAttribute("aria-expanded", "true");
  await expect(completedRows(page)).toHaveText([milk, eggs]);
  await expect(openCount(page)).toHaveText("0 open");

  await completedToggle(page).click();
  await expect(completedToggle(page)).toHaveAttribute("aria-expanded", "false");
  await expect(completedRows(page)).toHaveCount(0);
  await expect(completedToggle(page)).toHaveText("Completed (2)");

  await completedToggle(page).click();
  await expect(completedToggle(page)).toHaveAttribute("aria-expanded", "true");
  await expect(completedRows(page)).toHaveText([milk, eggs]);
});

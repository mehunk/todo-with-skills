import { expect, type Page } from "@playwright/test";
import { createListFromSidebar, listTitle, signInToAList } from "./lists";
import type { TestData } from "./test-data";

/** The selected List's open Todo rows, in the order shown. */
export const todoRows = (page: Page) =>
  page.getByRole("list", { name: "Todos" }).getByRole("listitem");

/** The header's "N open" count. */
export const openCount = (page: Page) =>
  page.getByRole("main").getByText(/^\d+ open$/);

export const addTodoInput = (page: Page) =>
  page.getByRole("textbox", { name: "Add Todo" });

/**
 * Signs in and opens a new, uniquely named List of this test's own (the
 * shared E2E user's other Lists may hold anything). Returns its name.
 * No Delete List yet, so the List stays (spec #12 Further Notes).
 */
export async function openNewList(
  page: Page,
  testData: TestData,
  label: string,
) {
  await signInToAList(page, testData.uniqueName);
  const name = testData.uniqueName(label);
  await createListFromSidebar(page, name);
  await expect(listTitle(page)).toHaveText(name);
  return name;
}

/** Types `title` into the Add Todo row and presses Enter. */
export async function addTodo(page: Page, title: string) {
  await addTodoInput(page).fill(title);
  await addTodoInput(page).press("Enter");
}

/** The checkbox of the Todo titled `title`, wherever it is shown. */
export const todoCheckbox = (page: Page, title: string) =>
  page.getByRole("checkbox", { name: title, exact: true });

/**
 * Ticks or unticks the Todo titled `title`: clicks its checkbox, then waits
 * for the visible outcome. Not `check()`/`uncheck()`: the checkbox is
 * controlled by the cached List, which the optimistic update changes a tick
 * after the click, and `check()` reads the state right after clicking, so it
 * fails with "Clicking the checkbox did not change its state".
 */
export async function setTodoCompleted(
  page: Page,
  title: string,
  completed: boolean,
) {
  await todoCheckbox(page, title).click();
  if (completed) await expect(todoCheckbox(page, title)).toBeChecked();
  else await expect(todoCheckbox(page, title)).not.toBeChecked();
}

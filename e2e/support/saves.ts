import { expect, type Page, type Request } from "@playwright/test";

// Lists and Todos change optimistically: the UI shows a change before the
// server has saved it. Reloading then aborts the save still in flight, and the
// change is gone after the reload. So a test waits for the saves first.

/** Mutations are POST server functions; reads are GETs. */
const isSave = (request: Request) =>
  request.method() === "POST" &&
  new URL(request.url()).pathname.startsWith("/_serverFn/");

const pendingSaves = new WeakMap<Page, Set<Request>>();

/** Starts counting `page`'s in-flight saves (the `page` fixture does this). */
export function trackSaves(page: Page) {
  const pending = new Set<Request>();
  pendingSaves.set(page, pending);
  page.on("request", (request) => {
    if (isSave(request)) pending.add(request);
  });
  const settle = (request: Request) => pending.delete(request);
  page.on("requestfinished", settle);
  page.on("requestfailed", settle);
}

/**
 * Waits until every change shown has been saved: no Todo row is still
 * saving and no save request is in flight.
 */
export async function expectSaved(page: Page) {
  await expect(page.locator("[aria-busy=true]")).toHaveCount(0);
  const pending = pendingSaves.get(page);
  if (!pending) throw new Error("Saves aren't tracked for this page");
  await expect.poll(() => pending.size).toBe(0);
}

/** Reloads once every change shown has been saved. */
export async function reloadWhenSaved(page: Page) {
  await expectSaved(page);
  await page.reload();
}

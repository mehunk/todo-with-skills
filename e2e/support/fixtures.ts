import { test as base } from "@playwright/test";
import { trackSaves } from "./saves";
import { createTestData, type TestData } from "./test-data";

/**
 * The `test` every E2E spec imports. Counts the page's in-flight saves (for
 * `reloadWhenSaved`), and adds `testData`: unique names plus cleanup that runs
 * after the test, whether it passed or failed.
 */
export const test = base.extend<{ testData: TestData }>({
  page: async ({ page }, use) => {
    trackSaves(page);
    await use(page);
  },
  // Depends on `page` (unused here) so the page is still open while cleanup
  // steps use it.
  testData: async ({ page: _page }, use) => {
    const data = createTestData();
    await use(data);
    await data.cleanup();
  },
});

export { expect } from "@playwright/test";

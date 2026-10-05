import { test as base } from "@playwright/test";
import { createTestData, type TestData } from "./test-data";

/**
 * The `test` every E2E spec imports. Adds `testData`: unique names plus
 * cleanup that runs after the test, whether it passed or failed.
 */
export const test = base.extend<{ testData: TestData }>({
  // Depends on `page` so the page is still open while cleanup steps use it.
  testData: async ({ page }, use) => {
    void page;
    const data = createTestData();
    await use(data);
    await data.cleanup();
  },
});

export { expect } from "@playwright/test";

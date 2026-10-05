import { expect, test } from "@playwright/test";
import { createTestData } from "./support/test-data";

test.describe("test data helper", () => {
  test("names are unique and carry the label", () => {
    const data = createTestData();
    const a = data.uniqueName("Groceries");
    const b = data.uniqueName("Groceries");

    expect(a).not.toBe(b);
    expect(a).toMatch(/^e2e Groceries /);
  });

  test("cleanup runs every registered step, newest first, even when one fails", async () => {
    const data = createTestData();
    const ran: string[] = [];
    data.onCleanup(async () => {
      ran.push("first");
    });
    data.onCleanup(async () => {
      throw new Error("boom");
    });
    data.onCleanup(async () => {
      ran.push("third");
    });

    await expect(data.cleanup()).rejects.toThrow("boom");
    expect(ran).toEqual(["third", "first"]);

    // Steps run once: a second cleanup has nothing left to do.
    await data.cleanup();
    expect(ran).toEqual(["third", "first"]);
  });
});

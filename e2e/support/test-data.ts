import { randomUUID } from "node:crypto";

type CleanupStep = () => Promise<void>;

/**
 * Per-test data tracker. Tests run in parallel against one shared E2E user
 * (and, with BASE_URL, a shared deployment), so every piece of data a test
 * creates gets a unique name and a cleanup step.
 *
 * Use the `testData` fixture from `./fixtures` rather than calling this
 * directly; the fixture runs `cleanup()` after the test, pass or fail.
 */
export function createTestData() {
  const steps: CleanupStep[] = [];

  return {
    /** `e2e <label> <random>`: unique across tests, runs and machines. */
    uniqueName(label: string) {
      return `e2e ${label} ${randomUUID().slice(0, 8)}`;
    },

    /** Registers how to delete something the test just created. */
    onCleanup(step: CleanupStep) {
      steps.push(step);
    },

    /**
     * Runs every registered step once, newest first (so children go before
     * their parents). A failing step doesn't stop the others; the first
     * failure is rethrown at the end.
     */
    async cleanup() {
      const errors: unknown[] = [];
      for (let step = steps.pop(); step; step = steps.pop()) {
        try {
          await step();
        } catch (error) {
          errors.push(error);
        }
      }
      if (errors.length > 0) throw errors[0];
    },
  };
}

export type TestData = ReturnType<typeof createTestData>;

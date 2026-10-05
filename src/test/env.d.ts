/// <reference types="@cloudflare/vitest-pool-workers/types" />

// Bindings that exist only in the test runtime (see vitest.config.ts).
declare namespace Cloudflare {
  interface Env {
    TEST_MIGRATIONS: import("cloudflare:test").D1Migration[];
  }
}

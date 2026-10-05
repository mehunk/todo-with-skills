import path from "node:path";
import {
  cloudflareTest,
  readD1Migrations,
} from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

// Kept separate from vite.config.ts so the app's TanStack Start, Cloudflare
// and devtools Vite plugins don't load. Tests run inside workerd with the
// bindings from wrangler.jsonc.
export default defineConfig(async () => {
  const migrations = await readD1Migrations(
    path.join(import.meta.dirname, "migrations"),
  );

  return {
    resolve: { tsconfigPaths: true },
    plugins: [
      cloudflareTest({
        wrangler: { configPath: "./wrangler.jsonc" },
        main: "./src/test/worker.ts",
        miniflare: { bindings: { TEST_MIGRATIONS: migrations } },
      }),
    ],
    test: {
      include: ["src/**/*.test.ts"],
      setupFiles: ["./src/test/setup.ts"],
    },
  };
});

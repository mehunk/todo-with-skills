import { defineConfig } from "drizzle-kit";

// drizzle-kit only generates SQL into ./migrations; wrangler applies it
// (`npm run db:migrate:local`), and the test setup applies it to each test file's D1.
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./migrations",
});

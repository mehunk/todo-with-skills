import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

/**
 * Wraps a D1 binding in a Drizzle client. In server code pass `env.DB` from
 * `cloudflare:workers`; in tests pass the per-test-file `env.DB`.
 */
export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

export type Database = ReturnType<typeof createDb>;

// Drizzle schema: the source of truth for D1 tables. drizzle-kit diffs this
// file to generate migrations (`npm run db:generate`). Product tables arrive
// with the slices that need them; migrations must stay additive (ADR-0003).
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const lists = sqliteTable(
  "lists",
  {
    /** Random UUID, so List addresses aren't guessable or sequential. */
    id: text("id").primaryKey(),
    /** The Owner's Clerk user ID (ADR-0001). */
    ownerId: text("owner_id").notNull(),
    name: text("name").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("lists_owner_id_idx").on(table.ownerId)],
);

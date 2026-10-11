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

export const todos = sqliteTable(
  "todos",
  {
    /** Random UUID, like List IDs. */
    id: text("id").primaryKey(),
    /** No `owner_id`: a Todo's Owner is its List's Owner. */
    listId: text("list_id")
      .notNull()
      .references(() => lists.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    completed: integer("completed", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("todos_list_id_idx").on(table.listId)],
);

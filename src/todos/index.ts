import { and, asc, eq, sql } from "drizzle-orm";
import type { Database } from "#/db";
import { lists } from "#/db/schema";
import { newListSchema } from "./schemas";

export * from "./schemas";

/**
 * Creation order. Lists made in the same millisecond tie on `created_at`;
 * SQLite's implicit `rowid` grows with each insert, so it breaks the tie in
 * insertion order (a random UUID `id` would not).
 */
const creationOrder = [asc(lists.createdAt), asc(sql`rowid`)];

/** A List as the Owner sees it. */
export type List = { id: string; name: string };

/**
 * The Todos module: the single public interface (and test seam) for Lists and
 * Todos. Every operation takes the Owner (Clerk user ID, ADR-0001) first and
 * only ever reads or writes that Owner's data.
 */
export function createTodos(db: Database) {
  return {
    /** The Owner's Lists, in creation order. */
    async listLists(ownerId: string): Promise<List[]> {
      return db
        .select({ id: lists.id, name: lists.name })
        .from(lists)
        .where(eq(lists.ownerId, ownerId))
        .orderBy(...creationOrder);
    },

    /** The Owner's List; another Owner's List is reported as not found. */
    async getList(
      ownerId: string,
      listId: string,
    ): Promise<{ ok: true; list: List } | { ok: false; error: "not-found" }> {
      const list = await db
        .select({ id: lists.id, name: lists.name })
        .from(lists)
        .where(and(eq(lists.ownerId, ownerId), eq(lists.id, listId)))
        .get();
      return list ? { ok: true, list } : { ok: false, error: "not-found" };
    },

    /** Creates a List, or reports why its name is invalid. */
    async createList(
      ownerId: string,
      input: { name: string },
    ): Promise<{ ok: true; list: List } | { ok: false; error: string }> {
      const parsed = newListSchema.safeParse(input);
      if (!parsed.success) {
        return { ok: false, error: parsed.error.issues[0].message };
      }
      const list = { id: crypto.randomUUID(), name: parsed.data.name };
      await db
        .insert(lists)
        .values({ ...list, ownerId, createdAt: new Date() });
      return { ok: true, list };
    },
  };
}

export type Todos = ReturnType<typeof createTodos>;

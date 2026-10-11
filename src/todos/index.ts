import { and, asc, eq, sql } from "drizzle-orm";
import type { Database } from "#/db";
import { lists, todos } from "#/db/schema";
import { type NewTodo, newListSchema, newTodoSchema } from "./schemas";

export * from "./schemas";

/**
 * Creation order. Rows made in the same millisecond tie on `created_at`;
 * SQLite's implicit `rowid` grows with each insert, so it breaks the tie in
 * insertion order (a random UUID `id` would not).
 */
const creationOrder = (table: typeof lists | typeof todos) => [
  asc(table.createdAt),
  asc(sql`${table}.rowid`),
];

/** A List as the Owner sees it. */
export type List = { id: string; name: string };

/** A Todo as the Owner sees it. */
export type Todo = { id: string; title: string; completed: boolean };

/** A List with its Todos in creation order and how many are not Completed. */
export type ListWithTodos = List & { todos: Todo[]; openCount: number };

/** How many of `todos` are not Completed (the header's "N open"). */
export const openCount = (todos: readonly Todo[]) =>
  todos.filter((todo) => !todo.completed).length;

/** A List with its Todos, or why the operation couldn't produce one. */
export type ListWithTodosResult<E extends string = string> =
  | { ok: true; list: ListWithTodos }
  | { ok: false; error: E };

/** A Todo, or why the operation couldn't produce one. */
export type TodoResult<E extends string = string> =
  | { ok: true; todo: Todo }
  | { ok: false; error: E };

/** A List, or why the operation couldn't produce one. */
export type ListResult<E extends string = string> =
  | { ok: true; list: List }
  | { ok: false; error: E };

/**
 * The Todos module: the single public interface (and test seam) for Lists and
 * Todos. Every operation takes the Owner (Clerk user ID, ADR-0001) first and
 * only ever reads or writes that Owner's data.
 */
export function createTodos(db: Database) {
  /** The Owner's List, or undefined when it doesn't exist or isn't theirs. */
  const ownersList = (ownerId: string, listId: string) =>
    db
      .select({ id: lists.id, name: lists.name })
      .from(lists)
      .where(and(eq(lists.ownerId, ownerId), eq(lists.id, listId)))
      .get();

  return {
    /** The Owner's Lists, in creation order. */
    async listLists(ownerId: string): Promise<List[]> {
      return db
        .select({ id: lists.id, name: lists.name })
        .from(lists)
        .where(eq(lists.ownerId, ownerId))
        .orderBy(...creationOrder(lists));
    },

    /** The Owner's List; another Owner's List is reported as not found. */
    async getList(
      ownerId: string,
      listId: string,
    ): Promise<ListWithTodosResult<"not-found">> {
      const list = await ownersList(ownerId, listId);
      if (!list) return { ok: false, error: "not-found" };
      const listTodos = await db
        .select({
          id: todos.id,
          title: todos.title,
          completed: todos.completed,
        })
        .from(todos)
        .where(eq(todos.listId, listId))
        .orderBy(...creationOrder(todos));
      return {
        ok: true,
        list: { ...list, todos: listTodos, openCount: openCount(listTodos) },
      };
    },

    /** Creates a List, or reports why its name is invalid. */
    async createList(
      ownerId: string,
      input: { name: string },
    ): Promise<ListResult> {
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

    /**
     * Adds a Todo (not Completed) to the end of the Owner's List, or reports
     * why its title is invalid or that the List is not found.
     */
    async addTodo(
      ownerId: string,
      listId: string,
      input: NewTodo,
    ): Promise<TodoResult> {
      const parsed = newTodoSchema.safeParse(input);
      if (!parsed.success) {
        return { ok: false, error: parsed.error.issues[0].message };
      }
      if (!(await ownersList(ownerId, listId))) {
        return { ok: false, error: "not-found" };
      }
      const todo: Todo = {
        id: crypto.randomUUID(),
        title: parsed.data.title,
        completed: false,
      };
      await db.insert(todos).values({ ...todo, listId, createdAt: new Date() });
      return { ok: true, todo };
    },

    /**
     * Marks the Owner's Todo Completed (or reopens it); idempotent. An unknown
     * or another Owner's Todo is reported as not found and left unchanged.
     */
    async setCompleted(
      ownerId: string,
      todoId: string,
      completed: boolean,
    ): Promise<TodoResult<"not-found">> {
      const todo = await db
        .select({ id: todos.id, title: todos.title })
        .from(todos)
        .innerJoin(lists, eq(todos.listId, lists.id))
        .where(and(eq(todos.id, todoId), eq(lists.ownerId, ownerId)))
        .get();
      if (!todo) return { ok: false, error: "not-found" };
      await db.update(todos).set({ completed }).where(eq(todos.id, todoId));
      return { ok: true, todo: { ...todo, completed } };
    },
  };
}

export type Todos = ReturnType<typeof createTodos>;

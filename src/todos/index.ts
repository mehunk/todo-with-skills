import type { Database } from "#/db";

/**
 * The Todos module: the single public interface (and test seam) for Lists and
 * Todos. Operations arrive with the Personal Lists and Todos (v1) slices.
 */
export function createTodos(db: Database) {
  void db;
  return {};
}

export type Todos = ReturnType<typeof createTodos>;

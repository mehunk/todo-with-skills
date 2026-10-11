import { env } from "cloudflare:workers";
import { auth } from "@clerk/tanstack-react-start/server";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createDb } from "#/db";
import { createTodos } from "#/todos";

// Thin, authenticated server functions over the Todos module: read the Owner
// from the request's Clerk auth, call the module with `env.DB`, return plain
// data. Rules and validation live in the module, not here.

/** The signed-in Owner's Clerk user ID, or null for a signed-out visitor. */
export const fetchOwnerId = createServerFn({ method: "GET" }).handler(
  async () => (await auth()).userId,
);

async function ownerTodos() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");
  return { ownerId: userId, todos: createTodos(createDb(env.DB)) };
}

export const fetchLists = createServerFn({ method: "GET" }).handler(
  async () => {
    const { ownerId, todos } = await ownerTodos();
    return todos.listLists(ownerId);
  },
);

/**
 * The Owner's List with its Todos, or null when it doesn't exist or isn't
 * theirs.
 */
export const fetchList = createServerFn({ method: "GET" })
  .inputValidator(z.object({ listId: z.string() }))
  .handler(async ({ data }) => {
    const { ownerId, todos } = await ownerTodos();
    const result = await todos.getList(ownerId, data.listId);
    return result.ok ? result.list : null;
  });

export const createList = createServerFn({ method: "POST" })
  .inputValidator(z.object({ name: z.string() }))
  .handler(async ({ data }) => {
    const { ownerId, todos } = await ownerTodos();
    return todos.createList(ownerId, data);
  });

export const addTodo = createServerFn({ method: "POST" })
  .inputValidator(z.object({ listId: z.string(), title: z.string() }))
  .handler(async ({ data }) => {
    const { ownerId, todos } = await ownerTodos();
    return todos.addTodo(ownerId, data.listId, { title: data.title });
  });

export const setTodoCompleted = createServerFn({ method: "POST" })
  .inputValidator(z.object({ todoId: z.string(), completed: z.boolean() }))
  .handler(async ({ data }) => {
    const { ownerId, todos } = await ownerTodos();
    return todos.setCompleted(ownerId, data.todoId, data.completed);
  });

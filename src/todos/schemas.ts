import { z } from "zod";

// Shared by the Todos module (the authority) and the UI (inline errors), so
// both apply the same rules and messages. Names are trimmed before checking.

export const LIST_NAME_MAX_LENGTH = 100;

export const listNameSchema = z
  .string()
  .trim()
  .min(1, "Enter a List name")
  .max(
    LIST_NAME_MAX_LENGTH,
    `List names can be at most ${LIST_NAME_MAX_LENGTH} characters`,
  );

export const newListSchema = z.object({ name: listNameSchema });

export type NewList = z.input<typeof newListSchema>;

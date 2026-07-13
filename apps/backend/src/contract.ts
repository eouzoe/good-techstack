import { os } from "@orpc/server";
import { z } from "zod";

export const itemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string().min(1),
  content: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createItemSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
});

export const listItems = os.input(z.void()).output(z.array(itemSchema));

export const getItem = os.input(z.object({ id: z.string() })).output(itemSchema.nullable());

export const createItem = os.input(createItemSchema).output(itemSchema);

export const deleteItem = os.input(z.object({ id: z.string() })).output(z.void());

export const itemRouter = os.router({
  listItems,
  getItem,
  createItem,
  deleteItem,
});

import { os } from "@orpc/server";
import { z } from "zod";

export const itemSchema = z.object({
  content: z.string().optional(),
  createdAt: z.string(),
  id: z.string(),
  title: z.string().min(1),
  updatedAt: z.string(),
  userId: z.string(),
});

export const createItemSchema = z.object({
  content: z.string().optional(),
  title: z.string().min(1),
});

export const listItems = os.input(z.void()).output(z.array(itemSchema));

export const getItem = os.input(z.object({ id: z.string() })).output(itemSchema.nullable());

export const createItem = os.input(createItemSchema).output(itemSchema);

export const deleteItem = os.input(z.object({ id: z.string() })).output(z.void());

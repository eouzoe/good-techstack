import { desc, eq } from "drizzle-orm";
import { os } from "@orpc/server";
import { createItem, deleteItem, getItem, listItems } from "./contract";
import { items } from "./db/schema";
import type { Database } from "./db";

function genId(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

function mapRow(row: typeof items.$inferSelect) {
  return {
    content: row.content ?? undefined,
    createdAt: row.createdAt,
    id: row.id,
    title: row.title,
    updatedAt: row.updatedAt,
    userId: row.userId,
  };
}

interface Ctx { db: Database; user?: { id: string } }

export const itemHandler = os.router({
  createItem: createItem.handler(async ({ input, context }) => {
    const { db, user } = context as Ctx;
    if (!user) throw new Error("Unauthorized");
    const id = genId();
    const ts = now();
    await db
      .insert(items)
      .values({
        id,
        userId: user.id,
        title: input.title,
        content: input.content ?? null,
        createdAt: ts,
        updatedAt: ts,
      })
      .run();
    return {
      id,
      userId: user.id,
      title: input.title,
      content: input.content,
      createdAt: ts,
      updatedAt: ts,
    };
  }),

  deleteItem: deleteItem.handler(async ({ input, context }) => {
    const { db } = context as Ctx;
    await db.delete(items).where(eq(items.id, input.id)).run();
  }),

  getItem: getItem.handler(async ({ input, context }) => {
    const { db } = context as Ctx;
    const row = await db.select().from(items).where(eq(items.id, input.id)).limit(1).get();
    return row ? mapRow(row) : null;
  }),

  listItems: listItems.handler(async ({ context }) => {
    const { db, user } = context as Ctx;
    if (!user) return [];
    const rows = await db
      .select()
      .from(items)
      .where(eq(items.userId, user.id))
      .orderBy(desc(items.createdAt))
      .all();
    return rows.map(mapRow);
  }),
});

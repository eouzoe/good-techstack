import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const items = sqliteTable(
  "items",
  {
    content: text("content"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    userId: text("user_id").notNull(),
  },
  (table) => [index("idx_items_user_id").on(table.userId)],
);

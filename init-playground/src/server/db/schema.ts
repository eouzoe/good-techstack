import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

const features = sqliteTable('features', {
  description: text('description').notNull(),
  icon: text('icon').notNull(),
  id: integer('id').primaryKey({ autoIncrement: true }),
  sortOrder: integer('sort_order').default(0),
  title: text('title').notNull(),
});

const techs = sqliteTable('techs', {
  description: text('description').notNull(),
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  sortOrder: integer('sort_order').default(0),
  url: text('url').notNull(),
  version: text('version').notNull(),
});

const visitCounters = sqliteTable('visit_counters', {
  counter: integer('counter').notNull().default(0),
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
});

export { features, techs, visitCounters };

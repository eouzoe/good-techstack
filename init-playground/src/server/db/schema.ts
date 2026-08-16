import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

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

const currentTimestampMs = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

const user = sqliteTable('user', {
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).default(currentTimestampMs).notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false).notNull(),
  id: text('id').primaryKey(),
  image: text('image'),
  name: text('name').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .default(currentTimestampMs)
    .$onUpdate(() => new Date())
    .notNull(),
});

const session = sqliteTable(
  'session',
  {
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(currentTimestampMs)
      .notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    id: text('id').primaryKey(),
    ipAddress: text('ip_address'),
    token: text('token').notNull().unique(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .$onUpdate(() => new Date())
      .notNull(),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [index('session_userId_idx').on(table.userId)],
);

const account = sqliteTable(
  'account',
  {
    accessToken: text('access_token'),
    accessTokenExpiresAt: integer('access_token_expires_at', {
      mode: 'timestamp_ms',
    }),
    accountId: text('account_id').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(currentTimestampMs)
      .notNull(),
    id: text('id').primaryKey(),
    idToken: text('id_token'),
    issuer: text('issuer').notNull(),
    password: text('password'),
    providerId: text('provider_id').notNull(),
    refreshToken: text('refresh_token'),
    refreshTokenExpiresAt: integer('refresh_token_expires_at', {
      mode: 'timestamp_ms',
    }),
    scope: text('scope'),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .$onUpdate(() => new Date())
      .notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [
    uniqueIndex('account_issuer_accountId_uidx').on(table.issuer, table.accountId),
    index('account_userId_idx').on(table.userId),
  ],
);

const verification = sqliteTable(
  'verification',
  {
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(currentTimestampMs)
      .notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(currentTimestampMs)
      .$onUpdate(() => new Date())
      .notNull(),
    value: text('value').notNull(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)],
);

export { account, features, session, techs, user, verification, visitCounters };

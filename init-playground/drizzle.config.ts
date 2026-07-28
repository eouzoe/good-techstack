import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dbCredentials: {
    url: process.env.LOCAL_DB_PATH ?? 'gstack.db',
  },
  dialect: 'sqlite',
  out: './drizzle',
  schema: './src/server/db/schema.ts',
});

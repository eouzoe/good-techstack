-- Idempotent seed for the live (remote) D1 database.
-- Usage:
--   secretspec run --scope deploy -- bunx wrangler d1 execute <database-name> --remote --file=cli/seed-live.sql
-- <database-name> lives in .alchemy/state/gstack/<profile>/DB.json → attr.databaseName
DELETE FROM features;
DELETE FROM techs;

INSERT INTO features (title, description, icon, sort_order) VALUES
('Bun', 'Runtime, package manager, test runner', '🚀', 1),
('Hono + oRPC', 'Type-safe HTTP and RPC layer', '🔗', 2),
('Drizzle ORM + D1', 'Serverless SQLite', '🗄️', 3),
('better-auth', 'Auth with email, OAuth, SSO', '🔐', 4),
('TanStack Start', 'SSR with React', '⚛️', 5),
('Vite', 'Lightning-fast build tool', '⚡', 6);

INSERT INTO techs (name, description, url, version, sort_order) VALUES
('Valibot', 'Modular schema validation', 'https://valibot.dev', '1.4', 1),
('LogTape', 'Structured logging', 'https://logtape.org', '2.2', 2),
('Tailwind CSS', 'Utility-first CSS', 'https://tailwindcss.com', '4', 3);
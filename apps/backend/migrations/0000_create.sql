-- Better Auth 所需的 D1 schema（SQLite dialect）
-- 由 better-auth 原生 D1 支援自動偵測，不需手動 create table
-- better-auth 1.5+ 會在首次執行時自動建立表格

-- 應用層表格範例
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);

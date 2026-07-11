# Auth: better-auth

> depends_on: [01-api.md, 02-db.md, 05-schema.md]
> tags: [auth, session, oauth, security]
> 最後更新：2026-07-10

## 版本

- stable v1.6.23
- RC v1.7.0-rc.1 (2026-07)
- 2025-09 接管 Auth.js (NextAuth) 維護

## Vercel 收購 (2026-07-07)

4.7M 週下載、$5M seed/YC。Bereket Engida 加入 Vercel。

- 目標：做「Agent Auth」協議 (MCP 認證、AI agent identity)
- 開源不變、framework/platform agnostic
- 收購後推出 MCP plugin package: `better-auth/plugins/mcp`
- CF/D1 適配不受影響

## Plugin-based 架構

支援多 adapter (D1、Prisma、Drizzle 等)，含 session/email/oauth/sso。

### 與 Drizzle 共存

Auth 表格由 better-auth 自動管理（不需手動 schema），應用表格由 Drizzle 管理。Migration 各自獨立。

## 官方文件

https://better-auth.com

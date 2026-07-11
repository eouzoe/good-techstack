# Auth: better-auth

> depends_on: [01-api.md, 02-db.md, 05-schema.md]
> tags: [auth, session, oauth, security]
> Last updated: 2026-07-10

## Version

- stable v1.6.23
- RC v1.7.0-rc.1 (2026-07)
- Adopted Auth.js (NextAuth) maintenance in 2025-09

## What it provides

- Email and password authentication
- OAuth (Google, GitHub, etc.)
- SSO
- Session management
- MCP plugin package: `better-auth/plugins/mcp`

## Plugin architecture

Supports multiple adapters (D1, Prisma, Drizzle, etc.) with session, email, OAuth, and SSO.

Auth tables are managed by better-auth automatically. Application tables are managed by Drizzle. Migrations are independent.

## Official docs

https://better-auth.com

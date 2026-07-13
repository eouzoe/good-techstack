# Agent Bootstrap — New Project

> This is the first prompt you receive when starting a good-techstack project.
> Read this entire file before taking any action.
> Follow these steps in order. Do not skip or reorder.

## Your role

You are building a new web product with the user. The user may have no technical background. Guide them step by step. Be patient. Be clear.

The user ran a single command. Now you take over.

---

## Step 1 — Welcome

Introduce yourself. Tell the user you will help them:

1. Set up a Cloudflare account (free, takes 2 minutes)
2. Finish setting up the development environment
3. Discuss their product idea
4. Build it together

Ask: "Ready to start?"

---

## Step 2 — Cloudflare account

Ask: "Do you have a Cloudflare account?"

> Use Playwright or Chrome DevTools MCP to automate browser operations when possible. If the MCP tools are available, use them. If not, guide manually.

### If they have an account:

Guide them to create an API token:

1. Open https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use the "Workers:Edit" template
4. Copy the token
5. Save it: `mkdir -p ~/.cloudflare && echo "TOKEN" > ~/.cloudflare/mcp-token`

> Use browser automation (Playwright MCP) to navigate to the API tokens page if possible. The user still needs to copy the token manually.

### If they do NOT have an account:

1. Open https://dash.cloudflare.com/signup using browser automation
2. Guide the user through:
   - Entering their email
   - Creating a password
   - Checking email for verification link
3. After signup, guide API token creation as above

> After the token is saved, verify: `cat ~/.cloudflare/mcp-token` should show a non-empty string.

---

## Step 3 — Finish setup

Run: `sh scripts/start.sh`

This installs the toolchain (Bun, Node, linter) and JS dependencies. It may take a minute.

If it fails, read the error and try to fix it. If you cannot fix it, explain the issue to the user and ask for help.

---

## Step 4 — Read the scaffold protocol

Read `docs/agent/scaffolding.md` carefully. This defines how to discover the user's product idea and generate code.

---

## Step 5 — Product discovery

Start the Q&A protocol from the scaffold skill.

Walk through all 7 questions in order. Do not skip any. Do not assume answers.

---

## Step 6 — Entity map review (FORCED)

After the Q&A, produce the entity map (Phase 2 of the scaffold protocol).

**Do not generate any code yet.**

Present the entity map to the user and say:

> "Here is my understanding of your product. Please review it carefully."
> "Type 'I confirm' to proceed, or tell me what to change."

You must wait for the exact phrase "I confirm" (or "我確認" / "確認"). Do not accept "yes", "ok", "looks good", or any variation. Only the exact confirmation phrase.

If the user requests changes, update the entity map and ask for confirmation again.

---

## Step 7 — Code generation

Follow the scaffold protocol's Phase 3 exactly. Generate files in this order:

1. Zod schemas → `packages/shared/src/`
2. Drizzle tables → `apps/backend/src/db/schema/`
3. oRPC routes → `apps/backend/src/routes/`
4. Frontend pages (stubs) → `apps/frontend/src/routes/`
5. Auth roles → `apps/backend/src/auth/roles.ts`

After each step, run `devenv shell -- tsc --noEmit`. If it passes, continue. If it fails, fix before proceeding.

---

## Step 8 — Final verification

Run: `devenv shell -- bun test --filter "smoke|contract"`

If tests pass, present the file tree to the user:

```
packages/shared/src/   → 3 schema files
apps/backend/src/db/   → 2 table files
apps/backend/src/routes/ → 3 route files
apps/frontend/src/     → 4 page stubs
```

Ask: "This is your product scaffold. Shall I deploy it?"

Only deploy if the user confirms. Use `devenv shell -- bunx wrangler deploy` for the backend.

---

## Rules

1. **Never generate code without entity map confirmation.** The user must type "I confirm" first.
2. **Never skip verification.** Always run `devenv shell -- tsc --noEmit` after code generation.
3. **If a step fails, explain the problem before trying to fix it.**
4. **Do not assume the user knows technical terms.** Explain as you go.
5. **If you cannot complete a step after 3 attempts, stop and ask for human help.**

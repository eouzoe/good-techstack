# Scaffolding

A structured protocol for the AI agent to discover the user's business requirements and generate the corresponding application scaffold.

---

## Prerequisites

- Stack is set up (`bun install` completed)
- Agent has read `reference/design-decisions.md` and the relevant `reference/*.md` files
- Directories `packages/shared/src/` and `apps/backend/src/` exist

## Phase 1: Discovery (Q&A)

Walk through these questions in order. Do not skip questions. Do not assume answers without asking.

### Q1 — One-line description

Ask: "Describe your product in one sentence."

If the answer is vague, follow up: "Who is it for, and what is the main thing it helps them do?"

### Q2 — User roles

Ask: "Who uses this product? What types of users are there?"

If unsure, suggest: "Most products start with 'user' and 'admin'. Does that work for you?"

### Q3 — Core entities

Ask: "What are the main things your product works with? For example, a task manager has projects and tasks."

For each entity, ask: "What fields does it have?" Record names, types, and which are required.

### Q4 — Relationships

Ask: "How do these entities relate to each other?"

Listen for: one-to-many, many-to-many, optional. Draw a connection for each pair.

### Q5 — Actions

Ask: "What can each type of user do?" (create, read, update, delete, approve, assign, etc.)

### Q6 — Integrations

Ask: "Does this need to connect to anything external?" (email, payments, Slack, GitHub, etc.)

For each integration, record the trigger direction (inbound, outbound, or both).

### Q7 — UI hints

Ask: "What pages do you imagine? What is the main screen users see when they log in?"

Record a rough page list. This is not a commitment—it helps the frontend scaffold.

## Phase 2: Entity Map

After the Q&A, produce a structured entity map in this format:

```json
{
  "entities": [
    {
      "name": "Project",
      "fields": [
        { "name": "id", "type": "string", "key": true },
        { "name": "name", "type": "string" },
        { "name": "ownerId", "type": "string", "reference": "User" }
      ]
    }
  ],
  "relationships": [{ "from": "User", "to": "Project", "type": "hasMany" }],
  "actions": [
    {
      "role": "user",
      "entity": "Project",
      "actions": ["create", "read", "update"]
    }
  ],
  "integrations": [],
  "pages": ["/dashboard", "/projects"]
}
```

### Confirmation (Forced Review)

Present the entity map to the user and say:

> "Here is my understanding of your product. Please review it carefully."
> "Type 'I confirm' to proceed, or tell me what to change."

**Rules:**

- Wait for the exact phrase `I confirm` (or `我確認` / `確認`).
- Do not accept `yes`, `ok`, `looks good`, `y`, or any variation.
- If the user requests changes, update the entity map and ask again.
- Only after receiving the exact confirmation may you proceed.

## Phase 3: Code Generation

Generate files in this order. After each step, verify before continuing.

### 1. Zod schemas

`packages/shared/src/<entity>.schema.ts`

One file per entity with create, update, and response types. Use Zod v4 syntax.

### 2. Drizzle tables

`apps/backend/src/db/schema/<entity>.ts`

Derive field types from Zod schemas. Use `references()` for foreign keys. Generate a migration.

### 3. oRPC routes

`apps/backend/src/routes/<entity>.ts`

One file per entity group. Each route must have an oRPC contract (input/output schema).

### 4. Frontend stubs

`apps/frontend/src/routes/<entity>/`

List page, detail page, create/edit form, and route registration.

### 5. Auth roles

`apps/backend/src/auth/roles.ts`

Permission mapping based on the entity map's `actions` field. Apply middleware to routes.

### Deployment confirmation (Forced Review)

After code generation, present the deployment plan:

> "The code is ready. Type 'Deploy' to deploy to production."

Wait for the exact word `Deploy` (or `部署`) before proceeding.

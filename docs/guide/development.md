# Development

Daily development workflow, commands, and conventions.

---

## Prerequisites

```bash
devenv shell        # Enter the development environment
devenv shell -- bun install   # Install JavaScript dependencies
```

## Dev Server

```bash
just dev             # Start backend + frontend dev servers
```

## Type Checking

```bash
just typecheck      # devenv shell -- tsc --noEmit
```

## Linting

```bash
just lint            # devenv shell -- oxlint --type-aware
```

## Testing

```bash
just test            # devenv shell -- bun test
devenv shell -- bun test --watch   # TDD mode
devenv shell -- vitest run         # Integration tests (workerd)
devenv shell -- bunx playwright test   # E2E tests (requires wrangler dev)
```

## Database

```bash
devenv shell -- bunx wrangler d1 migrations create <name>    # Create a new migration
devenv shell -- bunx wrangler d1 migrations apply <name>     # Apply migrations locally
```

## Binding Types

```bash
devenv shell -- bunx wrangler types     # Generate TypeScript types for Cloudflare bindings
```

## Full CI Gate

Before pushing, run the same checks CI will run:

```bash
just lint             # oxlint --type-aware
just typecheck        # tsc --noEmit
just test             # bun test
devenv shell -- vitest run
```

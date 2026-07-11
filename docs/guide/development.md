# Development

Daily development workflow, commands, and conventions.

---

## Prerequisites

```bash
nix develop       # Enter the Nix development shell
bun install        # Install JavaScript dependencies
```

## Dev Server

```bash
bun run dev        # Start the HMR development server
```

## Type Checking

```bash
tsc --noEmit       # TypeScript type checking (bun does not type-check)
```

## Linting

```bash
oxlint --type-aware
```

## Testing

```bash
bun test                # Unit, contract, and property tests
bun test --watch        # TDD mode
vitest run              # Integration tests (workerd)
bunx playwright test    # E2E tests (requires wrangler dev)
```

## Database

```bash
bunx wrangler d1 migrations create <name>    # Create a new migration
bunx wrangler d1 migrations apply <name>     # Apply migrations locally
```

## Binding Types

```bash
bunx wrangler types     # Generate TypeScript types for Cloudflare bindings
```

## Full CI Gate

Before pushing, run the same checks CI will run:

```bash
oxlint --type-aware
tsc --noEmit
bun test
vitest run
```

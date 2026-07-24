# TypeScript

How we write TypeScript in this project. Covers configuration, patterns, and pitfalls regardless of the current TypeScript version.

---

## Configuration

`tsconfig.json` must be explicit. No inferred defaults.

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

These flags eliminate entire categories of runtime errors at compile time. Do not relax them.

## Patterns

### Prefer Zod inference over manual types

```typescript
const UserSchema = z.object({ id: z.string(), name: z.string() });
type User = z.infer<typeof UserSchema>; // ✓
// type User = { id: string; name: string }  // ✗ manually maintained
```

### Use branded types for IDs

```typescript
type UserId = string & { readonly __brand: "UserId" };
type PostId = string & { readonly __brand: "PostId" };
```

This prevents passing the wrong ID to a function at compile time.

### Prefer `const` assertions for literals

```typescript
const ROLES = ["admin", "user"] as const;
type Role = (typeof ROLES)[number];
```

### Handle `unknown` explicitly

```typescript
function safeParse(input: unknown): Result {
  const parsed = UserSchema.safeParse(input);
  // never cast with `as` when parsing external data
}
```

## Pitfalls

### `types` defaults to `[]` in recent TypeScript

If `types` is not set in `tsconfig.json`, TypeScript may not include `@types/*` packages. Always set it explicitly:

```json
{
  "compilerOptions": {
    "types": ["@cloudflare/workers-types"]
  }
}
```

### `rootDir` defaults to `.`

This can cause unexpected output paths. Set it explicitly to `"src"`.

### `tsc` vs `bun` for type checking

`bun` does not type-check. Use `devenv shell -- tsc --noEmit` for type checking, `bun` for execution.

### No compiler API in the current TypeScript

If TypeScript has no stable compiler API (common in major version bumps after a rewrite), tools like `typescript-eslint` or `Volar` will not work. oxlint is unaffected because it uses its own AST.

## Version management

Check the current TypeScript version:

```bash
npm view typescript version
```

If upgrading TypeScript, update `tsconfig.json` to account for any new defaults or removed flags. Verify with `devenv shell -- tsc --noEmit` before committing.

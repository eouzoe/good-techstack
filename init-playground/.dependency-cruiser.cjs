/* Architecture rules for init-playground/src (dependency-cruiser).
 *
 * Enforced shape (Phase E, zero-trust pipeline):
 *   Shared       — contract leaf (valibot + @orpc/contract only)
 *   Lib          — utility leaf
 *   Server       — infra + assembly (services, db, os; orpc/rpc consume routers)
 *   Procedures   — contract implementations (shared + server/services)
 *   Routers      — generated composition of procedures
 *   Client/components/routes — UI; routes additionally call server functions
 *   Verification — standalone kernel; bench — server-only harness
 *
 * Every rule is baseline-green: it encodes today's real graph, so a new
 * violating edge is a regression rather than a cleanup backlog.
 *
 * TypeScript 7 (the native port) ships without a JS compiler API, which
 * dependency-cruiser cannot consume yet — the default tsc parser silently
 * cruises zero modules. Parse through swc instead and resolve with explicit
 * enhanced-resolve settings; scripts/arch-selftest.ts proves the gate still
 * catches a synthetic violation.
 */

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      comment: 'Runtime cycles make the module graph impossible to reason about.',
      from: {},
      // Allow cycles that only close through erased type-only edges.
      name: 'no-circular',
      severity: 'error',
      to: { circular: true, viaOnly: { dependencyTypesNot: ['type-only'] } },
    },
    {
      comment: 'src/shared is the contract layer: external packages and itself only.',
      from: { path: '^src/shared/' },
      name: 'contracts-are-a-leaf',
      severity: 'error',
      to: {
        dependencyTypesNot: ['type-only'],
        path: '^src/(procedures|routers|server|client|components|routes|verification|bench)/',
      },
    },
    {
      comment:
        'Procedures use shared contracts and server services — never UI, routers, or the kernel.',
      from: { path: '^src/procedures/' },
      name: 'procedures-depend-downwards',
      severity: 'error',
      to: {
        dependencyTypesNot: ['type-only'],
        path: '^src/(routers|client|components|routes|verification|bench)/',
      },
    },
    {
      comment: 'Routers compose procedures; they never reach into UI or the kernel.',
      from: { path: '^src/routers/' },
      name: 'routers-are-composition-only',
      severity: 'error',
      to: {
        dependencyTypesNot: ['type-only'],
        path: '^src/(client|components|routes|verification|bench)/',
      },
    },
    {
      comment: 'Server internals never reach into UI layers or the verification kernel.',
      from: { path: '^src/server/' },
      name: 'server-stays-server-side',
      severity: 'error',
      to: {
        dependencyTypesNot: ['type-only'],
        path: '^src/(client|components|routes|procedures|verification|bench)/',
      },
    },
    {
      comment:
        'Browser code reaches the server through contracts / server functions, never by importing server modules.',
      from: { path: '^src/(client|components)/' },
      name: 'frontend-via-contracts-and-server-functions',
      severity: 'error',
      to: {
        dependencyTypesNot: ['type-only'],
        path: '^src/(server|procedures|routers|routes|verification|bench)/',
      },
    },
    {
      comment:
        'Route modules consume UI components and server-function modules, not internal plumbing.',
      from: { path: '^src/routes/' },
      name: 'routes-touch-ui-and-server-functions',
      severity: 'error',
      to: {
        dependencyTypesNot: ['type-only'],
        path: '^src/(procedures|routers|verification|bench)/',
      },
    },
    {
      comment: 'The verification kernel stays reproducible: no app-specific imports.',
      from: { path: '^src/verification/' },
      name: 'verification-is-standalone',
      severity: 'error',
      to: {
        dependencyTypesNot: ['type-only'],
        path: '^src/(shared|server|procedures|routers|client|components|routes|bench)/',
      },
    },
    {
      comment: 'Benchmarks may drive server internals, never the UI layers.',
      from: { path: '^src/bench/' },
      name: 'bench-drives-the-server-only',
      severity: 'error',
      to: {
        dependencyTypesNot: ['type-only'],
        path: '^src/(client|components|routes|procedures|routers)/',
      },
    },
    {
      comment: 'Dead import specifiers are drift; every import must resolve.',
      from: {},
      name: 'not-to-unresolvable',
      severity: 'error',
      to: { couldNotResolve: true, pathNot: '(^url:|^cloudflare:|^bun:|^node:|\\?url$)' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    // Keep bare specifiers resolvable (effect, @orpc/*, better-auth/*, …).
    enhancedResolveOptions: {
      conditionNames: ['import', 'require', 'node', 'default'],
      exportsFields: ['exports'],
      mainFields: ['module', 'main'],
    },
    // Stand in for the missing TypeScript 7 compiler API.
    parser: 'swc',
    tsConfig: { fileName: 'tsconfig.json' },
    // Keep type-only edges in the graph; the rules filter on that tag.
    tsPreCompilationDeps: true,
  },
};

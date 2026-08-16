import { type InferRouterContractOutputs } from '@orpc/contract';

import { type contract } from '#shared/contracts/index';

/// Mock data for UI development. Same contract types as the real procedures,
/// so the UI can be built and reviewed before the backend wiring exists.
/// Mirrors `cli/seed.ts` so the rendered page matches seeded output.
const mockFeatures: InferRouterContractOutputs<typeof contract>['info']['features'] = [
  { description: 'Runtime, package manager, test runner', icon: '🚀', title: 'Bun' },
  { description: 'Type-safe HTTP and RPC layer', icon: '🔗', title: 'Hono + oRPC' },
  { description: 'Serverless SQLite', icon: '🗄️', title: 'Drizzle ORM + D1' },
  { description: 'Auth with email, OAuth, SSO', icon: '🔐', title: 'better-auth' },
  { description: 'SSR with React', icon: '⚛️', title: 'TanStack Start' },
  { description: 'Lightning-fast build tool', icon: '⚡', title: 'Vite' },
];

const mockTechs: InferRouterContractOutputs<typeof contract>['info']['techs'] = [
  {
    description: 'Modular schema validation',
    name: 'Valibot',
    url: 'https://valibot.dev',
    version: '1.4',
  },
  {
    description: 'Structured logging',
    name: 'LogTape',
    url: 'https://logtape.org',
    version: '2.2',
  },
  {
    description: 'Utility-first CSS',
    name: 'Tailwind CSS',
    url: 'https://tailwindcss.com',
    version: '4',
  },
];

export { mockFeatures, mockTechs };

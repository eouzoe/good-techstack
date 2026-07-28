import { createServerFn } from '@tanstack/react-start';
import { env } from 'cloudflare:workers';

import { mockFeatures, mockTechs } from './mocks';
import { getServerClient } from './orpc';

const useMocks = (): boolean => {
  const flag: string = env.USE_MOCKS;
  return flag === 'true';
};

/// Data boundary — the only place that knows whether UI data comes from real
/// oRPC procedures or mock data. Feature components and routes stay agnostic:
/// flip `USE_MOCKS=true` to build UI before the backend is wired, then remove
/// the flag to talk to the real stack. Nothing else changes.
const loadFeatures = createServerFn().handler(() => {
  if (useMocks()) {
    return mockFeatures;
  }
  const orpc = getServerClient();
  return orpc.info.features();
});

const loadTechs = createServerFn().handler(() => {
  if (useMocks()) {
    return mockTechs;
  }
  const orpc = getServerClient();
  return orpc.info.techs();
});

export { loadFeatures, loadTechs };

import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import { type RouterContractClient } from '@orpc/contract';

import { type contract } from '#shared/contracts/index';

const link = new RPCLink({
  url: '/api/rpc',
});

export const orpc: RouterContractClient<typeof contract> = createORPCClient(link);

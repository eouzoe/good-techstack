import { COMMON_ERROR_STATUS_MAP, ORPCError } from '@orpc/server';
import { RPCHandler } from '@orpc/server/fetch';
import { CORSHandlerPlugin, RequestHeadersHandlerPlugin } from '@orpc/server/plugins';
import { tracing } from 'cloudflare:workers';
import { setGlobalConfig } from 'valibot';

import { appRouter } from '../routers/_app';
import { type AppEnv } from './env';
import { logger } from './logging';
import { effectContext } from './os';

setGlobalConfig({ abortEarly: true, abortPipeEarly: true });

const SERVER_ERROR_STATUS_MIN = 500;
const STATUS_BY_CODE: Record<string, number | undefined> = { ...COMMON_ERROR_STATUS_MAP };

const errorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

const isExpectedError = (error: unknown): error is ORPCError<string, unknown> => {
  if (!(error instanceof ORPCError) || typeof error.code !== 'string') {
    return false;
  }
  const status = STATUS_BY_CODE[error.code];
  return status !== undefined && status < SERVER_ERROR_STATUS_MIN;
};

/// Unexpected errors (5xx, uncaught throws) are traced and logged as errors.
/// Expected errors (validation, typed errors, 4xx) are part of the RPC contract:
/// the client receives them in-band, so the server only logs them at debug level.
const traceError = (span: InstanceType<typeof tracing.Span>, error: unknown): void => {
  if (isExpectedError(error)) {
    logger.debug('RPC error', { code: error.code, message: error.message });
  } else {
    span.setAttribute('error.message', errorMessage(error));
    span.setAttribute('error.type', 'unexpected');
    logger.error('Unhandled RPC error', { error: errorMessage(error) });
  }
};

const rpcHandler = new RPCHandler(appRouter, {
  interceptors: [
    (options) =>
      tracing.enterSpan('server.rpc', async (span) => {
        span.setAttribute('rpc.path', options.path.join('/'));
        try {
          const result = await options.next();
          span.setAttribute('rpc.status', 'success');
          return result;
        } catch (error) {
          span.setAttribute('rpc.status', 'error');
          traceError(span, error);
          throw error;
        }
      }),
  ],
  plugins: [new CORSHandlerPlugin({ credentials: true }), new RequestHeadersHandlerPlugin()],
});

/// RPC boundary: serves the oRPC router under `/api/rpc`.
/// `matched: false` means the path is not part of the router — return 404 here
/// instead of letting oRPC fall through (see fetch adapter docs).
export const handleRPC = async (request: Request, env: AppEnv): Promise<Response> => {
  const { matched, response } = await rpcHandler.handle(request, {
    context: { 'effect/context': effectContext(env), env },
    prefix: '/api/rpc',
  });
  if (matched) {
    return response;
  }
  return new Response('Not Found', { status: 404 });
};

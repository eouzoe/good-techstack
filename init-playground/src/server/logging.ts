import { AsyncLocalStorage } from 'node:async_hooks';

import {
  configureSync,
  drain,
  getConsoleSink,
  getJsonLinesFormatter,
  getLogger,
  withContext,
  type LogLevel,
  type Sink,
} from '@logtape/logtape';

/// Structured logging (OBSERVABILITY Phase A): one configuration point for the
/// whole Worker, plus the request boundary that gives every line an id.
///
/// - Production emits JSON lines, which Cloudflare Workers Logs indexes by
///   field without extra parsing; dev keeps the human-readable console format.
/// - The level floor is `debug` in dev and `info` in production.
/// - `serveWithRequestLog` mints (or forwards) one request id per request and
///   binds it into LogTape's context-local storage, so RPC errors, auth
///   warnings and SSR logs correlate without threading the id through call
///   signatures. The id is echoed as `x-request-id` for cross-system alignment.
///
/// `reset: true` keeps re-evaluation (Vite HMR) idempotent.

const isProduction = import.meta.env.PROD;

const REQUEST_ID_HEADER = 'x-request-id';

const contextLocalStorage = new AsyncLocalStorage<Record<string, unknown>>();

let consoleSink: Sink = getConsoleSink();
let lowestLevel: LogLevel = 'debug';
if (isProduction) {
  consoleSink = getConsoleSink({ formatter: getJsonLinesFormatter() });
  lowestLevel = 'info';
}

// oxlint-disable-next-line node/no-sync -- configureSync is logtape's synchronous init API; there is no async equivalent for module-scope setup. reset keeps re-evaluation (Vite HMR) idempotent.
configureSync({
  contextLocalStorage,
  loggers: [
    // Mute the meta logger's onboarding note; sink-failure warnings still come through.
    { category: ['logtape', 'meta'], lowestLevel: 'warning', sinks: ['console'] },
    { category: ['gstack'], lowestLevel, sinks: ['console'] },
  ],
  reset: true,
  sinks: { console: consoleSink },
});

const logger = getLogger('gstack');
const requestLogger = getLogger(['gstack', 'request']);

const errorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

const requestIdFor = (request: Request): string =>
  request.headers.get(REQUEST_ID_HEADER) ?? crypto.randomUUID();

/// Immutable response headers (a `fetch` passthrough) would throw on set; the
/// echo is best-effort and must never turn a request into a failure.
const attachRequestId = (response: Response, requestId: string): void => {
  try {
    response.headers.set(REQUEST_ID_HEADER, requestId);
  } catch {
    requestLogger.debug('Response headers did not accept {header}', {
      header: REQUEST_ID_HEADER,
      requestId,
    });
  }
};

/// Fetch-boundary wrapper: every branch of the Worker entry runs inside it, so
/// one request produces one correlated request line — or one correlated error
/// line if the handler throws — and `drain()` flushes pending sink output
/// before the isolate can be torn down.
///
/// Only `waitUntil` is required from the execution context, so tests can pass
/// a plain object instead of a full `ExecutionContext`.
const serveWithRequestLog = async (
  request: Request,
  context: Pick<ExecutionContext, 'waitUntil'>,
  handler: () => Promise<Response> | Response,
): Promise<Response> => {
  const requestId = requestIdFor(request);
  const startedAt = performance.now();
  const path = new URL(request.url).pathname;
  const cfRay = request.headers.get('cf-ray') ?? '';

  try {
    return await withContext({ requestId }, async () => {
      try {
        const response = await handler();
        attachRequestId(response, requestId);
        requestLogger.info('{method} {path} -> {status} in {durationMs}ms', {
          cfRay,
          durationMs: Math.round(performance.now() - startedAt),
          method: request.method,
          path,
          status: response.status,
        });
        return response;
      } catch (error) {
        requestLogger.error('{method} {path} threw after {durationMs}ms', {
          cfRay,
          durationMs: Math.round(performance.now() - startedAt),
          error: errorMessage(error),
          method: request.method,
          path,
        });
        throw error;
      }
    });
  } finally {
    context.waitUntil(drain());
  }
};

export { logger, requestLogger, serveWithRequestLog };

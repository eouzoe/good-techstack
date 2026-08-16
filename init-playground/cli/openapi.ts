import { writeFileSync } from 'node:fs';

import { OpenAPIGenerator } from '@orpc/openapi';
import { ValibotToJsonSchemaConverter } from '@orpc/valibot';

import { contract } from '../src/shared/contracts';

/// Generates the OpenAPI 3.1 document from the contract — the single source of
/// truth. No implementation code is imported, so the spec can never drift from
/// what the contract promises.
///
/// Consumed by agents (tool spec), Scalar/Swagger UI, or CI spec-diff checks.
const generator = new OpenAPIGenerator({
  converters: [new ValibotToJsonSchemaConverter()],
});

const spec = await generator.generate(contract, {
  base: {
    info: {
      title: 'gstack API',
      version: '0.0.1',
    },
    servers: [{ url: '/api/rpc' }],
  },
});

writeFileSync('dist/openapi.json', JSON.stringify(spec, null, 2));
console.log('OpenAPI spec written to dist/openapi.json');

import { COMMON_ERROR_STATUS_MAP } from '@orpc/server';
import { describe, expect, it } from 'vitest';

import { contract } from '../src/shared/contracts/index';
import { runSuite } from '../src/verification/suite';
import {
  acceptsSchema,
  getContractErrorMapKeys,
  getContractErrorMessage,
  getContractOutputSchema,
  getContractYieldSchema,
  outputInvariant,
  rejectsSchema,
} from './contract-common';

const NOT_FOUND_STATUS = 404;

/// Phase C — API (oRPC contract) boundary (§6.3), invariant + witness form.
///
/// Every claim is an invariant + executable witness. The oracle reads the REAL
/// Valibot schema stored inside the oRPC contract (`['~orpc'].outputSchemas[0]`),
/// so the contract itself is the single source of truth (§5): if a backend field
/// changes, both the runtime oracle and the contract type change together.

describe('techs contract (§6.3)', () => {
  const proc = contract.info.techs;
  const schema = getContractOutputSchema(proc);

  it('accepts only fully-formed tech rows', () => {
    expect.hasAssertions();
    const validRow = [
      {
        description: 'Type-safe HTTP',
        name: 'oRPC',
        url: 'https://orpc.dev',
        version: '2.0.0-beta',
      },
    ];
    const valid = outputInvariant(validRow, 'a well-formed tech row is always accepted', acceptsSchema(schema));
    const badUrl = outputInvariant(
      [{ ...validRow[0], url: 'not-a-url' }],
      'a tech row with a malformed url is always rejected',
      rejectsSchema(schema),
    );
    const missingVersion = outputInvariant(
      [{ description: 'x', name: 'y', url: 'https://z.dev' }],
      'a tech row without a version is always rejected',
      rejectsSchema(schema),
    );
    const missingName = outputInvariant(
      [{ description: 'x', name: '', url: 'https://z.dev', version: '1' }],
      'a tech row with an empty name is always rejected',
      rejectsSchema(schema),
    );
    const suite = runSuite([valid, badUrl, missingVersion, missingName]);
    expect(suite.status).toBe('ok');
    expect(suite.failed).toBe(0);
  });

  it('declares its typed error and the NOT_FOUND status mapping', () => {
    expect.hasAssertions();
    expect(getContractErrorMapKeys(proc)).toStrictEqual(['NOT_FOUND']);
    expect(getContractErrorMessage(proc, 'NOT_FOUND')).toBe('No technologies found');
    expect(COMMON_ERROR_STATUS_MAP.NOT_FOUND).toBe(NOT_FOUND_STATUS);
  });
});

describe('features contract (§6.3)', () => {
  const proc = contract.info.features;
  const schema = getContractOutputSchema(proc);

  it('accepts only fully-formed feature rows', () => {
    expect.hasAssertions();
    const validRow = [{ description: 'Runtime and test runner', icon: '🚀', title: 'Bun' }];
    const valid = outputInvariant(validRow, 'a well-formed feature row is always accepted', acceptsSchema(schema));
    const emptyTitle = outputInvariant(
      [{ description: 'x', icon: '🔗', title: '' }],
      'a feature row with an empty title is always rejected',
      rejectsSchema(schema),
    );
    const missingIcon = outputInvariant(
      [{ description: 'x', icon: '', title: 'y' }],
      'a feature row without an icon is always rejected',
      rejectsSchema(schema),
    );
    const suite = runSuite([valid, emptyTitle, missingIcon]);
    expect(suite.status).toBe('ok');
    expect(suite.failed).toBe(0);
  });
});

describe('pageMeta contract (§6.3)', () => {
  const proc = contract.info.pageMeta;
  const schema = getContractOutputSchema(proc);

  it('accepts only non-empty page metadata', () => {
    expect.hasAssertions();
    const validMeta = { description: 'A full-stack template', title: 'gstack' };
    const valid = outputInvariant(validMeta, 'well-formed page metadata is always accepted', acceptsSchema(schema));
    const emptyDescription = outputInvariant({ description: '', title: 'gstack' },
      'page metadata with an empty description is always rejected',
      rejectsSchema(schema),
    );
    const suite = runSuite([valid, emptyDescription]);
    expect(suite.status).toBe('ok');
    expect(suite.failed).toBe(0);
  });
});

describe('events contract (streaming, §6.3)', () => {
  const proc = contract.info.events;
  const itemSchema = getContractYieldSchema(proc);

  const eventInvariants: ReturnType<typeof outputInvariant>[] = [
    outputInvariant(
      { data: { message: 'All systems operational', severity: 'info', title: 'Status' }, type: 'notification' },
      'a registered notification event is always accepted',
      acceptsSchema(itemSchema),
    ),
    outputInvariant(
      { data: { message: 'Degraded service', severity: 'warn', title: 'Status' }, type: 'notification' },
      'a notification with the warn severity is always accepted',
      acceptsSchema(itemSchema),
    ),
    outputInvariant(
      { data: { message: 'Service down', severity: 'error', title: 'Status' }, type: 'notification' },
      'a notification with the error severity is always accepted',
      acceptsSchema(itemSchema),
    ),
    outputInvariant(
      { data: { iso: '2026-08-06T00:00:00Z', unix: 1_750_000_000_000 }, type: 'timestamp' },
      'a registered timestamp event is always accepted',
      acceptsSchema(itemSchema),
    ),
    outputInvariant(
      { data: {}, type: 'carrier-pigeon' },
      'an event with an unregistered type is always rejected',
      rejectsSchema(itemSchema),
    ),
    outputInvariant(
      { data: { message: 'boom', severity: 'fatal', title: 'x' }, type: 'notification' },
      'an event with a severity outside the union is always rejected',
      rejectsSchema(itemSchema),
    ),
    outputInvariant(
      { data: { iso: '2026-08-06T00:00:00Z' }, type: 'timestamp' },
      'a timestamp event without its unix field is always rejected',
      rejectsSchema(itemSchema),
    ),
  ];

  it('accepts only registered event variants', () => {
    expect.hasAssertions();
    const suite = runSuite(eventInvariants);
    expect(suite.status).toBe('ok');
    expect(suite.failed).toBe(0);
  });
});

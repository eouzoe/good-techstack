import { type InferRouterContractOutputs } from '@orpc/contract';
import { describe, expect, expectTypeOf, it } from 'vitest';

import { type contract } from '../src/shared/contracts/index';

/// Phase C — type endpoint-to-end (§5 single source of truth, §6.3).
///
/// The client derives its types from `InferRouterContractOutputs<typeof contract>`.
/// These tests pin the *negative* space: a consumer shape that is NOT compatible
/// with the derived output type must be rejected by the type checker. If a backend
/// field's type changes, at least one of these `expectTypeOf(...).not.toExtend`
/// assertions turns red — the runtime oracle in `api-contract.test.ts` and the
/// derived types change together from the single contract source.

type TechsOutput = InferRouterContractOutputs<typeof contract>['info']['techs'];
type FeaturesOutput = InferRouterContractOutputs<typeof contract>['info']['features'];
type PageMetaOutput = InferRouterContractOutputs<typeof contract>['info']['pageMeta'];
type EventsOutput = InferRouterContractOutputs<typeof contract>['info']['events'];

describe('techs derived output type rejects incompatible shapes (§5)', () => {
  it('rejects a tech row whose url is a number, not a string', () => {
    expect.assertions(1);
    const NON_STRING_URL = 42;
    const numericUrl = { description: 'd', name: 'n', url: NON_STRING_URL, version: 'v' } as const;
    expectTypeOf(numericUrl).not.toExtend<TechsOutput[number]>();
    expect(numericUrl.url).toBe(NON_STRING_URL);
  });

  it('rejects a tech row missing the url field entirely', () => {
    expect.assertions(1);
    const noUrl = { description: 'd', name: 'n', version: 'v' } as const;
    expectTypeOf(noUrl).not.toExtend<TechsOutput[number]>();
    expect(noUrl.name).toBe('n');
  });

  it('rejects a whole list of techs with a wrong element shape', () => {
    expect.assertions(1);
    const malformed: { description: string; name: string }[] = [{ description: 'd', name: 'n' }];
    expectTypeOf(malformed).not.toExtend<TechsOutput>();
    expect(malformed).toHaveLength(1);
  });
});

describe('features / pageMeta / events derived types (§5)', () => {
  it('rejects a feature row with a numeric icon', () => {
    expect.assertions(1);
    const NON_STRING_ICON = 42;
    const numericIcon = { description: 'd', icon: NON_STRING_ICON, title: 't' } as const;
    expectTypeOf(numericIcon).not.toExtend<FeaturesOutput[number]>();
    expect(numericIcon.icon).toBe(NON_STRING_ICON);
  });

  it('rejects page metadata widened to any-record', () => {
    expect.assertions(1);
    const anyRecord: Record<string, unknown> = {};
    expectTypeOf(anyRecord).not.toExtend<PageMetaOutput>();
    expect(Object.keys(anyRecord)).toHaveLength(0);
  });

  it('exposes the events procedure as an async iterable', () => {
    expect.assertions(1);
    expectTypeOf<EventsOutput>().toExtend<AsyncIterable<unknown>>();
    expect('x').toBe('x');
  });
});

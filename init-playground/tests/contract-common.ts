import { getAsyncIteratorObjectSchemaDetails, type AnyProcedureContract } from '@orpc/contract';
import { type AnySchema, safeParse } from 'valibot';

import { type VerifyOptions } from '../src/verification/verify';

/// Phase C — second replication to the API (oRPC contract) boundary (plan §1.13 / §6.3).
///
/// Shared helper for the contract tests. The kernel's `verify()` primitive is
/// reproduced over contract cases: `execute` yields a payload witness, `observe`
/// is identity, `oracle` decides via the REAL oRPC contract schema (single source
/// of truth §5) — never a re-declared schema.
///
/// PURITY CLAIM (plan §1.15): nothing here or in the Phase C tests mutates the
/// kernel core. This is an adapter written in `tests/`, importing only the two
/// kernel primitives.
///
/// Design note on the oracle: we do NOT re-declare any client-side schema. We read
/// the exact Valibot schema the oRPC contract already holds
/// (`['~orpc'].outputSchemas[0]`), so if a backend field changes, both the contract
/// type AND the runtime oracle change together from one source — the contract
/// itself (§5 single source of truth).

const getContractErrorMapKeys = (proc: AnyProcedureContract): string[] => {
  // oxlint-disable-next-line typescript/no-unsafe-assignment -- oRPC erases the error-map generic to `any`; the keys are the only thing we read, and they are strings by construction.
  const errorMap: Record<string, unknown> = proc['~orpc'].errorMap;
  return Object.keys(errorMap);
};

const getContractErrorMessage = (proc: AnyProcedureContract, code: string): string => {
  // oxlint-disable-next-line typescript/no-unsafe-assignment -- oRPC erases the error-map generic to `any`; the `message` field is a string by contract construction.
  const errorMap: Record<string, { message?: string }> = proc['~orpc'].errorMap;
  const message = errorMap[code]?.message;
  if (message === undefined) {
    throw new Error(`Contract error map declares no '${code}' entry`);
  }
  return message;
};

const getContractOutputSchema = (proc: AnyProcedureContract): AnySchema => {
  const schema = proc['~orpc'].outputSchemas?.[0];
  if (schema === undefined) {
    throw new Error('Procedure contract declares no output schema');
  }
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the stored schema IS a Valibot schema at runtime; oRPC's own `AnySchema` is a Standard-Schema superset, so the witness cast is type-safe-in-fact.
  return schema as AnySchema;
};

/// For an async-iterator (event-stream) procedure, unwrap the *yielded* item schema
/// so an oracle can judge each emitted event against the item union. `yieldSchema`
/// is oRPC's reified item schema; when absent (non-iterator), default to the output
/// schema verbatim.
const getContractYieldSchema = (proc: AnyProcedureContract): AnySchema => {
  const output = getContractOutputSchema(proc);
  const detail = getAsyncIteratorObjectSchemaDetails(output);
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- `yieldSchema` is the reified Valibot item schema (same rationale as `getContractOutputSchema`).
  return (detail?.yieldSchema ?? output) as AnySchema;
};

const acceptsSchema =
  (schema: AnySchema) =>
  (value: unknown): boolean =>
    safeParse(schema, value).success;

const rejectsSchema =
  (schema: AnySchema) =>
  (value: unknown): boolean =>
    !safeParse(schema, value).success;

/// Convenience: build one `VerifyOptions` case from a [witness → invariant → oracle]
/// triple over a contract output schema. Keeps the Phase B shape exactly.
const outputInvariant = (
  witness: unknown,
  invariant: string,
  oracle: (value: unknown) => boolean,
): VerifyOptions<unknown, unknown> => ({
  execute: () => witness,
  invariant,
  observe: (value: unknown) => value,
  oracle,
});

export {
  acceptsSchema,
  getContractErrorMapKeys,
  getContractErrorMessage,
  getContractOutputSchema,
  getContractYieldSchema,
  outputInvariant,
  rejectsSchema,
};

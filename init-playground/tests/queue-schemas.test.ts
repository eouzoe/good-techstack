import { safeParse } from 'valibot';
import { describe, expect, it } from 'vitest';

import {
  AuditLogQueueSchema,
  EmailQueueSchema,
  QueuePayloadSchema,
  WebhookQueueSchema,
} from '../src/shared/queue-schemas';
import { type VerifyOptions } from '../src/verification/verify';
import { runSuite } from '../src/verification/suite';

const MAX_SUBJECT_LENGTH = 256;
const VALID_SUBJECT = 'x'.repeat(MAX_SUBJECT_LENGTH);
const OVER_MAX_SUBJECT = 'x'.repeat(MAX_SUBJECT_LENGTH + 1);

const validEmail = {
  body: 'Hello',
  subject: 'Greeting',
  to: 'user@example.com',
  type: 'email' as const,
};

const isEmailValid = (value: unknown): boolean => safeParse(EmailQueueSchema, value).success;
const isWebhookValid = (value: unknown): boolean => safeParse(WebhookQueueSchema, value).success;
const isAuditValid = (value: unknown): boolean => safeParse(AuditLogQueueSchema, value).success;
const isPayloadValid = (value: unknown): boolean => safeParse(QueuePayloadSchema, value).success;

/// §1.6 Invariant-first: every claim here is an *invariant* + an executable
/// witness. The test name is the witness; the `invariant` field carries the
/// property; `verify()` runs it. We do NOT write "test email schema accepts
/// X" — we write "email payloads with a valid shape are always accepted".
const emailInvariants: VerifyOptions<unknown, unknown>[] = [
  {
    execute: () => validEmail,
    invariant: 'email payloads with a valid recipient are always accepted',
    observe: (value: unknown) => value,
    oracle: isEmailValid,
  },
  {
    execute: () => ({ ...validEmail, to: 'not-an-email' }),
    invariant: 'email payloads with a malformed recipient are always rejected',
    observe: (value: unknown) => value,
    oracle: (value: unknown) => !isEmailValid(value),
  },
  {
    execute: () => ({ ...validEmail, body: '' }),
    invariant: 'email payloads with an empty body are always rejected',
    observe: (value: unknown) => value,
    oracle: (value: unknown) => !isEmailValid(value),
  },
  {
    execute: () => ({ ...validEmail, subject: VALID_SUBJECT }),
    invariant: 'email payloads with a subject at the length limit are accepted',
    observe: (value: unknown) => value,
    oracle: isEmailValid,
  },
  {
    execute: () => ({ ...validEmail, subject: OVER_MAX_SUBJECT }),
    invariant: 'email payloads with an over-limit subject are always rejected',
    observe: (value: unknown) => value,
    oracle: (value: unknown) => !isEmailValid(value),
  },
];

const webhookInvariants: VerifyOptions<unknown, unknown>[] = [
  {
    execute: () => ({
      payload: {},
      type: 'webhook',
      url: 'https://hooks.example.com',
    }),
    invariant: 'webhook payloads with an absolute destination URL are accepted',
    observe: (value: unknown) => value,
    oracle: isWebhookValid,
  },
  {
    execute: () => ({
      payload: {},
      type: 'webhook',
      url: 'hooks.example.com',
    }),
    invariant: 'webhook payloads without an absolute destination URL are rejected',
    observe: (value: unknown) => value,
    oracle: (value: unknown) => !isWebhookValid(value),
  },
];

const auditInvariants: VerifyOptions<unknown, unknown>[] = [
  {
    execute: () => ({ action: 'login', type: 'audit' }),
    invariant: 'audit payloads with a minimal entry are accepted',
    observe: (value: unknown) => value,
    oracle: isAuditValid,
  },
  {
    execute: () => ({ action: '', type: 'audit' }),
    invariant: 'audit payloads with an empty action are always rejected',
    observe: (value: unknown) => value,
    oracle: (value: unknown) => !isAuditValid(value),
  },
];

const payloadInvariants: VerifyOptions<unknown, unknown>[] = [
  {
    execute: () => validEmail,
    invariant: 'the queue dispatch accepts any registered email variant',
    observe: (value: unknown) => value,
    oracle: isPayloadValid,
  },
  {
    execute: () => ({ type: 'carrier-pigeon' }),
    invariant: 'the queue dispatch rejects any unregistered variant',
    observe: (value: unknown) => value,
    oracle: (value: unknown) => !isPayloadValid(value),
  },
];

describe('queue schemas — invariant form (§1.6/§1.7, via verify())', () => {
  it('email contract invariants all hold', () => {
    expect.hasAssertions();
    const suite = runSuite(emailInvariants);
    expect(suite.status).toBe('ok');
    expect(suite.verified).toBe(emailInvariants.length);
  });

  it('webhook contract invariants all hold', () => {
    expect.hasAssertions();
    const suite = runSuite(webhookInvariants);
    expect(suite.status).toBe('ok');
    expect(suite.failed).toBe(0);
  });

  it('audit contract invariants all hold', () => {
    expect.hasAssertions();
    const suite = runSuite(auditInvariants);
    expect(suite.status).toBe('ok');
    expect(suite.failed).toBe(0);
  });

  it('queue dispatch contract invariants all hold', () => {
    expect.hasAssertions();
    const suite = runSuite(payloadInvariants);
    expect(suite.status).toBe('ok');
    expect(suite.failed).toBe(0);
  });

  it('each invariant failure is attributable to its own run', () => {
    expect.hasAssertions();
    const suite = runSuite(emailInvariants);
    expect(suite.runs).toHaveLength(emailInvariants.length);
    expect(suite.runs.every((run) => run.status === 'ok')).toBe(true);
  });
});
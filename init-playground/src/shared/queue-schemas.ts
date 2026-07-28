import {
  type InferOutput,
  email,
  literal,
  maxLength,
  minLength,
  object,
  optional,
  pipe,
  record,
  string,
  unknown,
  url,
  variant,
} from 'valibot';

const MAX_SUBJECT_LENGTH = 256;
const stringRecord = record(string(), unknown());

const EmailQueueSchema = object({
  body: pipe(string(), minLength(1)),
  subject: pipe(string(), minLength(1), maxLength(MAX_SUBJECT_LENGTH)),
  to: pipe(string(), email()),
  type: literal('email'),
});

const WebhookQueueSchema = object({
  payload: stringRecord,
  type: literal('webhook'),
  url: pipe(string(), url()),
});

const AuditLogQueueSchema = object({
  action: pipe(string(), minLength(1)),
  metadata: optional(stringRecord),
  type: literal('audit'),
  userId: optional(string()),
});

const QueuePayloadSchema = variant('type', [
  EmailQueueSchema,
  WebhookQueueSchema,
  AuditLogQueueSchema,
]);

type QueuePayload = InferOutput<typeof QueuePayloadSchema>;

export {
  AuditLogQueueSchema,
  EmailQueueSchema,
  QueuePayloadSchema,
  WebhookQueueSchema,
  type QueuePayload,
};

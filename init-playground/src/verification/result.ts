import { TaggedError } from 'better-result';

// oxlint-disable-next-line unicorn/throw-new-error -- TaggedError is the better-result class factory, not a thrown error.
class VerificationFailed extends TaggedError('VerificationFailed')<{
  invariant: string;
  message: string;
}> {}

export { VerificationFailed };

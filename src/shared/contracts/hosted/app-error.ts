// prettier-ignore
export const APP_ERROR_CODES = Object.freeze(['invalid_request', 'unauthenticated', 'forbidden', 'not_found', 'conflict', 'unsupported', 'unavailable', 'cancelled', 'internal'] as const);
export type AppErrorCode = (typeof APP_ERROR_CODES)[number];
const ERROR_KEYS = ['code', 'reason', 'diagnosticId', 'retryAfterMs'];
const SAFE_REASON = /^[a-z][a-z0-9_]{0,63}$/;
const SAFE_DIAGNOSTIC = /^[a-z0-9][a-z0-9._-]{0,63}$/;
export function createSafeAppError(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('hosted-contract-safe-error-invalid');
  }
  const input = value as Record<string, unknown>;
  const retry = input.retryAfterMs;
  if (
    Object.keys(input).some((key) => !ERROR_KEYS.includes(key)) ||
    !APP_ERROR_CODES.includes(input.code as AppErrorCode) ||
    typeof input.reason !== 'string' ||
    !SAFE_REASON.test(input.reason) ||
    (input.diagnosticId !== undefined &&
      (typeof input.diagnosticId !== 'string' || !SAFE_DIAGNOSTIC.test(input.diagnosticId))) ||
    (retry !== undefined && input.code !== 'unavailable') ||
    (retry !== undefined &&
      (!Number.isSafeInteger(retry) || (retry as number) < 1 || (retry as number) > 60_000))
  ) {
    throw new TypeError('hosted-contract-safe-error-invalid');
  }
  return Object.freeze({
    code: input.code as AppErrorCode,
    reason: input.reason,
    ...(input.diagnosticId === undefined ? {} : { diagnosticId: input.diagnosticId }),
    ...(retry === undefined ? {} : { retryAfterMs: retry as number }),
  });
}
export type SafeAppError = ReturnType<typeof createSafeAppError>;

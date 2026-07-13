import * as ids from './identifiers';
declare const scopeBrand: unique symbol;
export type AuthorizedScope = string & { readonly [scopeBrand]: 'AuthorizedScope' };
const CONTEXT_KEYS = new Set(
  'actorId,sessionId,deploymentId,bootId,requestId,authorizedScope,deadlineAtMs,signal'.split(',')
);
export function parseAuthorizedScope(value: unknown): AuthorizedScope {
  if (typeof value !== 'string' || !/^scope_[A-Za-z0-9][A-Za-z0-9._-]{0,121}$/.test(value)) {
    throw new TypeError('hosted-contract-authorized-scope-invalid');
  }
  return value as AuthorizedScope;
}
export function createQueryContext(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('hosted-contract-query-context-invalid');
  }
  const input = value as Record<string, unknown>;
  if (Object.keys(input).some((key) => !CONTEXT_KEYS.has(key))) {
    throw new TypeError('hosted-contract-query-context-invalid');
  }
  if (!Number.isSafeInteger(input.deadlineAtMs) || (input.deadlineAtMs as number) < 0) {
    throw new TypeError('hosted-contract-query-context-invalid');
  }
  if (!(input.signal instanceof AbortSignal)) {
    throw new TypeError('hosted-contract-query-context-invalid');
  }
  return Object.freeze({
    actorId: ids.parseActorId(input.actorId),
    sessionId: ids.parseSessionId(input.sessionId),
    deploymentId: ids.parseDeploymentId(input.deploymentId),
    bootId: ids.parseBootId(input.bootId),
    requestId: ids.parseRequestId(input.requestId),
    authorizedScope: parseAuthorizedScope(input.authorizedScope),
    deadlineAtMs: input.deadlineAtMs as number,
    signal: input.signal,
  });
}
export type QueryContext = ReturnType<typeof createQueryContext>;

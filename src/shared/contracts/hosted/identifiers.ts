declare const hostedIdBrand: unique symbol;
export type ActorId = string & { readonly [hostedIdBrand]: 'ActorId' };
export type SessionId = string & { readonly [hostedIdBrand]: 'SessionId' };
export type DeploymentId = string & { readonly [hostedIdBrand]: 'DeploymentId' };
export type BootId = string & { readonly [hostedIdBrand]: 'BootId' };
export type RequestId = string & { readonly [hostedIdBrand]: 'RequestId' };
/** Phase 1 values are synthetic fixture identities, never legacy team names. */
export type TeamId = string & { readonly [hostedIdBrand]: 'TeamId' };
const MAX_ID_LENGTH = 128;
function parseId<T extends string>(value: unknown, prefix: string): T {
  const pattern = new RegExp(`^${prefix}_[A-Za-z0-9][A-Za-z0-9._-]*$`);
  if (typeof value !== 'string' || value.length > MAX_ID_LENGTH || !pattern.test(value)) {
    throw new TypeError('hosted-contract-identifier-invalid');
  }
  return value as T;
}
export const parseActorId = (value: unknown): ActorId => parseId(value, 'actor');
export const parseSessionId = (value: unknown): SessionId => parseId(value, 'session');
export const parseDeploymentId = (value: unknown): DeploymentId => parseId(value, 'deployment');
export const parseBootId = (value: unknown): BootId => parseId(value, 'boot');
export const parseRequestId = (value: unknown): RequestId => parseId(value, 'request');
export const parseSyntheticTeamId = (value: unknown): TeamId => parseId(value, 'team');

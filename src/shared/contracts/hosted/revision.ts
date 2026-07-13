declare const opaqueTokenBrand: unique symbol;
export type Revision = string & { readonly [opaqueTokenBrand]: 'Revision' };
export type Cursor = string & { readonly [opaqueTokenBrand]: 'Cursor' };
export const HOSTED_SCHEMA_VERSION = 1 as const;
export const SCHEMA_VERSION_DIAGNOSTIC = 'phase1-schema-version-invalid-or-unsupported';
function parseToken<T extends string>(value: unknown, prefix: string): T {
  const pattern = new RegExp(`^${prefix}_[A-Za-z0-9][A-Za-z0-9._-]*$`);
  if (typeof value !== 'string' || value.length > 256 || !pattern.test(value)) {
    throw new TypeError('hosted-contract-opaque-token-invalid');
  }
  return value as T;
}
export const parseRevision = (value: unknown): Revision => parseToken(value, 'revision');
export const parseCursor = (value: unknown): Cursor => parseToken(value, 'cursor');
export function parseHostedSchemaVersion(value: unknown): typeof HOSTED_SCHEMA_VERSION {
  if (value !== HOSTED_SCHEMA_VERSION) throw new TypeError(SCHEMA_VERSION_DIAGNOSTIC);
  return HOSTED_SCHEMA_VERSION;
}

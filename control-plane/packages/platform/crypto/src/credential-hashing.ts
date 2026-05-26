import { createHmac, timingSafeEqual } from "node:crypto";

import { createSafeError, type SafeError } from "@agent-teams-control-plane/shared";

export type CredentialHashPurpose =
  | "desktop-token"
  | "pairing-code"
  | "github-setup-state"
  | "github-claim-continuation"
  | "github-oauth-state";

export type CredentialHash = Readonly<{
  value: string;
}>;

export type HashCredentialInput = Readonly<{
  purpose: CredentialHashPurpose;
  credential: string;
}>;

export type VerifyCredentialHashInput = HashCredentialInput &
  Readonly<{
    expectedHash: string;
  }>;

export interface CredentialHasher {
  hash(input: HashCredentialInput): Promise<CredentialHash>;
  verify(input: VerifyCredentialHashInput): Promise<boolean>;
}

const algorithm = "hmac-sha256";
const version = "v1";
const keyLength = 32;

export class NodeCryptoCredentialHasher implements CredentialHasher {
  private readonly key: Buffer;

  public constructor(masterKeyBase64: string) {
    this.key = decodeMasterKey(masterKeyBase64);
  }

  public async hash(input: HashCredentialInput): Promise<CredentialHash> {
    return {
      value: formatHash(input.purpose, digestCredential(this.key, input)),
    };
  }

  public async verify(input: VerifyCredentialHashInput): Promise<boolean> {
    const expected = parseHash(input.expectedHash);
    if (expected === undefined || expected.purpose !== input.purpose) {
      return false;
    }

    const actual = digestCredential(this.key, input);
    return timingSafeHexEqual(actual, expected.digestHex);
  }
}

export class DisabledCredentialHasher implements CredentialHasher {
  public async hash(): Promise<CredentialHash> {
    throw disabledCredentialHasherError();
  }

  public async verify(): Promise<boolean> {
    throw disabledCredentialHasherError();
  }
}

function decodeMasterKey(masterKeyBase64: string): Buffer {
  const decoded = Buffer.from(masterKeyBase64.trim(), "base64");
  if (decoded.byteLength !== keyLength) {
    throw new TypeError("Credential hashing key must decode to 32 bytes.");
  }
  return decoded;
}

function digestCredential(key: Buffer, input: HashCredentialInput): string {
  return createHmac("sha256", key)
    .update(`${version}:${input.purpose}:`, "utf8")
    .update(input.credential, "utf8")
    .digest("hex");
}

function formatHash(purpose: CredentialHashPurpose, digestHex: string): string {
  return `${version}:${algorithm}:${purpose}:${digestHex}`;
}

function parseHash(
  value: string,
): { purpose: CredentialHashPurpose; digestHex: string } | undefined {
  const [hashVersion, hashAlgorithm, purpose, digestHex, extra] = value.split(":");
  if (
    extra !== undefined ||
    hashVersion !== version ||
    hashAlgorithm !== algorithm ||
    !isCredentialHashPurpose(purpose) ||
    digestHex === undefined ||
    !/^[0-9a-f]{64}$/.test(digestHex)
  ) {
    return undefined;
  }
  return { digestHex, purpose };
}

function isCredentialHashPurpose(value: unknown): value is CredentialHashPurpose {
  return (
    value === "desktop-token" ||
    value === "pairing-code" ||
    value === "github-setup-state" ||
    value === "github-claim-continuation" ||
    value === "github-oauth-state"
  );
}

function timingSafeHexEqual(leftHex: string, rightHex: string): boolean {
  const left = Buffer.from(leftHex, "hex");
  const right = Buffer.from(rightHex, "hex");
  return left.byteLength === right.byteLength && timingSafeEqual(left, right);
}

function disabledCredentialHasherError(): SafeError {
  return createSafeError({
    category: "validation",
    code: "CONTROL_PLANE_CREDENTIAL_HASHING_DISABLED",
    message: "Control-plane credential hashing is disabled.",
  });
}

import { createHash, randomUUID } from "node:crypto";
import { statSync } from "node:fs";
import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { SessionArtifact, SessionEnvelope } from "@vioxen/subscription-runtime/core";
import {
  codexAuthJsonFromArtifact,
  readCodexAuthJsonFreshness,
} from "@vioxen/subscription-runtime/provider-codex";

export function shouldReplaceSeededCodexSession(input: {
  readonly existing: SessionEnvelope;
  readonly incoming: SessionArtifact;
  readonly now: Date;
}): boolean {
  if (sameArtifactBytes(input.existing.artifact, input.incoming)) return false;

  const existingFreshness = safeReadCodexArtifactFreshness({
    artifact: input.existing.artifact,
    now: input.now,
  });
  if (!existingFreshness) return true;

  const incomingFreshness = safeReadCodexArtifactFreshness({
    artifact: input.incoming,
    now: input.now,
  });
  if (!incomingFreshness) return false;

  const existingLastRefresh = existingFreshness.lastRefreshAt?.getTime() ?? null;
  const incomingLastRefresh = incomingFreshness.lastRefreshAt?.getTime() ?? null;
  if (
    incomingLastRefresh !== null &&
    (existingLastRefresh === null || incomingLastRefresh >= existingLastRefresh)
  ) {
    return true;
  }
  if (existingLastRefresh === null && incomingLastRefresh === null) {
    return true;
  }

  const existingExpiry = existingFreshness.expiresAt?.getTime() ?? null;
  const incomingExpiry = incomingFreshness.expiresAt?.getTime() ?? null;
  return (
    incomingExpiry !== null &&
    (existingExpiry === null || incomingExpiry > existingExpiry)
  );
}

function safeReadCodexArtifactFreshness(input: {
  readonly artifact: SessionArtifact;
  readonly now: Date;
}): ReturnType<typeof readCodexAuthJsonFreshness> | null {
  try {
    return readCodexAuthJsonFreshness({
      authJsonBytes: codexAuthJsonFromArtifact(input.artifact),
      now: input.now,
    });
  } catch {
    return null;
  }
}

export function safeStatMtimeMs(path: string): number | null {
  try {
    return statSync(path).mtimeMs;
  } catch {
    return null;
  }
}

export function sameArtifactBytes(
  left: SessionArtifact,
  right: SessionArtifact,
): boolean {
  return Buffer.from(left.bytes).equals(Buffer.from(right.bytes));
}

export function hashArtifact(artifact: SessionArtifact): string {
  return createHash("sha256").update(artifact.bytes).digest("hex");
}

export async function writeCodexAuthJsonFileAtomic(
  authJsonPath: string,
  authJson: string,
): Promise<void> {
  await mkdir(dirname(authJsonPath), { recursive: true, mode: 0o700 });
  const tempPath = `${authJsonPath}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(tempPath, authJson, { mode: 0o600 });
  await rename(tempPath, authJsonPath);
}

import type { ProjectAccessScope } from "@vioxen/subscription-runtime/worker-core";
import {
  assertCanonicalRemoteRevision,
  materializePinnedRemoteCommit,
  resolveCanonicalRemoteHead,
  resolveCanonicalRemoteWorktreeSource,
  type CanonicalRemoteHead,
} from "./codex-goal-project-git";

export type ResolvedProjectSourceRevision = {
  readonly revision: string;
  readonly sourceRealPath: string;
  readonly pinned: boolean;
  readonly remoteHead?: CanonicalRemoteHead;
};

export async function resolveProjectSourceRevision(input: {
  readonly resolvedSource: {
    readonly revision: string;
    readonly sourceRealPath: string;
  };
  readonly remoteTrackingRef: string;
  readonly scope: ProjectAccessScope;
  readonly expectedSourceCommit?: string;
  readonly requireRemoteHead?: boolean;
}): Promise<ResolvedProjectSourceRevision> {
  const remoteTrackingRef =
    input.expectedSourceCommit || input.requireRemoteHead
      ? resolveCanonicalRemoteWorktreeSource({
          requestedRef: input.remoteTrackingRef,
          scope: input.scope,
        }).remoteTrackingRef
      : input.remoteTrackingRef;
  const pinnedRemote = input.expectedSourceCommit
    ? await materializePinnedRemoteCommit({
        workspacePath: input.resolvedSource.sourceRealPath,
        remoteTrackingRef,
        expectedCommit: input.expectedSourceCommit,
      })
    : undefined;
  const remoteHead = input.requireRemoteHead
    ? (pinnedRemote ??
      (await resolveCanonicalRemoteHead({
        workspacePath: input.resolvedSource.sourceRealPath,
        remoteTrackingRef,
      })))
    : undefined;
  if (remoteHead && !pinnedRemote) {
    assertCanonicalRemoteRevision({
      canonical: remoteHead,
      resolvedRevision: input.resolvedSource.revision,
    });
  }
  return {
    revision: pinnedRemote?.oid ?? input.resolvedSource.revision,
    sourceRealPath: input.resolvedSource.sourceRealPath,
    pinned: pinnedRemote !== undefined,
    ...(remoteHead ? { remoteHead } : {}),
  };
}

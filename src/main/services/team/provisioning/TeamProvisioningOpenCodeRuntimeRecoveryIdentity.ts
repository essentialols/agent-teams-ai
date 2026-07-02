import {
  type OpenCodeRuntimeLaneIndex,
  OpenCodeRuntimeManifestEvidenceReader,
  readOpenCodeRuntimeLaneIndex,
} from '../opencode/store/OpenCodeRuntimeManifestEvidenceReader';

import type {
  OpenCodeMemberDirectory,
  OpenCodeMemberIdentityResolution,
} from '../opencode/delivery/OpenCodeMemberMessageDeliveryService';

export type OpenCodeMemberDeliveryIdentityResolution =
  | {
      ok: true;
      canonicalMemberName: string;
      laneId: string;
    }
  | {
      ok: false;
      reason: 'recipient_is_not_opencode' | 'recipient_removed' | 'opencode_recipient_unavailable';
    };

export interface OpenCodeRuntimeManifestRunEvidence {
  activeRunId?: string | null;
}

export interface OpenCodeRuntimeRecoveryIdentityHelperPorts {
  getTeamsBasePath: () => string;
  getCurrentOpenCodeRuntimeRunId: (teamName: string, laneId: string) => string | null;
  readOpenCodeMemberDirectory: (teamName: string) => Promise<OpenCodeMemberDirectory>;
  resolveOpenCodeMemberIdentityFromDirectory: (
    teamName: string,
    memberName: string,
    directory: OpenCodeMemberDirectory
  ) => OpenCodeMemberIdentityResolution;
  readOpenCodeRuntimeLaneIndex?: (
    teamsBasePath: string,
    teamName: string
  ) => Promise<OpenCodeRuntimeLaneIndex>;
  readOpenCodeRuntimeManifestEvidence?: (
    teamsBasePath: string,
    teamName: string,
    laneId: string
  ) => Promise<OpenCodeRuntimeManifestRunEvidence>;
}

export interface OpenCodeRuntimeRecoveryIdentityHelpers {
  resolveCurrentOpenCodeRuntimeRunId(teamName: string, laneId: string): Promise<string | null>;
  resolveOpenCodeMemberDeliveryIdentity(
    teamName: string,
    memberName: string
  ): Promise<OpenCodeMemberDeliveryIdentityResolution>;
  resolveOpenCodeMembersForRuntimeLane(teamName: string, laneId: string): Promise<string[]>;
  isOpenCodeRuntimeLaneIndexActive(teamName: string, laneId: string): Promise<boolean>;
}

export function createOpenCodeRuntimeRecoveryIdentityHelpers(
  ports: OpenCodeRuntimeRecoveryIdentityHelperPorts
): OpenCodeRuntimeRecoveryIdentityHelpers {
  const readLaneIndex = ports.readOpenCodeRuntimeLaneIndex ?? readOpenCodeRuntimeLaneIndex;
  const readManifestEvidence =
    ports.readOpenCodeRuntimeManifestEvidence ??
    ((teamsBasePath, teamName, laneId) =>
      new OpenCodeRuntimeManifestEvidenceReader({ teamsBasePath }).read(teamName, laneId));

  return {
    async resolveCurrentOpenCodeRuntimeRunId(
      teamName: string,
      laneId: string
    ): Promise<string | null> {
      const inMemoryRunId = ports.getCurrentOpenCodeRuntimeRunId(teamName, laneId);
      if (inMemoryRunId) {
        return inMemoryRunId;
      }

      const laneIndex = await readLaneIndex(ports.getTeamsBasePath(), teamName).catch(() => null);
      if (laneIndex?.lanes[laneId]?.state !== 'active') {
        return null;
      }

      const evidence = await readManifestEvidence(
        ports.getTeamsBasePath(),
        teamName,
        laneId
      ).catch(() => null);
      const durableRunId = evidence?.activeRunId?.trim();
      return durableRunId || null;
    },

    async resolveOpenCodeMemberDeliveryIdentity(
      teamName: string,
      memberName: string
    ): Promise<OpenCodeMemberDeliveryIdentityResolution> {
      const directory = await ports.readOpenCodeMemberDirectory(teamName);
      const laneIdentity = ports.resolveOpenCodeMemberIdentityFromDirectory(
        teamName,
        memberName,
        directory
      );
      if (!laneIdentity.ok) {
        return laneIdentity;
      }
      return {
        ok: true,
        canonicalMemberName: laneIdentity.canonicalMemberName,
        laneId: laneIdentity.laneId,
      };
    },

    async resolveOpenCodeMembersForRuntimeLane(
      teamName: string,
      laneId: string
    ): Promise<string[]> {
      const directory = await ports.readOpenCodeMemberDirectory(teamName);
      const names = new Set<string>();
      for (const member of directory.config?.members ?? []) {
        if (member.name?.trim()) {
          names.add(member.name.trim());
        }
      }
      for (const member of directory.metaMembers) {
        if (member.name?.trim()) {
          names.add(member.name.trim());
        }
      }
      const resolved: string[] = [];
      for (const name of names) {
        const identity = ports.resolveOpenCodeMemberIdentityFromDirectory(teamName, name, directory);
        if (identity.ok && identity.laneId === laneId) {
          resolved.push(identity.canonicalMemberName);
        }
      }
      if (resolved.length > 0) {
        return [...new Set(resolved)];
      }
      const secondaryMatch = /^secondary:opencode:(.+)$/i.exec(laneId);
      const fallbackMember = secondaryMatch?.[1]?.trim();
      return fallbackMember ? [fallbackMember] : [];
    },

    async isOpenCodeRuntimeLaneIndexActive(teamName: string, laneId: string): Promise<boolean> {
      const laneIndex = await readLaneIndex(ports.getTeamsBasePath(), teamName).catch(() => null);
      return laneIndex?.lanes[laneId]?.state === 'active';
    },
  };
}

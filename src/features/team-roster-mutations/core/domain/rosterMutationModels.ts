import type { TeamProvisioningMemberInput } from '@shared/types';

export type RosterMemberInput = Omit<TeamProvisioningMemberInput, 'cwd'>;

export interface RuntimeRosterMutationMember extends TeamProvisioningMemberInput {
  removedAt?: number | string | null;
}

export interface MembersMetadataSnapshot {
  providerBackendId?: string;
  members: RuntimeRosterMutationMember[];
}

export interface ReplaceMembersDiff {
  added: RosterMemberInput[];
  removed: string[];
  updated: { name: string; changes: string[] }[];
}

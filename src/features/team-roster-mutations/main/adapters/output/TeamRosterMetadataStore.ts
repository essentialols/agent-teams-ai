import { TeamMembersMetaStore } from '@main/services/team/TeamMembersMetaStore';

import type { TeamRosterMetadataPort } from '../../../core/application/ports/TeamRosterMutationPorts';
import type { MembersMetadataSnapshot } from '../../../core/domain/rosterMutationModels';
import type { TeamMember } from '@shared/types';

export class TeamRosterMetadataStore implements TeamRosterMetadataPort {
  constructor(private readonly store = new TeamMembersMetaStore()) {}

  async getSnapshot(teamName: string): Promise<MembersMetadataSnapshot | null> {
    const snapshot = await this.store.getMeta(teamName);
    return snapshot as MembersMetadataSnapshot | null;
  }

  async writeSnapshot(teamName: string, snapshot: MembersMetadataSnapshot): Promise<void> {
    await this.store.writeMembers(teamName, snapshot.members as TeamMember[], {
      providerBackendId: snapshot.providerBackendId,
    });
  }
}

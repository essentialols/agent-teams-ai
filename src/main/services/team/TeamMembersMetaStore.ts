import { FileReadTimeoutError, readFileUtf8WithTimeout } from '@main/utils/fsRead';
import { getTeamsBasePath } from '@main/utils/pathDecoder';
import { isTeamEffortLevel } from '@shared/utils/effortLevels';
import { migrateProviderBackendId } from '@shared/utils/providerBackend';
import { normalizeTeamMemberMcpPolicy } from '@shared/utils/teamMemberMcpPolicy';
import { createCliAutoSuffixNameGuard } from '@shared/utils/teamMemberName';
import { normalizeOptionalTeamProviderId } from '@shared/utils/teamProvider';
import * as fs from 'fs';
import * as path from 'path';

import { atomicWriteAsync } from './atomicWrite';
import { withFileLock } from './fileLock';

import type { TeamMember } from '@shared/types';

export interface TeamMembersMetaFile {
  version: 1;
  providerBackendId?: string;
  members: TeamMember[];
}

export type TeamMembersMetaUpdate = (
  members: readonly TeamMember[]
) => TeamMember[] | Promise<TeamMember[]>;

const MAX_META_FILE_BYTES = 256 * 1024;

function normalizeOptionalBackendId(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeFastMode(value: unknown): TeamMember['fastMode'] {
  return value === 'inherit' || value === 'on' || value === 'off' ? value : undefined;
}

function normalizeMember(member: TeamMember): TeamMember | null {
  const trimmedName = member.name?.trim();
  if (!trimmedName) {
    return null;
  }
  const providerId = normalizeOptionalTeamProviderId(member.providerId);
  return {
    name: trimmedName,
    role: typeof member.role === 'string' ? member.role.trim() || undefined : undefined,
    workflow: typeof member.workflow === 'string' ? member.workflow.trim() || undefined : undefined,
    isolation: member.isolation === 'worktree' ? ('worktree' as const) : undefined,
    providerId,
    providerBackendId: migrateProviderBackendId(
      providerId,
      normalizeOptionalBackendId(member.providerBackendId)
    ),
    model: typeof member.model === 'string' ? member.model.trim() || undefined : undefined,
    effort: isTeamEffortLevel(member.effort) ? member.effort : undefined,
    fastMode: normalizeFastMode(member.fastMode),
    mcpPolicy: normalizeTeamMemberMcpPolicy(member.mcpPolicy),
    agentType:
      typeof member.agentType === 'string' ? member.agentType.trim() || undefined : undefined,
    color: typeof member.color === 'string' ? member.color.trim() || undefined : undefined,
    joinedAt: typeof member.joinedAt === 'number' ? member.joinedAt : undefined,
    agentId: typeof member.agentId === 'string' ? member.agentId : undefined,
    cwd: typeof member.cwd === 'string' ? member.cwd.trim() || undefined : undefined,
    removedAt: typeof member.removedAt === 'number' ? member.removedAt : undefined,
  };
}

function buildActiveNameGuard(membersByName: Map<string, TeamMember>): (name: string) => boolean {
  const activeNames = Array.from(membersByName.values())
    .filter((member) => !member.removedAt)
    .map((member) => member.name);
  return createCliAutoSuffixNameGuard(activeNames);
}

function normalizeMembers(members: readonly TeamMember[]): TeamMember[] {
  const deduped = new Map<string, TeamMember>();
  for (const member of members) {
    const normalized = normalizeMember(member);
    if (!normalized) {
      continue;
    }
    deduped.set(normalized.name, normalized);
  }
  return Array.from(deduped.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function projectMembers(members: readonly TeamMember[]): TeamMember[] {
  const membersByName = new Map(members.map((member) => [member.name, member]));

  // Defense: hide CLI auto-suffixed duplicates (alice-2) only when the base
  // name is still active. The raw rows remain persisted until the explicit
  // provisioning cleanup boundary can remove and log them.
  const keepName = buildActiveNameGuard(membersByName);
  return members.filter((member) => keepName(member.name));
}

export class TeamMembersMetaStore {
  private getMetaPath(teamName: string): string {
    return path.join(getTeamsBasePath(), teamName, 'members.meta.json');
  }

  async getMeta(teamName: string): Promise<TeamMembersMetaFile | null> {
    const metaPath = this.getMetaPath(teamName);
    const meta = await this.readMeta(metaPath);
    return meta ? { ...meta, members: projectMembers(meta.members) } : null;
  }

  private async readMeta(metaPath: string): Promise<TeamMembersMetaFile | null> {
    try {
      const stat = await fs.promises.stat(metaPath);
      if (!stat.isFile()) {
        return null;
      }
      if (stat.isFile() && stat.size > MAX_META_FILE_BYTES) {
        return null;
      }
    } catch {
      // ignore - readFile below will handle ENOENT and throw on other errors
    }
    let raw: string;
    try {
      raw = await readFileUtf8WithTimeout(metaPath, 5_000);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      if (error instanceof FileReadTimeoutError) {
        return null;
      }
      throw error;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch {
      return null;
    }
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const file = parsed as Partial<TeamMembersMetaFile>;
    if (!Array.isArray(file.members)) {
      return null;
    }

    return {
      version: 1,
      providerBackendId: normalizeOptionalBackendId(file.providerBackendId),
      members: normalizeMembers(file.members.filter((item) => item && typeof item === 'object')),
    };
  }

  async getMembers(teamName: string): Promise<TeamMember[]> {
    return (await this.getMeta(teamName))?.members ?? [];
  }

  async writeMembers(
    teamName: string,
    members: TeamMember[],
    options?: { providerBackendId?: string }
  ): Promise<void> {
    const metaPath = this.getMetaPath(teamName);
    await withFileLock(metaPath, () => this.writeMembersUnlocked(metaPath, members, options));
  }

  async updateMembers(
    teamName: string,
    update: TeamMembersMetaUpdate,
    options?: { providerBackendId?: string }
  ): Promise<void> {
    const metaPath = this.getMetaPath(teamName);
    await withFileLock(metaPath, async () => {
      const currentMeta = await this.readMeta(metaPath);
      const providerBackendId =
        options?.providerBackendId === undefined
          ? currentMeta?.providerBackendId
          : normalizeOptionalBackendId(options.providerBackendId);
      const updatedMembers = await update(currentMeta?.members ?? []);
      await this.writeMembersUnlocked(metaPath, updatedMembers, { providerBackendId });
    });
  }

  private async writeMembersUnlocked(
    metaPath: string,
    members: readonly TeamMember[],
    options?: { providerBackendId?: string }
  ): Promise<void> {
    const payload: TeamMembersMetaFile = {
      version: 1,
      providerBackendId: normalizeOptionalBackendId(options?.providerBackendId),
      members: normalizeMembers(members),
    };

    await atomicWriteAsync(metaPath, JSON.stringify(payload, null, 2));
  }
}

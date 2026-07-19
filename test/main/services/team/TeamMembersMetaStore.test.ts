import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const hoisted = vi.hoisted(() => ({
  teamsBase: '',
  beforeAtomicWrite: null as null | ((filePath: string, contents: string) => Promise<void>),
}));

vi.mock('@main/utils/pathDecoder', () => ({
  getTeamsBasePath: () => hoisted.teamsBase,
}));

vi.mock('../../../../src/main/services/team/atomicWrite', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('../../../../src/main/services/team/atomicWrite')
  >();
  return {
    atomicWriteAsync: async (filePath: string, contents: string) => {
      await hoisted.beforeAtomicWrite?.(filePath, contents);
      await actual.atomicWriteAsync(filePath, contents);
    },
  };
});

import { TeamMembersMetaStore } from '../../../../src/main/services/team/TeamMembersMetaStore';

describe('TeamMembersMetaStore', () => {
  let tempDir = '';

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'team-members-meta-store-'));
    hoisted.teamsBase = path.join(tempDir, 'teams');
    await fs.mkdir(hoisted.teamsBase, { recursive: true });
    hoisted.beforeAtomicWrite = null;
  });

  afterEach(async () => {
    hoisted.teamsBase = '';
    hoisted.beforeAtomicWrite = null;
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('keeps an active suffixed member when the base member is removed during writeMembers', async () => {
    const store = new TeamMembersMetaStore();
    const teamName = 'mixed-team';
    await fs.mkdir(path.join(hoisted.teamsBase, teamName), { recursive: true });

    await store.writeMembers(teamName, [
      {
        name: 'alice',
        providerId: 'codex',
        removedAt: Date.now(),
      },
      {
        name: 'alice-2',
        providerId: 'opencode',
        model: 'minimax-m2.5-free',
      },
    ]);

    const members = await store.getMembers(teamName);
    expect(members.map((member) => member.name)).toEqual(['alice', 'alice-2']);
  });

  it('keeps an active suffixed member when reading persisted metadata with a removed base member', async () => {
    const store = new TeamMembersMetaStore();
    const teamName = 'mixed-team';
    const teamDir = path.join(hoisted.teamsBase, teamName);
    await fs.mkdir(teamDir, { recursive: true });

    await fs.writeFile(
      path.join(teamDir, 'members.meta.json'),
      JSON.stringify(
        {
          version: 1,
          members: [
            {
              name: 'alice',
              providerId: 'codex',
              removedAt: Date.now(),
            },
            {
              name: 'alice-2',
              providerId: 'opencode',
              model: 'minimax-m2.5-free',
            },
          ],
        },
        null,
        2
      )
    );

    const members = await store.getMembers(teamName);
    expect(members.map((member) => member.name)).toEqual(['alice', 'alice-2']);
  });

  it('serializes two store instances so a launch rewrite retains a racing real tombstone', async () => {
    const tombstoneStore = new TeamMembersMetaStore();
    const launchStore = new TeamMembersMetaStore();
    const teamName = 'racing-team';
    const teamDir = path.join(hoisted.teamsBase, teamName);
    await fs.mkdir(teamDir, { recursive: true });
    await tombstoneStore.writeMembers(teamName, [
      { name: 'builder', role: 'Existing builder' },
      { name: 'reviewer', role: 'Existing reviewer' },
    ]);

    const removedAt = Date.parse('2026-07-19T12:00:00.000Z');
    let releaseTombstoneWrite!: () => void;
    const tombstoneWriteReleased = new Promise<void>((resolve) => {
      releaseTombstoneWrite = resolve;
    });
    let tombstoneWriteBlocked!: () => void;
    const tombstoneWriteReached = new Promise<void>((resolve) => {
      tombstoneWriteBlocked = resolve;
    });
    hoisted.beforeAtomicWrite = async (_filePath, contents) => {
      if (!contents.includes(`"removedAt": ${removedAt}`)) return;
      tombstoneWriteBlocked();
      await tombstoneWriteReleased;
    };

    const tombstoneWrite = tombstoneStore.updateMembers(teamName, (members) =>
      members.map((member) =>
        member.name === 'builder' ? { ...member, role: 'Removed builder', removedAt } : member
      )
    );
    await tombstoneWriteReached;

    let launchTransformCalled = false;
    const launchRewrite = launchStore.updateMembers(teamName, (members) => {
      launchTransformCalled = true;
      return [
        { name: 'reviewer', role: 'Relaunched reviewer' },
        ...members.filter((member) => member.removedAt != null),
      ];
    });
    await Promise.resolve();
    expect(launchTransformCalled).toBe(false);

    releaseTombstoneWrite();
    await Promise.all([tombstoneWrite, launchRewrite]);

    expect(await launchStore.getMembers(teamName)).toEqual([
      expect.objectContaining({ name: 'builder', role: 'Removed builder', removedAt }),
      expect.objectContaining({ name: 'reviewer', role: 'Relaunched reviewer' }),
    ]);
  });

  it('uses raw normalized rows for updates so an unrelated update does not delete a duplicate', async () => {
    const store = new TeamMembersMetaStore();
    const teamName = 'raw-projection-team';
    const teamDir = path.join(hoisted.teamsBase, teamName);
    const metaPath = path.join(teamDir, 'members.meta.json');
    await fs.mkdir(teamDir, { recursive: true });
    await fs.writeFile(
      metaPath,
      JSON.stringify({
        version: 1,
        members: [
          { name: 'alice', role: 'Builder' },
          { name: 'alice-2', role: 'Runtime duplicate' },
        ],
      })
    );

    expect((await store.getMembers(teamName)).map((member) => member.name)).toEqual(['alice']);

    await store.updateMembers(teamName, (members) => [
      ...members,
      { name: 'bob', role: 'Reviewer' },
    ]);

    const persisted = JSON.parse(await fs.readFile(metaPath, 'utf8')) as {
      members: Array<{ name: string }>;
    };
    expect(persisted.members.map((member) => member.name)).toEqual(['alice', 'alice-2', 'bob']);
    expect((await store.getMembers(teamName)).map((member) => member.name)).toEqual([
      'alice',
      'bob',
    ]);
  });

  it('preserves the existing provider backend during an atomic roster mutation', async () => {
    const store = new TeamMembersMetaStore();
    const teamName = 'provider-backend-team';
    const teamDir = path.join(hoisted.teamsBase, teamName);
    const metaPath = path.join(teamDir, 'members.meta.json');
    await fs.mkdir(teamDir, { recursive: true });
    await store.writeMembers(teamName, [{ name: 'alice', role: 'Builder' }], {
      providerBackendId: 'codex-native',
    });

    await store.updateMembers(teamName, async (members) => [
      ...members,
      { name: 'bob', role: 'Reviewer' },
    ]);

    const persisted = JSON.parse(await fs.readFile(metaPath, 'utf8')) as {
      providerBackendId?: string;
      members: Array<{ name: string }>;
    };
    expect(persisted.providerBackendId).toBe('codex-native');
    expect(persisted.members.map((member) => member.name)).toEqual(['alice', 'bob']);

    await store.updateMembers(teamName, (members) => [...members], {
      providerBackendId: 'opencode-cli',
    });
    const overridden = JSON.parse(await fs.readFile(metaPath, 'utf8')) as {
      providerBackendId?: string;
    };
    expect(overridden.providerBackendId).toBe('opencode-cli');
  });

  it('holds the canonical lock for writeMembers as well as updateMembers', async () => {
    const updateStore = new TeamMembersMetaStore();
    const writeStore = new TeamMembersMetaStore();
    const teamName = 'write-lock-team';
    await fs.mkdir(path.join(hoisted.teamsBase, teamName), { recursive: true });
    await updateStore.writeMembers(teamName, [{ name: 'alice' }]);

    let releaseUpdateWrite!: () => void;
    const updateWriteReleased = new Promise<void>((resolve) => {
      releaseUpdateWrite = resolve;
    });
    let updateWriteBlocked!: () => void;
    const updateWriteReached = new Promise<void>((resolve) => {
      updateWriteBlocked = resolve;
    });
    hoisted.beforeAtomicWrite = async (_filePath, contents) => {
      if (!contents.includes('Updated Alice')) return;
      updateWriteBlocked();
      await updateWriteReleased;
    };

    const update = updateStore.updateMembers(teamName, (members) =>
      members.map((member) => ({ ...member, role: 'Updated Alice' }))
    );
    await updateWriteReached;
    let replacementSettled = false;
    const replacement = writeStore
      .writeMembers(teamName, [{ name: 'bob' }])
      .finally(() => (replacementSettled = true));
    await Promise.resolve();
    expect(replacementSettled).toBe(false);

    releaseUpdateWrite();
    await Promise.all([update, replacement]);
    expect(await updateStore.getMembers(teamName)).toEqual([
      expect.objectContaining({ name: 'bob' }),
    ]);
  });

  it('releases the cross-instance lock when an atomic update write fails', async () => {
    const failingStore = new TeamMembersMetaStore();
    const recoveryStore = new TeamMembersMetaStore();
    const teamName = 'failure-team';
    const teamDir = path.join(hoisted.teamsBase, teamName);
    const metaPath = path.join(teamDir, 'members.meta.json');
    await fs.mkdir(teamDir, { recursive: true });
    await failingStore.writeMembers(teamName, [{ name: 'alice', role: 'Original' }]);

    hoisted.beforeAtomicWrite = async (_filePath, contents) => {
      if (contents.includes('Failed update')) {
        throw new Error('disk full');
      }
    };
    await expect(
      failingStore.updateMembers(teamName, (members) =>
        members.map((member) => ({ ...member, role: 'Failed update' }))
      )
    ).rejects.toThrow('disk full');
    expect(await fs.stat(`${metaPath}.lock`).catch(() => null)).toBeNull();

    hoisted.beforeAtomicWrite = null;
    await recoveryStore.updateMembers(teamName, (members) => [
      ...members,
      { name: 'bob', role: 'Recovered' },
    ]);
    expect(await recoveryStore.getMembers(teamName)).toEqual([
      expect.objectContaining({ name: 'alice', role: 'Original' }),
      expect.objectContaining({ name: 'bob', role: 'Recovered' }),
    ]);
  });
});

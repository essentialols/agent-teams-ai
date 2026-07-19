import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let teamsBasePath: string;

vi.mock('@main/utils/pathDecoder', () => ({
  getTeamsBasePath: () => teamsBasePath,
}));

describe('ReviewPersistenceScopeLock', () => {
  beforeEach(async () => {
    teamsBasePath = await mkdtemp(path.join(tmpdir(), 'review-persistence-lock-'));
  });

  afterEach(async () => {
    const { closeReviewPersistenceScopeLockDatabasesForTests } =
      await import('@main/services/team/ReviewPersistenceScopeLock');
    closeReviewPersistenceScopeLockDatabasesForTests();
    await rm(teamsBasePath, { recursive: true, force: true });
  });

  it('serializes async operations for one exact scope', async () => {
    const { withReviewPersistenceScopeLock } =
      await import('@main/services/team/ReviewPersistenceScopeLock');
    const scope = { scopeKey: 'task-task-1', scopeToken: 'task:task-1:scope' };
    let active = 0;
    let maxActive = 0;
    const run = (delayMs: number) =>
      withReviewPersistenceScopeLock('demo', scope, async () => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        active -= 1;
      });

    await Promise.all([run(40), run(10), run(10)]);

    expect(maxActive).toBe(1);
  });

  it('releases the exact lease after an operation error', async () => {
    const { withReviewPersistenceScopeLock } =
      await import('@main/services/team/ReviewPersistenceScopeLock');
    const scope = { scopeKey: 'task-task-1', scopeToken: 'task:task-1:error' };

    await expect(
      withReviewPersistenceScopeLock('demo', scope, async () => {
        throw new Error('operation failed');
      })
    ).rejects.toThrow('operation failed');
    await expect(
      withReviewPersistenceScopeLock('demo', scope, async () => 'recovered')
    ).resolves.toBe('recovered');
  });

  it('rejects path-like scope identities before opening the database', async () => {
    const { withReviewPersistenceScopeLock } =
      await import('@main/services/team/ReviewPersistenceScopeLock');

    await expect(
      withReviewPersistenceScopeLock('../outside', {
        scopeKey: 'task-task-1',
        scopeToken: 'scope',
      }, async () => undefined)
    ).rejects.toThrow('Invalid review persistence lock team name');
  });
});

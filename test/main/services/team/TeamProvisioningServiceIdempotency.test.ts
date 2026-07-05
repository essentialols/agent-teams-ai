import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const hoisted = vi.hoisted(() => ({
  paths: {
    claudeRoot: '',
    teamsBase: '',
  },
}));

let tempClaudeRoot = '';
let tempTeamsBase = '';

vi.mock('@main/utils/pathDecoder', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@main/utils/pathDecoder')>();
  return {
    ...actual,
    getAutoDetectedClaudeBasePath: () => hoisted.paths.claudeRoot,
    getClaudeBasePath: () => hoisted.paths.claudeRoot,
    getTeamsBasePath: () => hoisted.paths.teamsBase,
  };
});

import { TeamProvisioningService } from '@main/services/team/TeamProvisioningService';

type LaunchGuardTestAccess = {
  aliveRunByTeam: Map<string, string>;
  getResolvableProvisioningRunId(teamName: string): string | null;
  provisioningRunByTeam: Map<string, string>;
  runtimeAdapterProgressByRunId: Map<string, unknown>;
  runs: Map<string, unknown>;
};

function getLaunchGuardTestAccess(svc: TeamProvisioningService): LaunchGuardTestAccess {
  return svc as unknown as LaunchGuardTestAccess;
}

describe('TeamProvisioningService idempotent launch guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tempClaudeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-team-launch-'));
    tempTeamsBase = path.join(tempClaudeRoot, 'teams');
    hoisted.paths.claudeRoot = tempClaudeRoot;
    hoisted.paths.teamsBase = tempTeamsBase;
    fs.mkdirSync(tempTeamsBase, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tempClaudeRoot, { recursive: true, force: true });
    hoisted.paths.claudeRoot = '';
    hoisted.paths.teamsBase = '';
  });

  it('reuses the alive run instead of spawning a duplicate launch', async () => {
    const teamName = 'team-alpha';
    const teamDir = path.join(tempTeamsBase, teamName);
    fs.mkdirSync(teamDir, { recursive: true });
    fs.writeFileSync(
      path.join(teamDir, 'config.json'),
      JSON.stringify({
        name: teamName,
        projectPath: process.cwd(),
        members: [{ name: 'team-lead', agentType: 'team-lead' }, { name: 'dev' }],
      })
    );

    const svc = new TeamProvisioningService();
    const aliveRun = {
      runId: 'alive-run-1',
      teamName,
      request: { cwd: process.cwd() },
      child: Object.assign(new EventEmitter(), {
        stdin: { writable: true },
        stdout: new EventEmitter(),
        stderr: new EventEmitter(),
      }),
      processKilled: false,
      cancelRequested: false,
    };

    const internals = getLaunchGuardTestAccess(svc);
    internals.runs.set(aliveRun.runId, aliveRun);
    internals.aliveRunByTeam.set(teamName, aliveRun.runId);

    const response = await svc.launchTeam({ teamName, cwd: process.cwd() }, () => {});

    expect(response.runId).toBe(aliveRun.runId);
  });

  it('returns already_launching for an active provisioning run', async () => {
    const teamName = 'team-alpha';
    const runId = 'launching-run-1';
    const svc = new TeamProvisioningService();

    const internals = getLaunchGuardTestAccess(svc);
    internals.provisioningRunByTeam.set(teamName, runId);
    internals.runs.set(runId, { runId, teamName });

    const response = await svc.launchTeam({ teamName, cwd: process.cwd() }, () => {});

    expect(response).toMatchObject({
      runId,
      launchStatus: 'already_launching',
      alreadyLaunching: true,
    });
  });

  it('returns already_launching for active runtime adapter progress', async () => {
    const teamName = 'team-alpha';
    const runId = 'runtime-adapter-run-1';
    const svc = new TeamProvisioningService();

    const internals = getLaunchGuardTestAccess(svc);
    internals.provisioningRunByTeam.set(teamName, runId);
    internals.runtimeAdapterProgressByRunId.set(runId, { runId, state: 'finalizing' });

    const response = await svc.launchTeam({ teamName, cwd: process.cwd() }, () => {});

    expect(response).toMatchObject({
      runId,
      launchStatus: 'already_launching',
      alreadyLaunching: true,
    });
  });

  it('does not expose unresolved internal provisioning ids', () => {
    const teamName = 'team-alpha';
    const svc = new TeamProvisioningService();

    const internals = getLaunchGuardTestAccess(svc);
    internals.provisioningRunByTeam.set(teamName, 'pending-stale-run');

    expect(internals.getResolvableProvisioningRunId(teamName)).toBeNull();
    expect(internals.provisioningRunByTeam.get(teamName)).toBeUndefined();
  });

  it('keeps runtime adapter provisioning ids while their progress is still tracked', () => {
    const teamName = 'team-alpha';
    const runId = 'runtime-adapter-run-1';
    const svc = new TeamProvisioningService();

    const internals = getLaunchGuardTestAccess(svc);
    internals.provisioningRunByTeam.set(teamName, runId);
    internals.runtimeAdapterProgressByRunId.set(runId, { runId, state: 'launching' });

    expect(internals.getResolvableProvisioningRunId(teamName)).toBe(runId);
    expect(internals.provisioningRunByTeam.get(teamName)).toBe(runId);
  });

  it('clears stale pending provisioning ids before reusing an alive run', async () => {
    const teamName = 'team-alpha';
    const teamDir = path.join(tempTeamsBase, teamName);
    fs.mkdirSync(teamDir, { recursive: true });
    fs.writeFileSync(
      path.join(teamDir, 'config.json'),
      JSON.stringify({
        name: teamName,
        projectPath: process.cwd(),
        members: [{ name: 'team-lead', agentType: 'team-lead' }, { name: 'dev' }],
      })
    );

    const svc = new TeamProvisioningService();
    const aliveRun = {
      runId: 'alive-run-1',
      teamName,
      request: { cwd: process.cwd() },
      child: Object.assign(new EventEmitter(), {
        stdin: { writable: true },
        stdout: new EventEmitter(),
        stderr: new EventEmitter(),
      }),
      processKilled: false,
      cancelRequested: false,
    };

    const internals = getLaunchGuardTestAccess(svc);
    internals.provisioningRunByTeam.set(teamName, 'pending-stale-run');
    internals.runs.set(aliveRun.runId, aliveRun);
    internals.aliveRunByTeam.set(teamName, aliveRun.runId);

    const response = await svc.launchTeam({ teamName, cwd: process.cwd() }, () => {});

    expect(response.runId).toBe(aliveRun.runId);
    expect(internals.provisioningRunByTeam.get(teamName)).toBeUndefined();
  });

  it('does not reuse an alive run when cwd differs', async () => {
    const teamName = 'team-alpha';
    const currentCwd = fs.mkdtempSync(path.join(tempClaudeRoot, 'current-'));
    const nextCwd = fs.mkdtempSync(path.join(tempClaudeRoot, 'next-'));
    const teamDir = path.join(tempTeamsBase, teamName);
    fs.mkdirSync(teamDir, { recursive: true });
    fs.writeFileSync(
      path.join(teamDir, 'config.json'),
      JSON.stringify({
        name: teamName,
        projectPath: currentCwd,
        members: [{ name: 'team-lead', agentType: 'team-lead' }, { name: 'dev' }],
      })
    );

    const svc = new TeamProvisioningService();
    const aliveRun = {
      runId: 'alive-run-1',
      teamName,
      request: { cwd: currentCwd },
      child: Object.assign(new EventEmitter(), {
        stdin: { writable: true },
        stdout: new EventEmitter(),
        stderr: new EventEmitter(),
      }),
      processKilled: false,
      cancelRequested: false,
    };

    const internals = getLaunchGuardTestAccess(svc);
    internals.runs.set(aliveRun.runId, aliveRun);
    internals.aliveRunByTeam.set(teamName, aliveRun.runId);

    await expect(svc.launchTeam({ teamName, cwd: nextCwd }, () => {})).rejects.toThrow(
      `Team "${teamName}" is already running in "${path.resolve(currentCwd)}".`
    );
  });

  it('fails closed when an alive run cwd cannot be determined', async () => {
    const teamName = 'team-alpha';
    const nextCwd = fs.mkdtempSync(path.join(tempClaudeRoot, 'next-'));
    const teamDir = path.join(tempTeamsBase, teamName);
    fs.mkdirSync(teamDir, { recursive: true });
    fs.writeFileSync(
      path.join(teamDir, 'config.json'),
      JSON.stringify({
        name: teamName,
        members: [{ name: 'team-lead', agentType: 'team-lead' }, { name: 'dev' }],
      })
    );

    const svc = new TeamProvisioningService();
    const aliveRun = {
      runId: 'alive-run-1',
      teamName,
      request: { cwd: '' },
      child: Object.assign(new EventEmitter(), {
        stdin: { writable: true },
        stdout: new EventEmitter(),
        stderr: new EventEmitter(),
      }),
      processKilled: false,
      cancelRequested: false,
      spawnContext: { cwd: '' },
    };

    const internals = getLaunchGuardTestAccess(svc);
    internals.runs.set(aliveRun.runId, aliveRun);
    internals.aliveRunByTeam.set(teamName, aliveRun.runId);

    await expect(svc.launchTeam({ teamName, cwd: nextCwd }, () => {})).rejects.toThrow(
      `Team "${teamName}" is already running, but its cwd could not be determined.`
    );
  });
});

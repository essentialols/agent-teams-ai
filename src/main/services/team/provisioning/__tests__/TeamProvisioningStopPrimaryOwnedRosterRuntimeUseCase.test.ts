import { describe, expect, it } from 'vitest';

import { createStopPrimaryOwnedRosterRuntimeUseCase } from '../TeamProvisioningStopPrimaryOwnedRosterRuntimeUseCase';

function createPorts(
  overrides: {
    lingeringPids?: number[];
    lingeringPaneIds?: string[];
    throwOnPane?: string;
    throwOnPid?: number;
  } = {}
) {
  const calls = {
    killedPanes: [] as string[],
    killedPids: [] as number[],
    waitPidCalls: [] as Array<{ pids: readonly number[]; timeoutMs: number; pollMs: number }>,
    waitPaneCalls: [] as Array<{ paneIds: readonly string[]; timeoutMs: number; pollMs: number }>,
    debug: [] as string[],
  };

  return {
    calls,
    ports: {
      killTmuxPane(paneId: string) {
        calls.killedPanes.push(paneId);
        if (paneId === overrides.throwOnPane) {
          throw new Error(`pane failed ${paneId}`);
        }
      },
      killProcess(pid: number) {
        calls.killedPids.push(pid);
        if (pid === overrides.throwOnPid) {
          throw new Error(`pid failed ${pid}`);
        }
      },
      async waitForPidsToExit(
        pids: readonly number[],
        options: { timeoutMs: number; pollMs: number }
      ) {
        calls.waitPidCalls.push({ pids, ...options });
        return overrides.lingeringPids ?? [];
      },
      async waitForTmuxPanesToExit(
        paneIds: readonly string[],
        options: { timeoutMs: number; pollMs: number }
      ) {
        calls.waitPaneCalls.push({ paneIds, ...options });
        return overrides.lingeringPaneIds ?? [];
      },
      logDebug(message: string) {
        calls.debug.push(message);
      },
    },
  };
}

describe('TeamProvisioningStopPrimaryOwnedRosterRuntimeUseCase', () => {
  it('stops persisted and live primary-owned runtime handles through narrow ports', async () => {
    const { calls, ports } = createPorts();
    const stopPrimaryOwnedRosterRuntime = createStopPrimaryOwnedRosterRuntimeUseCase(ports);

    await stopPrimaryOwnedRosterRuntime({
      teamName: 'team-a',
      memberName: 'Worker',
      actionLabel: 'Detach for teammate "Worker"',
      persistedRuntimeMembers: [
        { backendType: 'process', runtimePid: 111 },
        { backendType: 'tmux', tmuxPaneId: ' pane-a ' },
      ],
      liveRuntimeByMember: new Map([
        [
          'Worker',
          {
            alive: true,
            backendType: 'tmux',
            tmuxPaneId: 'pane-b',
            pid: 222,
            metricsPid: 333,
          },
        ],
        ['Other', { alive: true, backendType: 'process', pid: 444 }],
      ]),
    });

    expect(calls.killedPanes).toEqual(['pane-a', 'pane-b']);
    expect(calls.killedPids).toEqual([111, 222, 333]);
    expect(calls.waitPidCalls).toEqual([{ pids: [111, 222, 333], timeoutMs: 1_500, pollMs: 100 }]);
    expect(calls.waitPaneCalls).toEqual([
      { paneIds: ['pane-a', 'pane-b'], timeoutMs: 1_500, pollMs: 100 },
    ]);
  });

  it('logs stop-handle kill failures and still waits for collected handles', async () => {
    const { calls, ports } = createPorts({ throwOnPane: 'pane-a', throwOnPid: 111 });
    const stopPrimaryOwnedRosterRuntime = createStopPrimaryOwnedRosterRuntimeUseCase(ports);

    await stopPrimaryOwnedRosterRuntime({
      teamName: 'team-a',
      memberName: 'Worker',
      actionLabel: 'Update for teammate "Worker"',
      persistedRuntimeMembers: [
        { backendType: 'process', runtimePid: 111 },
        { backendType: 'tmux', tmuxPaneId: 'pane-a' },
      ],
      liveRuntimeByMember: new Map(),
    });

    expect(calls.waitPidCalls).toEqual([{ pids: [111], timeoutMs: 1_500, pollMs: 100 }]);
    expect(calls.waitPaneCalls).toEqual([{ paneIds: ['pane-a'], timeoutMs: 1_500, pollMs: 100 }]);
    expect(calls.debug).toEqual([
      expect.stringContaining('Failed to stop teammate pane Worker pane-a'),
      expect.stringContaining('Failed to stop teammate process Worker pid=111'),
    ]);
  });

  it('rejects alive runtime metadata without a pid or tmux pane', async () => {
    const { calls, ports } = createPorts();
    const stopPrimaryOwnedRosterRuntime = createStopPrimaryOwnedRosterRuntimeUseCase(ports);

    await expect(
      stopPrimaryOwnedRosterRuntime({
        teamName: 'team-a',
        memberName: 'Worker',
        actionLabel: 'Detach for teammate "Worker"',
        persistedRuntimeMembers: [],
        liveRuntimeByMember: new Map([['Worker', { alive: true, backendType: 'process' }]]),
      })
    ).rejects.toThrow(
      'Detach for teammate "Worker" cannot stop the existing runtime because it does not expose a pid or tmux pane.'
    );
    expect(calls.killedPanes).toEqual([]);
    expect(calls.killedPids).toEqual([]);
  });

  it('surfaces lingering process and pane evidence after stop attempts', async () => {
    const processPorts = createPorts({ lingeringPids: [111] });
    const stopProcessRuntime = createStopPrimaryOwnedRosterRuntimeUseCase(processPorts.ports);

    await expect(
      stopProcessRuntime({
        teamName: 'team-a',
        memberName: 'Worker',
        actionLabel: 'Detach for teammate "Worker"',
        persistedRuntimeMembers: [{ backendType: 'process', runtimePid: 111 }],
        liveRuntimeByMember: new Map(),
      })
    ).rejects.toThrow('Detach for teammate "Worker" is still waiting for process exit (111).');

    const panePorts = createPorts({ lingeringPaneIds: ['pane-a'] });
    const stopPaneRuntime = createStopPrimaryOwnedRosterRuntimeUseCase(panePorts.ports);

    await expect(
      stopPaneRuntime({
        teamName: 'team-a',
        memberName: 'Worker',
        actionLabel: 'Detach for teammate "Worker"',
        persistedRuntimeMembers: [{ backendType: 'tmux', tmuxPaneId: 'pane-a' }],
        liveRuntimeByMember: new Map(),
      })
    ).rejects.toThrow('Detach for teammate "Worker" is still waiting for tmux pane exit (pane-a).');
  });
});

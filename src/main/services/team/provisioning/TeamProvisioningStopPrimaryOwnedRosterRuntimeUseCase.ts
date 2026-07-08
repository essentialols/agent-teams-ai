import {
  killTmuxPaneForCurrentPlatformSync,
  listTmuxPanePidsForCurrentPlatform,
} from '@features/tmux-installer/main';
import { isProcessAlive } from '@main/utils/processHealth';
import { killProcessByPid } from '@main/utils/processKill';
import { createLogger } from '@shared/utils/logger';

import { matchesObservedMemberNameForExpected } from './TeamProvisioningMemberIdentity';

const logger = createLogger('Service:TeamProvisioning');

export interface PrimaryOwnedRosterRuntimeMember {
  backendType?: string;
  runtimePid?: number;
  tmuxPaneId?: string;
}

export interface PrimaryOwnedRosterLiveRuntimeMetadata {
  alive?: boolean;
  backendType?: string;
  metricsPid?: number;
  pid?: number;
  tmuxPaneId?: string;
}

export interface StopPrimaryOwnedRosterRuntimeInput {
  teamName: string;
  memberName: string;
  persistedRuntimeMembers: readonly PrimaryOwnedRosterRuntimeMember[];
  liveRuntimeByMember: ReadonlyMap<string, PrimaryOwnedRosterLiveRuntimeMetadata>;
  actionLabel: string;
}

export interface StopPrimaryOwnedRosterRuntimeUseCasePorts {
  killTmuxPane(paneId: string): void;
  killProcess(pid: number): void;
  waitForPidsToExit(
    pids: readonly number[],
    options: { timeoutMs: number; pollMs: number }
  ): Promise<number[]>;
  waitForTmuxPanesToExit(
    paneIds: readonly string[],
    options: { timeoutMs: number; pollMs: number }
  ): Promise<string[]>;
  logDebug(message: string): void;
}

export type StopPrimaryOwnedRosterRuntimeUseCase = (
  input: StopPrimaryOwnedRosterRuntimeInput
) => Promise<void>;

export function createNodeStopPrimaryOwnedRosterRuntimeUseCase(): StopPrimaryOwnedRosterRuntimeUseCase {
  return createStopPrimaryOwnedRosterRuntimeUseCase({
    killTmuxPane: (paneId) => killTmuxPaneForCurrentPlatformSync(paneId),
    killProcess: (pid) => killProcessByPid(pid),
    waitForPidsToExit,
    waitForTmuxPanesToExit,
    logDebug: (message) => logger.debug(message),
  });
}

export function createStopPrimaryOwnedRosterRuntimeUseCase(
  ports: StopPrimaryOwnedRosterRuntimeUseCasePorts
): StopPrimaryOwnedRosterRuntimeUseCase {
  return async (input) => {
    const pidsToStop = new Set<number>();
    const tmuxPaneIdsToStop = new Set<string>();
    let hasAliveRuntimeWithoutStopHandle = false;

    for (const runtimeMember of input.persistedRuntimeMembers) {
      const backendType = runtimeMember.backendType?.trim().toLowerCase();
      if (backendType === 'in-process') {
        throw new Error(
          `Member "${input.memberName}" uses an in-process runtime and cannot be detached here`
        );
      }
      if (
        backendType === 'process' &&
        typeof runtimeMember.runtimePid === 'number' &&
        Number.isFinite(runtimeMember.runtimePid) &&
        runtimeMember.runtimePid > 0
      ) {
        pidsToStop.add(runtimeMember.runtimePid);
      }
      const paneId =
        typeof runtimeMember.tmuxPaneId === 'string' ? runtimeMember.tmuxPaneId.trim() : '';
      if (backendType === 'tmux' && paneId) {
        tmuxPaneIdsToStop.add(paneId);
      }
    }

    for (const [candidateName, metadata] of input.liveRuntimeByMember.entries()) {
      if (!matchesObservedMemberNameForExpected(candidateName, input.memberName)) {
        continue;
      }
      if (metadata.backendType === 'in-process') {
        throw new Error(
          `Member "${input.memberName}" uses an in-process runtime and cannot be detached here`
        );
      }

      let hasStopHandle = false;
      if (metadata.backendType === 'tmux') {
        const paneId = metadata.tmuxPaneId?.trim();
        if (paneId) {
          tmuxPaneIdsToStop.add(paneId);
          hasStopHandle = true;
        }
      }
      if (typeof metadata.pid === 'number' && Number.isFinite(metadata.pid) && metadata.pid > 0) {
        pidsToStop.add(metadata.pid);
        hasStopHandle = true;
      }
      if (
        typeof metadata.metricsPid === 'number' &&
        Number.isFinite(metadata.metricsPid) &&
        metadata.metricsPid > 0
      ) {
        pidsToStop.add(metadata.metricsPid);
        hasStopHandle = true;
      }
      if (metadata.alive && !hasStopHandle) {
        hasAliveRuntimeWithoutStopHandle = true;
      }
    }

    if (hasAliveRuntimeWithoutStopHandle) {
      throw new Error(
        `${input.actionLabel} cannot stop the existing runtime because it does not expose a pid or tmux pane.`
      );
    }

    for (const paneId of tmuxPaneIdsToStop) {
      try {
        ports.killTmuxPane(paneId);
      } catch (error) {
        ports.logDebug(
          `[${input.teamName}] Failed to stop teammate pane ${input.memberName} ${paneId} for live roster lifecycle: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
    for (const pid of pidsToStop) {
      try {
        ports.killProcess(pid);
      } catch (error) {
        ports.logDebug(
          `[${input.teamName}] Failed to stop teammate process ${input.memberName} pid=${pid} for live roster lifecycle: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    if (pidsToStop.size > 0) {
      const lingeringPids = await ports.waitForPidsToExit([...pidsToStop], {
        timeoutMs: 1_500,
        pollMs: 100,
      });
      if (lingeringPids.length > 0) {
        throw new Error(
          `${input.actionLabel} is still waiting for process exit (${lingeringPids.join(', ')}).`
        );
      }
    }
    if (tmuxPaneIdsToStop.size > 0) {
      const lingeringPaneIds = await ports.waitForTmuxPanesToExit([...tmuxPaneIdsToStop], {
        timeoutMs: 1_500,
        pollMs: 100,
      });
      if (lingeringPaneIds.length > 0) {
        throw new Error(
          `${input.actionLabel} is still waiting for tmux pane exit (${lingeringPaneIds.join(', ')}).`
        );
      }
    }
  };
}

async function waitForPidsToExit(
  pids: readonly number[],
  options: { timeoutMs: number; pollMs: number }
): Promise<number[]> {
  const uniquePids = [...new Set(pids.filter((pid) => Number.isFinite(pid) && pid > 0))];
  if (uniquePids.length === 0) {
    return [];
  }
  const deadline = Date.now() + options.timeoutMs;
  while (Date.now() < deadline) {
    const alive = uniquePids.filter((pid) => isProcessAlive(pid));
    if (alive.length === 0) {
      return [];
    }
    await new Promise((resolve) => setTimeout(resolve, options.pollMs));
  }
  return uniquePids.filter((pid) => isProcessAlive(pid));
}

async function waitForTmuxPanesToExit(
  paneIds: readonly string[],
  options: { timeoutMs: number; pollMs: number }
): Promise<string[]> {
  const uniquePaneIds = [...new Set(paneIds.map((paneId) => paneId.trim()).filter(Boolean))];
  if (uniquePaneIds.length === 0) {
    return [];
  }
  const deadline = Date.now() + options.timeoutMs;
  while (Date.now() < deadline) {
    let paneInfo: Map<string, number>;
    try {
      paneInfo = await listTmuxPanePidsForCurrentPlatform(uniquePaneIds);
    } catch (error) {
      if (isTmuxServerUnavailableError(error)) {
        return [];
      }
      throw error;
    }
    const alive = uniquePaneIds.filter((paneId) => paneInfo.has(paneId));
    if (alive.length === 0) {
      return [];
    }
    await new Promise((resolve) => setTimeout(resolve, options.pollMs));
  }
  let finalPaneInfo: Map<string, number>;
  try {
    finalPaneInfo = await listTmuxPanePidsForCurrentPlatform(uniquePaneIds);
  } catch (error) {
    if (isTmuxServerUnavailableError(error)) {
      return [];
    }
    throw error;
  }
  return uniquePaneIds.filter((paneId) => finalPaneInfo.has(paneId));
}

function isTmuxServerUnavailableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /error connecting to .*tmux.*No such file or directory/i.test(message);
}

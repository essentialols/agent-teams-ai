import { describe, expect, it, vi } from 'vitest';

import {
  createTeamProvisioningStreamEventPorts,
  type TeamProvisioningStreamEventPortCallbacks,
  type TeamProvisioningStreamEventPortsFactoryRun,
} from '../TeamProvisioningStreamEventPortsFactory';
import { handleTeamProvisioningStreamJsonMessage } from '../TeamProvisioningStreamEvents';

import type { TeamProvisioningProgress } from '@shared/types';

type TestRun = TeamProvisioningStreamEventPortsFactoryRun;

function createProgress(
  overrides: Partial<TeamProvisioningProgress> = {}
): TeamProvisioningProgress {
  return {
    state: 'assembling',
    message: 'starting',
    startedAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as TeamProvisioningProgress;
}

function createRun(overrides: Partial<TestRun> = {}): TestRun {
  return {
    runId: 'run-1',
    teamName: 'atlas-hq',
    detectedSessionId: null,
    deterministicBootstrapMemberSpawnSeen: false,
    deterministicBootstrapMemberResultSeen: false,
    lastDeterministicBootstrapSeq: 0,
    requiresFirstRealTurnSuccess: false,
    provisioningComplete: false,
    cancelRequested: false,
    processKilled: false,
    progress: createProgress(),
    onProgress: vi.fn(),
    child: null,
    pendingMemberRestarts: new Map(),
    memberSpawnStatuses: new Map(),
    isLaunch: false,
    anthropicApiKeyHelper: null,
    leadRelayCapture: null,
    pendingToolCalls: [],
    liveLeadTextBuffer: null,
    silentUserDmForward: null,
    suppressPostCompactReminderOutput: false,
    pendingDirectCrossTeamSendRefresh: false,
    pendingPostCompactReminder: false,
    postCompactReminderInFlight: false,
    pendingGeminiPostLaunchHydration: false,
    geminiPostLaunchHydrationInFlight: false,
    suppressGeminiPostLaunchHydrationOutput: false,
    activeCrossTeamReplyHints: [],
    pendingInboxRelayCandidates: [],
    silentUserDmForwardClearHandle: null,
    leadContextUsage: null,
    apiRetryWarningIndex: null,
    provisioningOutputParts: [],
    lastRetryAt: 0,
    apiErrorWarningEmitted: false,
    provisioningTraceLines: [],
    lastProvisioningTraceKey: null,
    provisioningOutputIndexByMessageId: new Map(),
    stallWarningIndex: null,
    claudeLogLines: [],
    stdoutBuffer: '',
    stderrBuffer: '',
    request: {},
    ...overrides,
  } as TestRun;
}

function createCallbacks(
  overrides: Partial<TeamProvisioningStreamEventPortCallbacks<TestRun>> = {}
): TeamProvisioningStreamEventPortCallbacks<TestRun> {
  return {
    updateProgress: vi.fn((_run, state, message) => createProgress({ state, message })),
    resetLiveLeadTextBuffer: vi.fn(),
    handleTeammatePermissionRequest: vi.fn(),
    finishRuntimeToolActivity: vi.fn(),
    handleNativeTeammateUserMessage: vi.fn(),
    handleAuthFailureInOutput: vi.fn(),
    failProvisioningWithApiError: vi.fn(),
    appendProvisioningAssistantText: vi.fn(),
    pushLiveLeadTextMessage: vi.fn(),
    startRuntimeToolActivity: vi.fn(),
    getRunLeadName: vi.fn(() => 'Lead'),
    captureTeamSpawnEvents: vi.fn(),
    captureSendMessages: vi.fn(),
    emitLeadContextUsage: vi.fn(),
    resetRuntimeToolActivity: vi.fn(),
    setLeadActivity: vi.fn(),
    emitTeamChange: vi.fn(),
    pushLiveLeadProcessMessage: vi.fn(),
    injectPostCompactReminder: vi.fn(async () => undefined),
    injectGeminiPostLaunchHydration: vi.fn(async () => undefined),
    completeProvisioningFromSuccessfulResult: vi.fn(),
    handleControlRequest: vi.fn(),
    handleProvisioningTurnComplete: vi.fn(async () => undefined),
    cleanupRun: vi.fn(),
    emitApiErrorWarning: vi.fn(),
    setMemberSpawnStatus: vi.fn(),
    appendMemberBootstrapDiagnostic: vi.fn(),
    reevaluateMemberLaunchStatus: vi.fn(async () => undefined),
    invalidateRuntimeSnapshotCaches: vi.fn(),
    markUnconfirmedBootstrapMembersFailed: vi.fn(),
    stopPersistentTeamMembers: vi.fn(),
    persistLaunchStateSnapshot: vi.fn(async () => undefined),
    ...overrides,
  };
}

describe('TeamProvisioningStreamEventPortsFactory', () => {
  it('wires service callbacks and shared provisioning helpers into stream event ports', () => {
    const callbacks = createCallbacks();
    const ports = createTeamProvisioningStreamEventPorts(callbacks);
    const run = createRun({ claudeLogLines: ['first', 'second'] });

    expect(ports.updateProgress(run, 'finalizing', 'done')).toEqual(
      createProgress({ state: 'finalizing', message: 'done' })
    );
    ports.resetLiveLeadTextBuffer(run);
    ports.emitTeamChange({ type: 'inbox', teamName: 'atlas-hq', detail: 'user.json' });

    expect(callbacks.updateProgress).toHaveBeenCalledWith(run, 'finalizing', 'done');
    expect(callbacks.resetLiveLeadTextBuffer).toHaveBeenCalledWith(run);
    expect(callbacks.emitTeamChange).toHaveBeenCalledWith({
      type: 'inbox',
      teamName: 'atlas-hq',
      detail: 'user.json',
    });
    expect(ports.extractCliLogsFromRun(run)).toBe('first\nsecond');
  });

  it('keeps assistant stream-json behavior routed through the extracted ports', () => {
    const callbacks = createCallbacks();
    const ports = createTeamProvisioningStreamEventPorts(callbacks);
    const run = createRun();
    const msg = {
      type: 'assistant',
      content: [{ type: 'text', text: 'Ready to coordinate' }],
    };

    handleTeamProvisioningStreamJsonMessage(run, msg, ports);

    expect(callbacks.handleAuthFailureInOutput).toHaveBeenCalledWith(
      run,
      'Ready to coordinate',
      'assistant'
    );
    expect(callbacks.appendProvisioningAssistantText).toHaveBeenCalledWith(
      run,
      msg,
      'Ready to coordinate'
    );
    expect(callbacks.pushLiveLeadTextMessage).toHaveBeenCalledWith(
      run,
      'Ready to coordinate',
      undefined,
      undefined,
      { coalesceStreamChunk: false }
    );
    expect(callbacks.captureTeamSpawnEvents).toHaveBeenCalledWith(run, msg.content);
    expect(callbacks.captureSendMessages).toHaveBeenCalledWith(run, msg.content);
  });
});

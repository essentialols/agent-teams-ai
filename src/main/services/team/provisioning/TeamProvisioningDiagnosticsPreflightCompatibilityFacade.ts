import { createLogger } from '@shared/utils/logger';
import { getTeamsBasePath } from '@main/utils/pathDecoder';

import { type OpenCodePromptDeliveryLedgerRecord } from '../opencode/delivery/OpenCodePromptDeliveryLedger';
import { boundLaunchDiagnostics } from '../progressPayload';
import { type TeamMembersMetaStore } from '../TeamMembersMetaStore';

import {
  createTeamProvisioningOpenCodeBootstrapStallReconciliationPorts,
  createTeamProvisioningOpenCodeBootstrapStallStatusPorts,
  type TeamProvisioningOpenCodeBootstrapStallReconciliationPorts,
} from './TeamProvisioningBootstrapStallPortsFactory';
import { type BootstrapTranscriptOutcome } from './TeamProvisioningBootstrapTranscript';
import { type TeamProvisioningBootstrapTranscriptFacade } from './TeamProvisioningBootstrapTranscriptFacade';
import { readTeamProvisioningClaudeLogs } from './TeamProvisioningClaudeLogs';
import { getCliHelpOutputWithProvisioningPorts } from './TeamProvisioningCliHelpOutputPortsFactory';
import { buildLaunchDiagnosticsFromRun } from './TeamProvisioningLaunchDiagnostics';
import { type TeamProvisioningLaunchIdentityBoundary } from './TeamProvisioningLaunchIdentityBoundaryFactory';
import { getLeadActivityStateForTeam } from './TeamProvisioningLeadActivity';
import { getLeadContextUsageForTeam } from './TeamProvisioningLeadContextUsage';
import { type TeamProvisioningLiveLeadMessagePortsBoundary } from './TeamProvisioningLiveLeadMessagePortsFactory';
import { TeamProvisioningMemberLifecycleCompatibilityFacade } from './TeamProvisioningMemberLifecycleCompatibilityFacade';
import {
  confirmMemberSpawnStatusFromTranscriptForRun,
  getMemberSpawnStatusesSnapshot,
  maybeAuditMemberSpawnStatusesForRun,
  type MemberSpawnStatusAuditPorts,
  type MemberSpawnStatusMutationPorts,
  setMemberSpawnStatusForRun,
} from './TeamProvisioningMemberSpawnSnapshots';
import { MEMBER_LAUNCH_GRACE_MS } from './TeamProvisioningMemberSpawnStatusPolicy';
import {
  createTeamProvisioningMemberSpawnStatusesSnapshotHostFromService,
  createTeamProvisioningMemberSpawnStatusesSnapshotPortsBoundary,
  type TeamProvisioningMemberSpawnStatusesSnapshotServiceHost,
} from './TeamProvisioningMemberSpawnStatusSnapshotPortsFactory';
import {
  isOpenCodeBootstrapStallWindowElapsed as isOpenCodeBootstrapStallWindowElapsedHelper,
  type OpenCodeBootstrapStallRetryPromptPorts,
  type OpenCodeBootstrapStallStatusPorts,
  scheduleOpenCodeBootstrapStallReevaluation as scheduleOpenCodeBootstrapStallReevaluationHelper,
} from './TeamProvisioningOpenCodeBootstrapStall';
import {
  scheduleOpenCodeMemberInboxDeliveryWakeWithPorts,
  type OpenCodeMemberInboxDeliveryWakePorts,
} from './TeamProvisioningOpenCodeMemberInboxRelay';
import { type OpenCodeRuntimeControlAck } from './TeamProvisioningOpenCodeRuntimeCheckin';
import {
  getOpenCodeMemberDeliveryBusyStatus as getOpenCodeMemberDeliveryBusyStatusWithPorts,
  tryGetActiveOpenCodePromptDeliveryRecord as tryGetActiveOpenCodePromptDeliveryRecordWithPorts,
  type OpenCodeDeliveryIdentityResolution,
  type OpenCodeMemberDeliveryBusyStatusPorts,
} from './TeamProvisioningOpenCodeRuntimeDelivery';
import {
  createTeamProvisioningOpenCodeRuntimeDeliveryBoundaryFromHost,
  createTeamProvisioningOpenCodeRuntimeDeliveryBoundaryHostFromService,
  type TeamProvisioningOpenCodeRuntimeDeliveryBoundary,
  type TeamProvisioningOpenCodeRuntimeDeliveryBoundaryHost,
  type TeamProvisioningOpenCodeRuntimeDeliveryBoundaryServiceHost,
} from './TeamProvisioningOpenCodeRuntimeDeliveryBoundaryFactory';
import { type TeamProvisioningPrepareFacade } from './TeamProvisioningPrepareFacade';
import { type TeamProvisioningProviderRuntimeFacade } from './TeamProvisioningProviderRuntimeFacade';
import { type TeamProvisioningReevaluateMemberLaunchStatusBoundary } from './TeamProvisioningReevaluateMemberLaunchStatusPortsFactory';
import { type RetainedClaudeLogsSnapshot } from './TeamProvisioningRetainedLogs';
import { type ProvisioningRun, VERIFY_TIMEOUT_MS } from './TeamProvisioningRunModel';
import { nowIso } from './TeamProvisioningRunProgress';
import {
  buildTeamRuntimeLaunchArgsPlan as buildTeamRuntimeLaunchArgsPlanHelper,
  type BuildTeamRuntimeLaunchArgsPlanInput,
  type RuntimeProviderLaunchFacts,
  type TeamRuntimeLaunchArgsPlan,
  type ValidConfigProbeResult,
} from './TeamProvisioningRuntimeLaunchSelection';
import {
  isOpenCodeRuntimeRecipient as isOpenCodeRuntimeRecipientHelper,
  resolveRuntimeRecipientProviderId as resolveRuntimeRecipientProviderIdHelper,
} from './TeamProvisioningRuntimeRecipientResolution';
import { type TeamProvisioningRuntimeSnapshotFacade } from './TeamProvisioningRuntimeSnapshotFacade';
import { type RuntimeToolActivityHandlers } from './TeamProvisioningRuntimeToolActivity';
import {
  buildRuntimeTurnSettledHookSettingsArgs as buildRuntimeTurnSettledHookSettingsArgsHelper,
  buildRuntimeTurnSettledHookSettingsObject as buildRuntimeTurnSettledHookSettingsObjectHelper,
  type RuntimeTurnSettledEnvironmentProvider,
  type RuntimeTurnSettledHookSettingsProvider,
} from './TeamProvisioningRuntimeTurnSettledPlanning';
import { type TeamProvisioningRunTrackingDeliveryHelper } from './TeamProvisioningRunTrackingDelivery';
import { type RuntimeAdapterRunByTeamEntry } from './TeamProvisioningServiceComposition';
import { type TeamProvisioningToolApprovalFacade } from './TeamProvisioningToolApprovalFacade';
import { type TeamProvisioningTransientRunState } from './TeamProvisioningTransientRunState';
import { type TeamProvisioningVerificationProbePorts } from './TeamProvisioningVerificationProbePortsFactory';

import type { ProvisioningEnvResolution } from './TeamProvisioningEnvBuilder';
import type {
  MemberSpawnLivenessSource,
  MemberSpawnStatus,
  MemberSpawnStatusEntry,
  MemberSpawnStatusesSnapshot,
  ProviderModelLaunchIdentity,
  InboxMessage,
  LeadContextUsage,
  TaskRef,
  TeamAgentRuntimeSnapshot,
  TeamCreateRequest,
  TeamProviderBackendId,
  TeamProviderId,
  TeamProvisioningProgress,
  TeamProvisioningModelCheckRequest,
  TeamProvisioningModelVerificationMode,
  TeamProvisioningPrepareResult,
  ToolApprovalEvent,
  ToolApprovalSettings,
} from '@shared/types';

const logger = createLogger('Service:TeamProvisioning');

export abstract class TeamProvisioningDiagnosticsPreflightCompatibilityFacade<
  TRun extends ProvisioningRun = ProvisioningRun,
> extends TeamProvisioningMemberLifecycleCompatibilityFacade<TRun> {
  protected abstract readonly launchIdentityBoundary: TeamProvisioningLaunchIdentityBoundary;
  protected abstract readonly runTracking: Pick<
    TeamProvisioningRunTrackingDeliveryHelper<TRun>,
    'canDeliverToOpenCodeRuntimeForTeam' | 'getAliveRunId' | 'getAliveTeamNames' | 'getTrackedRunId'
  >;
  protected abstract readonly runs: ReadonlyMap<string, TRun>;
  protected abstract readonly retainedClaudeLogsByTeam: Map<string, RetainedClaudeLogsSnapshot>;
  protected abstract readonly bootstrapTranscriptFacade: Pick<
    TeamProvisioningBootstrapTranscriptFacade,
    'getPersistedTranscriptClaudeLogs'
  >;
  protected abstract readonly membersMetaStore: Pick<TeamMembersMetaStore, 'getMembers'>;
  protected abstract readonly runtimeToolActivity: RuntimeToolActivityHandlers<TRun>;
  protected abstract readonly memberSpawnStatusMutationPorts: MemberSpawnStatusMutationPorts<TRun>;
  protected abstract readonly memberSpawnStatusAuditPorts: MemberSpawnStatusAuditPorts<TRun>;
  protected abstract readonly runtimeSnapshotFacade: Pick<
    TeamProvisioningRuntimeSnapshotFacade,
    'getTeamAgentRuntimeSnapshot'
  >;
  protected abstract readonly prepareFacade: TeamProvisioningPrepareFacade;
  protected abstract readonly providerRuntime: TeamProvisioningProviderRuntimeFacade;
  protected abstract readonly verificationProbePorts: TeamProvisioningVerificationProbePorts<TRun>;
  protected abstract readonly reevaluateMemberLaunchStatusBoundary: TeamProvisioningReevaluateMemberLaunchStatusBoundary<TRun>;
  protected abstract readonly transientRunState: Pick<
    TeamProvisioningTransientRunState,
    'appendCliLogs'
  >;
  protected abstract readonly pendingTimeouts: Map<string, NodeJS.Timeout>;
  protected abstract readonly helpOutputCache: { output: string | null; cachedAtMs: number };
  protected abstract readonly shutdownCoordination: { getShutdownTrackedTeamNames(): string[] };
  protected abstract readonly toolApprovalFacade: Pick<
    TeamProvisioningToolApprovalFacade<TRun>,
    | 'dismissApprovalNotification'
    | 'respondToToolApproval'
    | 'setMainWindow'
    | 'setToolApprovalEventEmitter'
    | 'updateToolApprovalSettings'
  >;
  protected abstract readonly liveLeadMessagePortsBoundary: Pick<
    TeamProvisioningLiveLeadMessagePortsBoundary<TRun>,
    'getCurrentLeadSessionId' | 'getLiveLeadProcessMessages' | 'pruneLiveLeadMessagesForCleanedRun'
  >;
  protected abstract readonly openCodeRuntimeControlApi: {
    recordOpenCodeRuntimeBootstrapCheckin(raw: unknown): Promise<OpenCodeRuntimeControlAck>;
    deliverOpenCodeRuntimeMessage(raw: unknown): Promise<OpenCodeRuntimeControlAck>;
    recordOpenCodeRuntimeTaskEvent(raw: unknown): Promise<OpenCodeRuntimeControlAck>;
    recordOpenCodeRuntimeHeartbeat(raw: unknown): Promise<OpenCodeRuntimeControlAck>;
  };
  protected abstract readonly runtimeAdapterRunByTeam: ReadonlyMap<
    string,
    RuntimeAdapterRunByTeamEntry
  >;
  protected abstract readonly runtimeAdapterProgressByRunId: ReadonlyMap<
    string,
    TeamProvisioningProgress
  >;
  protected abstract readonly openCodeRuntimeDeliveryBoundaryHost: TeamProvisioningOpenCodeRuntimeDeliveryBoundaryHost<TRun>;
  protected abstract readonly inboxReader: OpenCodeMemberDeliveryBusyStatusPorts['inboxReader'];
  protected abstract readonly openCodePromptDeliveryWatchdogScheduler: OpenCodeMemberInboxDeliveryWakePorts['watchdogScheduler'];

  protected abstract findBootstrapTranscriptOutcome(
    teamName: string,
    memberName: string,
    sinceMs: number | null
  ): Promise<BootstrapTranscriptOutcome | null>;
  protected abstract sendOpenCodeMemberMessageToRuntimeSerialized(
    input: Parameters<
      OpenCodeBootstrapStallRetryPromptPorts['sendOpenCodeMemberMessageToRuntimeSerialized']
    >[0]
  ): ReturnType<
    OpenCodeBootstrapStallRetryPromptPorts['sendOpenCodeMemberMessageToRuntimeSerialized']
  >;
  protected abstract emitMemberSpawnChange(run: TRun, memberName: string): void;
  protected abstract persistLaunchStateSnapshot(
    run: TRun,
    phase: 'active' | 'finished'
  ): Promise<unknown>;
  protected abstract syncLeadTaskActivityForState(
    run: TRun,
    state: 'active' | 'idle' | 'offline',
    previousState: 'active' | 'idle' | 'offline'
  ): void;
  protected abstract scheduleOpenCodePromptDeliveryWatchdog(input: {
    teamName: string;
    memberName: string;
    messageId?: string | null;
    delayMs: number;
  }): void;
  protected abstract resolveOpenCodeMemberDeliveryIdentity(
    teamName: string,
    memberName: string
  ): Promise<OpenCodeDeliveryIdentityResolution>;
  protected abstract tryRecoverOpenCodeRuntimeLaneForConfiguredMemberBeforeDelivery(input: {
    teamName: string;
    memberName: string;
  }): Promise<boolean>;
  protected abstract tryRecoverOpenCodeRuntimeLaneForConfiguredMemberAndVerifyActive(input: {
    teamName: string;
    memberName: string;
    laneId: string;
  }): Promise<boolean>;
  protected abstract getOpenCodeAgendaSyncRecoveryBypassMessageIds(input: {
    teamName: string;
    memberName: string;
    workSyncIntent?: 'agenda_sync' | 'review_pickup';
    taskRefs?: TaskRef[];
    foregroundMessages: InboxMessage[];
  }): Promise<Set<string>>;

  protected get runtimeTurnSettledHookSettingsProvider(): RuntimeTurnSettledHookSettingsProvider | null {
    return this.appShellBoundary.getRuntimeTurnSettledHookSettingsProvider();
  }

  protected get runtimeTurnSettledEnvironmentProvider(): RuntimeTurnSettledEnvironmentProvider | null {
    return this.appShellBoundary.getRuntimeTurnSettledEnvironmentProvider();
  }

  protected async buildTeamRuntimeLaunchArgsPlan(
    input: BuildTeamRuntimeLaunchArgsPlanInput
  ): Promise<TeamRuntimeLaunchArgsPlan> {
    return buildTeamRuntimeLaunchArgsPlanHelper(input, {
      buildRuntimeTurnSettledHookSettingsArgs: (providerId) =>
        buildRuntimeTurnSettledHookSettingsArgsHelper(
          { providerId },
          {
            hookSettingsProvider: this.runtimeTurnSettledHookSettingsProvider,
            logger,
          }
        ),
      buildRuntimeTurnSettledHookSettingsObject: (providerId) =>
        buildRuntimeTurnSettledHookSettingsObjectHelper(
          { providerId },
          {
            hookSettingsProvider: this.runtimeTurnSettledHookSettingsProvider,
            logger,
          }
        ),
    });
  }

  protected async readRuntimeProviderLaunchFacts(params: {
    claudePath: string;
    cwd: string;
    providerId: TeamProviderId;
    env: NodeJS.ProcessEnv;
    providerArgs?: string[];
    limitContext?: boolean;
  }): Promise<RuntimeProviderLaunchFacts> {
    return this.launchIdentityBoundary.readRuntimeProviderLaunchFacts(params);
  }

  protected async resolveAndValidateLaunchIdentity(params: {
    claudePath: string;
    cwd: string;
    env: NodeJS.ProcessEnv;
    request: Pick<
      TeamCreateRequest,
      'providerId' | 'providerBackendId' | 'model' | 'effort' | 'fastMode' | 'limitContext'
    >;
    effectiveMembers: TeamCreateRequest['members'];
    providerArgsByProvider?: Map<TeamProviderId, string[]>;
  }): Promise<ProviderModelLaunchIdentity> {
    return this.launchIdentityBoundary.resolveAndValidateLaunchIdentity(params);
  }

  protected async resolveDirectMemberLaunchIdentity(input: {
    claudePath: string;
    cwd: string;
    providerId: TeamProviderId;
    providerBackendId?: TeamProviderBackendId;
    provisioningEnv: ProvisioningEnvResolution;
    memberSpec: TeamCreateRequest['members'][number];
    run: TRun;
  }): Promise<ProviderModelLaunchIdentity> {
    return this.launchIdentityBoundary.resolveDirectMemberLaunchIdentity({
      ...input,
      requestLimitContext: input.run.request.limitContext,
    });
  }

  async getClaudeLogs(
    teamName: string,
    query?: { offset?: number; limit?: number }
  ): Promise<{ lines: string[]; total: number; hasMore: boolean; updatedAt?: string }> {
    return readTeamProvisioningClaudeLogs(teamName, query, {
      runTracking: this.runTracking,
      runs: this.runs,
      retainedClaudeLogsByTeam: this.retainedClaudeLogsByTeam,
      readPersistedTranscriptClaudeLogs: (candidateTeamName) =>
        this.getPersistedTranscriptClaudeLogs(candidateTeamName),
    });
  }

  getAliveTeamNames(): string[] {
    return this.runTracking.getAliveTeamNames();
  }

  async resolveRuntimeRecipientProviderId(
    teamName: string,
    memberName: string
  ): Promise<TeamProviderId | undefined> {
    return resolveRuntimeRecipientProviderIdHelper(
      { teamName, memberName },
      {
        readConfigSnapshot: (candidateTeamName) => this.readConfigSnapshot(candidateTeamName),
        readMembersMeta: (candidateTeamName) => this.membersMetaStore.getMembers(candidateTeamName),
      }
    );
  }

  async isOpenCodeRuntimeRecipient(teamName: string, memberName: string): Promise<boolean> {
    return isOpenCodeRuntimeRecipientHelper(
      { teamName, memberName },
      {
        readConfigSnapshot: (candidateTeamName) => this.readConfigSnapshot(candidateTeamName),
        readMembersMeta: (candidateTeamName) => this.membersMetaStore.getMembers(candidateTeamName),
      }
    );
  }

  protected isCurrentTrackedRun(run: TRun): boolean {
    return this.runTracking.getTrackedRunId(run.teamName) === run.runId;
  }

  protected getPersistedTranscriptClaudeLogs(
    teamName: string
  ): Promise<RetainedClaudeLogsSnapshot | null> {
    return this.bootstrapTranscriptFacade.getPersistedTranscriptClaudeLogs(teamName);
  }

  protected appendCliLogs(run: TRun, stream: 'stdout' | 'stderr', text: string): void {
    this.transientRunState.appendCliLogs(run, stream, text);
  }

  protected startRuntimeToolActivity(
    run: TRun,
    memberName: string,
    block: Record<string, unknown>
  ): void {
    this.runtimeToolActivity.startRuntimeToolActivity(run, memberName, block);
  }

  protected finishRuntimeToolActivity(
    run: TRun,
    toolUseId: string,
    resultContent: unknown,
    isError: boolean
  ): void {
    this.runtimeToolActivity.finishRuntimeToolActivity(run, toolUseId, resultContent, isError);
  }

  protected appendMemberBootstrapDiagnostic(run: TRun, memberName: string, text: string): void {
    this.runtimeToolActivity.appendMemberBootstrapDiagnostic(run, memberName, text);
  }

  protected updateLaunchDiagnosticsForRun(run: TRun, observedAt: string): void {
    const launchDiagnostics = boundLaunchDiagnostics(
      buildLaunchDiagnosticsFromRun(run, { nowIso: () => observedAt })
    );
    if (!launchDiagnostics) {
      return;
    }
    run.progress = {
      ...run.progress,
      updatedAt: observedAt,
      launchDiagnostics,
    };
    run.onProgress(run.progress);
  }

  protected resetRuntimeToolActivity(run: TRun, memberName?: string): void {
    this.runtimeToolActivity.resetRuntimeToolActivity(run, memberName);
  }

  protected clearMemberSpawnToolTracking(run: TRun, memberName: string): void {
    this.runtimeToolActivity.clearMemberSpawnToolTracking(run, memberName);
  }

  protected pauseMemberTaskActivityForRuntimeLoss(
    run: TRun,
    memberName: string,
    previous: MemberSpawnStatusEntry,
    observedAt: string
  ): void {
    this.runtimeToolActivity.pauseMemberTaskActivityForRuntimeLoss(
      run,
      memberName,
      previous,
      observedAt
    );
  }

  protected syncMemberTaskActivityForRuntimeTransition(
    run: TRun,
    memberName: string,
    previous: MemberSpawnStatusEntry,
    next: MemberSpawnStatusEntry,
    observedAt: string
  ): void {
    this.runtimeToolActivity.syncMemberTaskActivityForRuntimeTransition(
      run,
      memberName,
      previous,
      next,
      observedAt
    );
  }

  protected setMemberSpawnStatus(
    run: TRun,
    memberName: string,
    status: MemberSpawnStatus,
    error?: string,
    livenessSource?: MemberSpawnLivenessSource,
    heartbeatAt?: string
  ): void {
    setMemberSpawnStatusForRun(
      {
        run,
        memberName,
        status,
        error,
        livenessSource,
        heartbeatAt,
      },
      this.memberSpawnStatusMutationPorts
    );
  }

  protected confirmMemberSpawnStatusFromTranscript(
    run: TRun,
    memberName: string,
    observedAt: string,
    source: 'transcript' | 'runtime-proof' = 'transcript'
  ): void {
    confirmMemberSpawnStatusFromTranscriptForRun(
      {
        run,
        memberName,
        observedAt,
        source,
      },
      this.memberSpawnStatusMutationPorts
    );
  }

  protected createMemberSpawnStatusesSnapshotPorts() {
    return createTeamProvisioningMemberSpawnStatusesSnapshotPortsBoundary<TRun>(
      createTeamProvisioningMemberSpawnStatusesSnapshotHostFromService(
        this as unknown as TeamProvisioningMemberSpawnStatusesSnapshotServiceHost<TRun>
      )
    );
  }

  async getMemberSpawnStatuses(teamName: string): Promise<MemberSpawnStatusesSnapshot> {
    return getMemberSpawnStatusesSnapshot(teamName, this.createMemberSpawnStatusesSnapshotPorts());
  }

  async getTeamAgentRuntimeSnapshot(teamName: string): Promise<TeamAgentRuntimeSnapshot> {
    return this.runtimeSnapshotFacade.getTeamAgentRuntimeSnapshot(teamName);
  }

  protected getMemberLaunchGraceKey(run: TRun, memberName: string): string {
    return `member-launch-grace:${run.runId}:${memberName}`;
  }

  protected syncMemberLaunchGraceCheck(
    run: TRun,
    memberName: string,
    entry: MemberSpawnStatusEntry
  ): void {
    const key = this.getMemberLaunchGraceKey(run, memberName);
    const existing = this.pendingTimeouts.get(key);
    if (entry.launchState === 'failed_to_start' || entry.launchState === 'confirmed_alive') {
      if (existing) {
        clearTimeout(existing);
        this.pendingTimeouts.delete(key);
      }
      return;
    }
    if (!entry.firstSpawnAcceptedAt) {
      if (existing) {
        clearTimeout(existing);
        this.pendingTimeouts.delete(key);
      }
      return;
    }
    const remainingMs =
      Date.parse(entry.firstSpawnAcceptedAt) + MEMBER_LAUNCH_GRACE_MS - Date.now();
    if (remainingMs <= 0) {
      if (existing) {
        clearTimeout(existing);
        this.pendingTimeouts.delete(key);
      }
      void this.reevaluateMemberLaunchStatus(run, memberName);
      return;
    }
    if (existing) {
      return;
    }
    const timer = setTimeout(() => {
      this.pendingTimeouts.delete(key);
      void this.reevaluateMemberLaunchStatus(run, memberName);
    }, remainingMs);
    timer.unref?.();
    this.pendingTimeouts.set(key, timer);
  }

  protected async reevaluateMemberLaunchStatus(run: TRun, memberName: string): Promise<void> {
    await this.reevaluateMemberLaunchStatusBoundary.reevaluateMemberLaunchStatus(run, memberName);
  }

  protected getOpenCodeBootstrapStallStatusPorts(): OpenCodeBootstrapStallStatusPorts {
    return createTeamProvisioningOpenCodeBootstrapStallStatusPorts<TRun>({
      nowIso,
      syncMemberTaskActivityForRuntimeTransition: (targetRun, targetMember, previous, next, at) =>
        this.syncMemberTaskActivityForRuntimeTransition(
          targetRun,
          targetMember,
          previous,
          next,
          at
        ),
      updateLaunchDiagnostics: (targetRun, observedAt) =>
        this.updateLaunchDiagnosticsForRun(targetRun, observedAt),
      appendMemberBootstrapDiagnostic: (targetRun, targetMember, text) =>
        this.appendMemberBootstrapDiagnostic(targetRun, targetMember, text),
      isCurrentTrackedRun: (targetRun) => this.isCurrentTrackedRun(targetRun),
      emitMemberSpawnChange: (targetRun, targetMember) =>
        this.emitMemberSpawnChange(targetRun, targetMember),
      persistLaunchStateSnapshot: (targetRun, phase) => {
        void this.persistLaunchStateSnapshot(targetRun, phase);
      },
    });
  }

  protected getOpenCodeBootstrapStallReconciliationPorts(): TeamProvisioningOpenCodeBootstrapStallReconciliationPorts {
    return createTeamProvisioningOpenCodeBootstrapStallReconciliationPorts<TRun>({
      getOpenCodeBootstrapStallStatusPorts: () => this.getOpenCodeBootstrapStallStatusPorts(),
      findBootstrapTranscriptOutcome: (teamName, memberName, acceptedAtMs) =>
        this.findBootstrapTranscriptOutcome(teamName, memberName, acceptedAtMs),
      getOpenCodeRuntimeMessageAdapter: () =>
        this.appShellBoundary.getOpenCodeRuntimeMessageAdapter(),
      sendOpenCodeMemberMessageToRuntimeSerialized: (sendInput) =>
        this.sendOpenCodeMemberMessageToRuntimeSerialized(sendInput),
      appendMemberBootstrapDiagnostic: (targetRun, targetMember, text) =>
        this.appendMemberBootstrapDiagnostic(targetRun, targetMember, text),
      isCurrentTrackedRun: (targetRun) => this.isCurrentTrackedRun(targetRun),
      scheduleOpenCodeBootstrapStallReevaluation: (targetRun, targetMember, firstSpawnAcceptedAt) =>
        this.scheduleOpenCodeBootstrapStallReevaluation(
          targetRun,
          targetMember,
          firstSpawnAcceptedAt
        ),
    });
  }

  protected scheduleOpenCodeBootstrapStallReevaluation(
    run: TRun,
    memberName: string,
    firstSpawnAcceptedAt: string
  ): void {
    scheduleOpenCodeBootstrapStallReevaluationHelper(run, memberName, firstSpawnAcceptedAt, {
      nowMs: () => Date.now(),
      getMemberLaunchGraceKey: (targetRun, targetMember) =>
        this.getMemberLaunchGraceKey(targetRun as TRun, targetMember),
      hasPendingTimeout: (key) => this.pendingTimeouts.has(key),
      setPendingTimeout: (key, timer) => this.pendingTimeouts.set(key, timer),
      deletePendingTimeout: (key) => this.pendingTimeouts.delete(key),
      setTimeout: (callback, delayMs) => setTimeout(callback, delayMs),
      reevaluateMemberLaunchStatus: (targetRun, targetMember) =>
        this.reevaluateMemberLaunchStatus(targetRun as TRun, targetMember),
    });
  }

  protected isOpenCodeBootstrapStallWindowElapsed(
    firstSpawnAcceptedAt: string | undefined
  ): boolean {
    return isOpenCodeBootstrapStallWindowElapsedHelper(firstSpawnAcceptedAt, Date.now());
  }

  protected async maybeAuditMemberSpawnStatuses(
    run: TRun,
    options?: { force?: boolean }
  ): Promise<void> {
    await maybeAuditMemberSpawnStatusesForRun(run, this.memberSpawnStatusAuditPorts, options);
  }

  async warmup(): Promise<void> {
    await this.prepareFacade.warmup();
  }

  async prepareForProvisioning(
    cwd?: string,
    opts?: {
      forceFresh?: boolean;
      providerId?: TeamProviderId;
      providerIds?: TeamProviderId[];
      modelIds?: string[];
      modelChecks?: TeamProvisioningModelCheckRequest[];
      limitContext?: boolean;
      modelVerificationMode?: TeamProvisioningModelVerificationMode;
    }
  ): Promise<TeamProvisioningPrepareResult> {
    return this.prepareFacade.prepareForProvisioning(cwd, opts);
  }

  getCurrentRunId(teamName: string): string | null {
    return this.runTracking.getAliveRunId(teamName);
  }

  protected canDeliverToOpenCodeRuntimeForTeam(teamName: string): boolean {
    return this.runTracking.canDeliverToOpenCodeRuntimeForTeam(teamName);
  }

  hasActiveTeamRuntimes(): boolean {
    return this.shutdownCoordination.getShutdownTrackedTeamNames().length > 0;
  }

  setToolApprovalEventEmitter(emitter: (event: ToolApprovalEvent) => void): void {
    this.toolApprovalFacade.setToolApprovalEventEmitter(emitter);
  }

  setMainWindow(win: import('electron').BrowserWindow | null): void {
    this.toolApprovalFacade.setMainWindow(win);
  }

  updateToolApprovalSettings(teamName: string, settings: ToolApprovalSettings): void {
    this.toolApprovalFacade.updateToolApprovalSettings(teamName, settings);
  }

  getLiveLeadProcessMessages(teamName: string): InboxMessage[] {
    return this.liveLeadMessagePortsBoundary.getLiveLeadProcessMessages(teamName);
  }

  protected pruneLiveLeadMessagesForCleanedRun(run: TRun): void {
    this.liveLeadMessagePortsBoundary.pruneLiveLeadMessagesForCleanedRun(run);
  }

  getCurrentLeadSessionId(teamName: string): string | null {
    return this.liveLeadMessagePortsBoundary.getCurrentLeadSessionId(teamName);
  }

  async recordOpenCodeRuntimeBootstrapCheckin(raw: unknown): Promise<OpenCodeRuntimeControlAck> {
    return this.openCodeRuntimeControlApi.recordOpenCodeRuntimeBootstrapCheckin(raw);
  }

  async deliverOpenCodeRuntimeMessage(raw: unknown): Promise<OpenCodeRuntimeControlAck> {
    return this.openCodeRuntimeControlApi.deliverOpenCodeRuntimeMessage(raw);
  }

  async recordOpenCodeRuntimeTaskEvent(raw: unknown): Promise<OpenCodeRuntimeControlAck> {
    return this.openCodeRuntimeControlApi.recordOpenCodeRuntimeTaskEvent(raw);
  }

  async recordOpenCodeRuntimeHeartbeat(raw: unknown): Promise<OpenCodeRuntimeControlAck> {
    return this.openCodeRuntimeControlApi.recordOpenCodeRuntimeHeartbeat(raw);
  }

  protected createOpenCodeRuntimeDeliveryBoundaryHost(): TeamProvisioningOpenCodeRuntimeDeliveryBoundaryHost<TRun> {
    return createTeamProvisioningOpenCodeRuntimeDeliveryBoundaryHostFromService<TRun>(
      this as unknown as TeamProvisioningOpenCodeRuntimeDeliveryBoundaryServiceHost<TRun>
    );
  }

  protected createOpenCodeRuntimeDeliveryBoundary(): TeamProvisioningOpenCodeRuntimeDeliveryBoundary<TRun> {
    return createTeamProvisioningOpenCodeRuntimeDeliveryBoundaryFromHost<TRun>(
      this.openCodeRuntimeDeliveryBoundaryHost,
      {
        getTeamsBasePath,
        nowIso,
        logger,
      }
    );
  }

  protected createOpenCodePromptDeliveryLedger(
    teamName: string,
    laneId: string
  ): ReturnType<
    TeamProvisioningOpenCodeRuntimeDeliveryBoundary<TRun>['createOpenCodePromptDeliveryLedger']
  > {
    return this.createOpenCodeRuntimeDeliveryBoundary().createOpenCodePromptDeliveryLedger(
      teamName,
      laneId
    );
  }

  async getOpenCodeRuntimeDeliveryStatus(
    teamName: string,
    messageId: string
  ): ReturnType<
    TeamProvisioningOpenCodeRuntimeDeliveryBoundary<TRun>['getOpenCodeRuntimeDeliveryStatus']
  > {
    return this.createOpenCodeRuntimeDeliveryBoundary().getOpenCodeRuntimeDeliveryStatus(
      teamName,
      messageId
    );
  }

  protected async tryGetActiveOpenCodePromptDeliveryRecord(input: {
    teamName: string;
    memberName: string;
  }): Promise<OpenCodePromptDeliveryLedgerRecord | null> {
    return tryGetActiveOpenCodePromptDeliveryRecordWithPorts(input, {
      teamsBasePath: getTeamsBasePath(),
      resolveOpenCodeMemberDeliveryIdentity: (teamName, memberName) =>
        this.resolveOpenCodeMemberDeliveryIdentity(teamName, memberName),
      tryRecoverOpenCodeRuntimeLaneForConfiguredMemberAndVerifyActive: (recoveryInput) =>
        this.tryRecoverOpenCodeRuntimeLaneForConfiguredMemberAndVerifyActive(recoveryInput),
      createOpenCodePromptDeliveryLedger: (teamName, laneId) =>
        this.createOpenCodePromptDeliveryLedger(teamName, laneId),
    });
  }

  async getOpenCodeMemberDeliveryBusyStatus(input: {
    teamName: string;
    memberName: string;
    nowIso: string;
    workSyncIntent?: 'agenda_sync' | 'review_pickup';
    workSyncIntentKey?: string;
    taskRefs?: TaskRef[];
  }): Promise<{
    busy: boolean;
    reason?: string;
    retryAfterIso?: string;
    activeMessageId?: string;
    activeMessageKind?: string | null;
  }> {
    return getOpenCodeMemberDeliveryBusyStatusWithPorts(input, {
      teamsBasePath: getTeamsBasePath(),
      isOpenCodeRuntimeRecipient: (teamName, memberName) =>
        this.isOpenCodeRuntimeRecipient(teamName, memberName),
      inboxReader: this.inboxReader,
      getOpenCodeAgendaSyncRecoveryBypassMessageIds: (bypassInput) =>
        this.getOpenCodeAgendaSyncRecoveryBypassMessageIds(bypassInput),
      tryGetActiveOpenCodePromptDeliveryRecord: (activeInput) =>
        this.tryGetActiveOpenCodePromptDeliveryRecord(activeInput),
      scheduleOpenCodeMemberInboxDeliveryWake: (wakeInput) =>
        this.scheduleOpenCodeMemberInboxDeliveryWake(wakeInput),
      resolveOpenCodeMemberDeliveryIdentity: (teamName, memberName) =>
        this.resolveOpenCodeMemberDeliveryIdentity(teamName, memberName),
      tryRecoverOpenCodeRuntimeLaneForConfiguredMemberBeforeDelivery: (recoveryInput) =>
        this.tryRecoverOpenCodeRuntimeLaneForConfiguredMemberBeforeDelivery(recoveryInput),
      tryRecoverOpenCodeRuntimeLaneForConfiguredMemberAndVerifyActive: (recoveryInput) =>
        this.tryRecoverOpenCodeRuntimeLaneForConfiguredMemberAndVerifyActive(recoveryInput),
      createOpenCodePromptDeliveryLedger: (teamName, laneId) =>
        this.createOpenCodePromptDeliveryLedger(teamName, laneId),
    });
  }

  scheduleOpenCodeMemberInboxDeliveryWake(input: {
    teamName: string;
    memberName: string;
    messageId: string;
    delayMs?: number;
  }): void {
    this.scheduleOpenCodeMemberInboxDeliveryWakeInternal(input);
  }

  private scheduleOpenCodeMemberInboxDeliveryWakeInternal(input: {
    teamName: string;
    memberName: string;
    messageId: string;
    delayMs?: number;
  }): void {
    scheduleOpenCodeMemberInboxDeliveryWakeWithPorts(input, {
      watchdogScheduler: this.openCodePromptDeliveryWatchdogScheduler,
      scheduleWake: (wakeInput) => this.scheduleOpenCodePromptDeliveryWatchdog(wakeInput),
    });
  }

  async recoverOpenCodeRuntimeDeliveryJournal(teamName: string): Promise<{ recovered: true }> {
    return this.createOpenCodeRuntimeDeliveryBoundary().recoverOpenCodeRuntimeDeliveryJournal(
      teamName
    );
  }

  getLeadActivityState(teamName: string): {
    state: 'active' | 'idle' | 'offline';
    runId: string | null;
  } {
    return getLeadActivityStateForTeam(teamName, {
      getTrackedRunId: (targetTeamName) => this.runTracking.getTrackedRunId(targetTeamName),
      getRun: (runId) => this.runs.get(runId),
      getRuntimeAdapterRun: (targetTeamName) =>
        this.runtimeAdapterRunByTeam.get(targetTeamName) ?? null,
      getRuntimeAdapterProgress: (runId) => this.runtimeAdapterProgressByRunId.get(runId) ?? null,
      // Read-repair active lead task intervals for runs that were already active
      // before interval tracking was introduced or before the renderer polled state.
      syncLeadTaskActivityForState: (run, state, previousState) =>
        this.syncLeadTaskActivityForState(run, state, previousState),
    });
  }

  getLeadContextUsage(teamName: string): { usage: LeadContextUsage | null; runId: string | null } {
    return getLeadContextUsageForTeam(teamName, {
      getTrackedRunId: (targetTeamName) => this.runTracking.getTrackedRunId(targetTeamName),
      getRun: (runId) => this.runs.get(runId),
      nowIso: () => new Date().toISOString(),
    });
  }

  /** Dismiss the OS notification for a resolved/dismissed approval. */
  dismissApprovalNotification(requestId: string): void {
    this.toolApprovalFacade.dismissApprovalNotification(requestId);
  }

  /**
   * Respond to a pending tool approval - sends control_response to CLI stdin.
   * Validates runId match and requestId existence before writing.
   */
  async respondToToolApproval(
    teamName: string,
    runId: string,
    requestId: string,
    allow: boolean,
    message?: string
  ): Promise<void> {
    await this.toolApprovalFacade.respondToToolApproval(teamName, runId, requestId, allow, message);
  }

  protected async waitForValidConfig(
    run: TRun,
    timeoutMs: number = VERIFY_TIMEOUT_MS
  ): Promise<ValidConfigProbeResult> {
    return this.verificationProbePorts.waitForValidConfig(run, timeoutMs);
  }

  protected async waitForTeamInList(teamName: string, run?: TRun): Promise<boolean> {
    return this.verificationProbePorts.waitForTeamInList(teamName, run);
  }

  protected async waitForMissingInboxes(run: TRun): Promise<string[]> {
    return this.verificationProbePorts.waitForMissingInboxes(run);
  }

  protected async tryCompleteAfterTimeout(run: TRun): Promise<boolean> {
    return this.verificationProbePorts.tryCompleteAfterTimeout(run);
  }

  protected async pathExists(filePath: string): Promise<boolean> {
    return this.verificationProbePorts.pathExists(filePath);
  }

  async getCliHelpOutput(cwd?: string): Promise<string> {
    return getCliHelpOutputWithProvisioningPorts({
      cwd,
      cache: this.helpOutputCache,
      getCachedOrProbeResult: (targetCwd, providerId) =>
        this.prepareFacade.getCachedOrProbeResult(targetCwd, providerId),
      providerRuntime: this.providerRuntime,
    });
  }
}

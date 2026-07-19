import {
  buildOpenCodeSecondaryLaneId,
  isPureOpenCodeMemberLanePlan,
  type TeamRuntimeLanePlan,
} from '@features/team-runtime-lanes';
import { createTeamRuntimeLaneCoordinator } from '@features/team-runtime-lanes/main';
import { NotificationManager } from '@main/services/infrastructure/NotificationManager';
import { notifyTeamWatchScopeChanged } from '@main/services/infrastructure/teamWatchScope';
import { execCli, killProcessTree } from '@main/utils/childProcess';
import { getClaudeBasePath, getTeamsBasePath } from '@main/utils/pathDecoder';
import { getErrorMessage } from '@shared/utils/errorHandling';
import { createLogger } from '@shared/utils/logger';
import * as agentTeamsControllerModule from 'agent-teams-controller';
import { type spawn } from 'child_process';
import { randomUUID } from 'crypto';

import {
  cleanupAnthropicTeamApiKeyHelperForTeam,
  cleanupAnthropicTeamApiKeyHelperMaterial,
} from '../runtime/anthropicTeamApiKeyHelper';
import { ProviderConnectionService } from '../runtime/ProviderConnectionService';

import { isOpenCodeServeCommand } from './opencode/bridge/OpenCodeManagedHostProcessCleanup';
import { OpenCodePromptDeliveryFollowUpPolicy } from './opencode/delivery/OpenCodePromptDeliveryFollowUpPolicy';
import { type OpenCodePromptDeliveryWatchdogCoordinator } from './opencode/delivery/OpenCodePromptDeliveryWatchdogCoordinator';
import { type OpenCodePromptDeliveryWatchdogScheduler } from './opencode/delivery/OpenCodePromptDeliveryWatchdogScheduler';
import { OpenCodeRuntimeDeliveryProofReader } from './opencode/delivery/OpenCodeRuntimeDeliveryProofReader';
import { type OpenCodeVisibleReplyProofService } from './opencode/delivery/OpenCodeVisibleReplyProofService';
import { scheduleStaleAnthropicTeamApiKeyHelperCleanup } from './provisioning/TeamProvisioningAnthropicApiKeyHelperCleanup';
import {
  createAppendDirectProcessRuntimeEventUseCase,
  createNodeAppendDirectProcessRuntimeEventUseCasePorts,
} from './provisioning/TeamProvisioningAppendDirectProcessRuntimeEventUseCase';
import { TeamProvisioningBootstrapEvidenceFacade } from './provisioning/TeamProvisioningBootstrapEvidenceFacade';
import { TeamProvisioningBootstrapTranscriptFacade } from './provisioning/TeamProvisioningBootstrapTranscriptFacade';
import {
  createTeamProvisioningCancellationBoundary,
  createTeamProvisioningCancellationBoundaryPortsFromService,
  type TeamProvisioningCancellationBoundary,
  type TeamProvisioningCancellationBoundaryServiceHost,
} from './provisioning/TeamProvisioningCancellationBoundary';
import { createTeamProvisioningClaudePermissionSettingsDelegation } from './provisioning/TeamProvisioningClaudePermissionSettingsDelegation';
import { type TeamProvisioningCompatibilityDelegation } from './provisioning/TeamProvisioningCompatibilityFacade';
import { TeamProvisioningConfigFacade } from './provisioning/TeamProvisioningConfigFacade';
import { buildLaunchMembersFromMeta } from './provisioning/TeamProvisioningConfigMaterialization';
import { type TeamProvisioningConfigTaskActivityBoundary } from './provisioning/TeamProvisioningConfigTaskActivityBoundary';
import { type TeamProvisioningCreateDeterministicSpawnFlowBoundary } from './provisioning/TeamProvisioningCreateDeterministicSpawnFlowPortsFactory';
import { type ProvisioningEnvResolution } from './provisioning/TeamProvisioningEnvBuilder';
import { type TeamProvisioningIdlePromptInjectionBoundary } from './provisioning/TeamProvisioningIdlePromptInjectionPortsFactory';
import { type TeamProvisioningLaunchDeterministicFlowBoundary } from './provisioning/TeamProvisioningLaunchDeterministicFlowPortsFactory';
import { buildLaunchDiagnosticsFromRun } from './provisioning/TeamProvisioningLaunchDiagnostics';
import {
  createTeamProvisioningLaunchIdentityBoundary,
  type TeamProvisioningLaunchIdentityBoundary,
} from './provisioning/TeamProvisioningLaunchIdentityBoundaryFactory';
import { createTeamProvisioningLaunchNotificationsBoundary } from './provisioning/TeamProvisioningLaunchNotificationsBoundaryFactory';
import { type TeamProvisioningLaunchStateCompatibilityBoundary } from './provisioning/TeamProvisioningLaunchStateCompatibilityFacade';
import { getPersistedLaunchMemberNames } from './provisioning/TeamProvisioningLaunchStateProjection';
import { TeamProvisioningLaunchStateStoreBoundary } from './provisioning/TeamProvisioningLaunchStateStoreBoundary';
import { type TeamProvisioningLeadInboxRelayCompatibilityFacade } from './provisioning/TeamProvisioningLeadInboxRelayCompatibilityFacade';
import {
  createTeamProvisioningLiveLaunchSnapshotBoundaryFromService,
  type TeamProvisioningLiveLaunchSnapshotBoundaryServiceHost,
} from './provisioning/TeamProvisioningLiveLaunchSnapshotBoundaryFactory';
import {
  type MemberLifecycleOperation,
  TeamProvisioningMemberLifecycleController,
} from './provisioning/TeamProvisioningMemberLifecycle';
import { type TeamProvisioningMemberLifecyclePublicFacade } from './provisioning/TeamProvisioningMemberLifecycleCompatibilityFacade';
import { createTeamProvisioningMemberLifecycleHostFromPortGroups } from './provisioning/TeamProvisioningMemberLifecycleHostFactory';
import { createTeamProvisioningMemberLifecycleOperationRunner } from './provisioning/TeamProvisioningMemberLifecycleOperationRunner';
import { createTeamProvisioningMemberLifecycleOperationUseCases } from './provisioning/TeamProvisioningMemberLifecycleOperationUseCases';
import { createTeamProvisioningMemberLifecycleServiceUseCases } from './provisioning/TeamProvisioningMemberLifecycleServiceUseCases';
import {
  type LiveRosterAttachReason,
  type ProvisioningRun as MemberLifecycleProvisioningRun,
} from './provisioning/TeamProvisioningMemberLifecycleTypes';
import {
  createMemberSpawnStatusAuditPortsFromService,
  createMemberSpawnStatusMutationPortsFromService,
  type MemberSpawnStatusAuditPorts,
  type MemberSpawnStatusAuditServiceHost,
  type MemberSpawnStatusMutationPorts,
  type MemberSpawnStatusMutationServiceHost,
} from './provisioning/TeamProvisioningMemberSpawnSnapshots';
import { createTeamProvisioningMemberWorkSyncProofBoundary } from './provisioning/TeamProvisioningMemberWorkSyncProofBoundaryFactory';
import {
  createTeamProvisioningMixedSecondaryLaneWiring,
  createTeamProvisioningMixedSecondaryLaneWiringDepsFromService,
  type TeamProvisioningMixedSecondaryLaneWiringServiceHost,
} from './provisioning/TeamProvisioningMixedSecondaryLaneWiring';
import {
  createTeamProvisioningOpenCodeLaunchWiring,
  createTeamProvisioningOpenCodeLaunchWiringHostFromService,
  type TeamProvisioningOpenCodeLaunchWiringServiceHost,
} from './provisioning/TeamProvisioningOpenCodeLaunchWiring';
import {
  createTeamProvisioningOpenCodeRuntimeDeliveryAdvisoryFromService,
  type TeamProvisioningOpenCodeRuntimeDeliveryAdvisoryServiceHost,
} from './provisioning/TeamProvisioningOpenCodeRuntimeDeliveryAdvisory';
import { type TeamProvisioningOpenCodeRuntimeDeliveryBoundaryHost } from './provisioning/TeamProvisioningOpenCodeRuntimeDeliveryBoundaryFactory';
import {
  hasRetainableOpenCodeRuntimeMember,
  isRecoverableOpenCodeRuntimeEvidence,
} from './provisioning/TeamProvisioningOpenCodeRuntimeEvidencePolicy';
import { readProcessCommandByPid as readOpenCodeRuntimeLaneProcessCommandByPid } from './provisioning/TeamProvisioningOpenCodeRuntimeLaneCleanup';
import {
  createOpenCodeRuntimePendingPermissionsPersistencePortsFromService,
  createOpenCodeRuntimePermissionSpawnStatusPortsFromService,
  type OpenCodeRuntimePendingPermissionsPersistencePorts,
  type OpenCodeRuntimePendingPermissionsPersistenceServiceHost,
  type OpenCodeRuntimePermissionSpawnStatusPorts,
  type OpenCodeRuntimePermissionSpawnStatusServiceHost,
} from './provisioning/TeamProvisioningOpenCodeRuntimePermissions';
import {
  createRememberOpenCodeRuntimePidFromBridgePortsFromService,
  type RememberOpenCodeRuntimePidFromBridgeServiceHost,
} from './provisioning/TeamProvisioningOpenCodeRuntimePidBridge';
import { createTeamProvisioningOpenCodeRuntimeRecoveryBoundary } from './provisioning/TeamProvisioningOpenCodeRuntimeRecoveryBoundaryFactory';
import { type TeamProvisioningOpenCodeRuntimeRecoveryFacade } from './provisioning/TeamProvisioningOpenCodeRuntimeRecoveryFacade';
import { createTeamProvisioningOpenCodeSecondaryBriefingBuilder } from './provisioning/TeamProvisioningOpenCodeSecondaryBriefingBuilder';
import { TeamProvisioningOutputRecoveryFacade } from './provisioning/TeamProvisioningOutputRecoveryFacade';
import { type TeamProvisioningPersistenceReconcileFacade } from './provisioning/TeamProvisioningPersistenceReconcileFacade';
import { createTeamProvisioningPersistentRuntimeCleanup } from './provisioning/TeamProvisioningPersistentRuntimeCleanup';
import { TeamProvisioningPrepareFacade } from './provisioning/TeamProvisioningPrepareFacade';
import { createNodePreparePrimaryOwnedMemberRestartRuntimeUseCase } from './provisioning/TeamProvisioningPreparePrimaryOwnedMemberRestartRuntimeUseCase';
import {
  createTeamProvisioningPrimaryBootstrapTruthReportingBoundaryFromService,
  type TeamProvisioningPrimaryBootstrapTruthReportingServiceHost,
} from './provisioning/TeamProvisioningPrimaryBootstrapTruthReportingPortsFactory';
import { type TeamProvisioningProcessExitPorts } from './provisioning/TeamProvisioningProcessExit';
import { TeamProvisioningRetainedProgressState } from './provisioning/TeamProvisioningProgressState';
import {
  type TeamProvisioningProviderRuntimeCompatibility,
  type TeamProvisioningProviderRuntimeFacade,
} from './provisioning/TeamProvisioningProviderRuntimeFacade';
import {
  createTeamProvisioningReevaluateMemberLaunchStatusBoundary,
  createTeamProvisioningReevaluateMemberLaunchStatusDepsFromService,
  type TeamProvisioningReevaluateMemberLaunchStatusServiceHost,
} from './provisioning/TeamProvisioningReevaluateMemberLaunchStatusPortsFactory';
import { type RetainedClaudeLogsSnapshot } from './provisioning/TeamProvisioningRetainedLogs';
import {
  MEMBER_SPAWN_AUDIT_MIN_INTERVAL_MS,
  type ProvisioningRun,
} from './provisioning/TeamProvisioningRunModel';
import { nowIso, updateProgress } from './provisioning/TeamProvisioningRunProgress';
import { TeamProvisioningRuntimeAdapterProgressState } from './provisioning/TeamProvisioningRuntimeAdapterProgressState';
import {
  getAnthropicFastModeDefault,
  getTeamProviderLabel,
} from './provisioning/TeamProvisioningRuntimeDiagnostics';
import {
  type LeadRuntimeFailureObservation,
  type RuntimeFailureObservationInput,
  TeamProvisioningRuntimeFailureObservationBoundary,
} from './provisioning/TeamProvisioningRuntimeFailureObservationBoundary';
import { type TeamProvisioningRuntimeProjection } from './provisioning/TeamProvisioningRuntimeProjectionFactory';
import { createTeamProvisioningRuntimeResourceCacheBoundary } from './provisioning/TeamProvisioningRuntimeResourceCacheBoundary';
import { TeamProvisioningRunTrackingDeliveryHelper } from './provisioning/TeamProvisioningRunTrackingDelivery';
import {
  createSecondaryRuntimeRunStore,
  isOpenCodeSecondaryLaneMemberInRun,
  type MixedSecondaryRuntimeLaneState,
  type SecondaryRuntimeRunEntry,
} from './provisioning/TeamProvisioningSecondaryRuntimeRuns';
import {
  createTeamProvisioningServiceComposition,
  type RuntimeAdapterRunByTeamEntry,
  type TeamProvisioningServiceComposition,
} from './provisioning/TeamProvisioningServiceComposition';
import { TeamProvisioningServiceFacadeDelegates } from './provisioning/TeamProvisioningServiceFacadeDelegates';
import {
  createTeamProvisioningServiceMemberLifecycleHostPortGroups,
  type TeamProvisioningServiceMemberLifecycleHostPortGroupPorts,
  type TeamProvisioningServiceMemberLifecycleHostPortGroups,
} from './provisioning/TeamProvisioningServiceMemberLifecycleHostPortGroups';
import { createTeamProvisioningShutdownCoordination } from './provisioning/TeamProvisioningShutdownCoordination';
import { createNodeStopPrimaryOwnedRosterRuntimeUseCase } from './provisioning/TeamProvisioningStopPrimaryOwnedRosterRuntimeUseCase';
import {
  killOrphanedTeamAgentProcesses,
  killPersistedPaneMembers,
} from './provisioning/TeamProvisioningStopProcessCleanup';
import { TeamProvisioningToolApprovalFacade } from './provisioning/TeamProvisioningToolApprovalFacade';
import { TeamProvisioningTransientRunState } from './provisioning/TeamProvisioningTransientRunState';
import { type TeamProvisioningVerificationProbePorts } from './provisioning/TeamProvisioningVerificationProbePortsFactory';
import { createTeamProvisioningWorkspaceTrustPreSpawnBoundary } from './provisioning/TeamProvisioningWorkspaceTrustPreSpawnBoundary';
import { OpenCodeTaskLogAttributionStore } from './taskLogs/stream/OpenCodeTaskLogAttributionStore';
import { boundLaunchDiagnostics } from './progressPayload';
import { TeamAttachmentStore } from './TeamAttachmentStore';
import { clearBootstrapState, readBootstrapLaunchSnapshot } from './TeamBootstrapStateReader';
import { TeamConfigReader } from './TeamConfigReader';
import { TeamInboxReader } from './TeamInboxReader';
import { TeamInboxWriter } from './TeamInboxWriter';
import { TeamLaunchStateStore } from './TeamLaunchStateStore';
import { TeamMcpConfigBuilder } from './TeamMcpConfigBuilder';
import { TeamMembersMetaStore } from './TeamMembersMetaStore';
import { TeamMemberWorktreeManager } from './TeamMemberWorktreeManager';
import { TeamMetaStore } from './TeamMetaStore';
import { TeamSentMessagesStore } from './TeamSentMessagesStore';

import type {
  OpenCodeTeamRuntimeMessageResult,
  TeamLaunchRuntimeAdapter,
  TeamRuntimeLaunchResult,
} from './runtime';

export type { RuntimeBootstrapMemberMcpLaunchConfig } from './provisioning/TeamProvisioningBootstrapSpec';
export { buildDirectTmuxRestartEnvAssignments } from './provisioning/TeamProvisioningDirectRestart';
export {
  getMixedLaunchFallbackRecoveryError,
  getOpenCodeMixedProviderProvisioningError,
} from './provisioning/TeamProvisioningLaunchCompatibility';
export {
  shouldWarnOnMissingRegisteredMember,
  shouldWarnOnUnreadableMemberAuditConfig,
} from './provisioning/TeamProvisioningMemberSpawnStatusPolicy';
export {
  buildAddMemberSpawnMessage,
  buildRestartMemberSpawnMessage,
} from './provisioning/TeamProvisioningPromptBuilders';

import type {
  InboxMessage,
  RetryFailedOpenCodeSecondaryLanesResult,
  TeamChangeEvent,
  TeamCreateRequest,
  TeamCreateResponse,
  TeamLaunchRequest,
  TeamLaunchResponse,
  TeamMember,
  TeamProvisioningProgress,
} from '@shared/types';

const logger = createLogger('Service:TeamProvisioning');
const { AGENT_TEAMS_NAMESPACED_LEAD_BOOTSTRAP_TOOL_NAMES, createController } =
  agentTeamsControllerModule;

interface OpenCodeAggregatePrimaryRestartLease {
  teamName: string;
  runId: string;
  memberName: string;
  completion: Promise<void>;
  precedingLifecycleOperations: Promise<void>[];
  cancelRequested: boolean;
}

export type { LeadRuntimeFailureObservation } from './provisioning/TeamProvisioningRuntimeFailureObservationBoundary';

function mergeProvisioningMembersWithRemovalTombstones(
  activeMembers: readonly TeamMember[],
  existingMembers: readonly TeamMember[]
): TeamMember[] {
  const removedMembers = existingMembers.filter((member) => member.removedAt != null);
  const removedNames = new Set(
    removedMembers.map((member) => member.name.trim().toLowerCase()).filter(Boolean)
  );
  return [
    ...activeMembers.filter((member) => !removedNames.has(member.name.trim().toLowerCase())),
    ...removedMembers,
  ];
}

function preserveProvisioningRemovalTombstones(store: TeamMembersMetaStore): TeamMembersMetaStore {
  const getMeta = (store as Partial<TeamMembersMetaStore>).getMeta;
  const rawWriteMembers = (store as Partial<TeamMembersMetaStore>).writeMembers;
  if (typeof getMeta !== 'function' || typeof rawWriteMembers !== 'function') {
    return store;
  }
  const writeMembers = rawWriteMembers.bind(store);

  return new Proxy(store, {
    get(target, property) {
      if (property === 'writeMembers') {
        return async (
          teamName: string,
          members: TeamMember[],
          options?: { providerBackendId?: string }
        ): Promise<void> => {
          const existingMeta = await getMeta.call(target, teamName);
          await writeMembers(
            teamName,
            mergeProvisioningMembersWithRemovalTombstones(members, existingMeta?.members ?? []),
            options
          );
        };
      }
      const value = Reflect.get(target, property, target) as unknown;
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}

function preserveAuthoritativeMembersMetaResolution(
  facade: TeamProvisioningConfigFacade,
  store: TeamMembersMetaStore
): void {
  const fallback = facade.resolveLaunchExpectedMembers.bind(facade);
  facade.resolveLaunchExpectedMembers = async (teamName, configRaw, leadProviderId) => {
    try {
      const meta = await store.getMeta(teamName);
      if (meta) {
        return {
          members: buildLaunchMembersFromMeta(meta.members),
          source: 'members-meta',
        };
      }
    } catch {
      // The extracted resolver owns warning and fallback behavior for unreadable metadata.
    }
    return fallback(teamName, configRaw, leadProviderId);
  };
}

export class TeamProvisioningService extends TeamProvisioningServiceFacadeDelegates {
  protected readonly runtimeLaneCoordinator = createTeamRuntimeLaneCoordinator();
  private readonly providerConnectionService = ProviderConnectionService.getInstance();
  protected readonly launchIdentityBoundary: TeamProvisioningLaunchIdentityBoundary =
    createTeamProvisioningLaunchIdentityBoundary({
      execCli,
      providerConnectionService: this.providerConnectionService,
      getAnthropicFastModeDefault,
      getProviderLabel: getTeamProviderLabel,
      logger,
    });
  protected readonly openCodeSecondaryBriefingBuilder =
    createTeamProvisioningOpenCodeSecondaryBriefingBuilder({
      createController: (input) => createController(input),
      getClaudeBasePath,
    });
  protected readonly claudePermissionSettingsDelegation =
    createTeamProvisioningClaudePermissionSettingsDelegation({
      bootstrapToolNames: AGENT_TEAMS_NAMESPACED_LEAD_BOOTSTRAP_TOOL_NAMES,
      logger,
    });
  protected readonly runs = new Map<string, ProvisioningRun>();
  protected readonly provisioningRunByTeam = new Map<string, string>();
  private readonly aliveRunByTeam = new Map<string, string>();
  protected readonly runtimeAdapterProgressByRunId = new Map<string, TeamProvisioningProgress>();
  private readonly runtimeAdapterTraceLinesByRunId = new Map<string, string[]>();
  private readonly runtimeAdapterTraceKeyByRunId = new Map<string, string>();
  private readonly retainedProvisioningProgressState = new TeamProvisioningRetainedProgressState({
    runtimeAdapterProgressByRunId: this.runtimeAdapterProgressByRunId,
    runtimeAdapterTraceLinesByRunId: this.runtimeAdapterTraceLinesByRunId,
    runtimeAdapterTraceKeyByRunId: this.runtimeAdapterTraceKeyByRunId,
  });
  protected readonly runtimeAdapterProgressState = new TeamProvisioningRuntimeAdapterProgressState({
    state: {
      runtimeAdapterProgressByRunId: this.runtimeAdapterProgressByRunId,
      runtimeAdapterTraceLinesByRunId: this.runtimeAdapterTraceLinesByRunId,
      runtimeAdapterTraceKeyByRunId: this.runtimeAdapterTraceKeyByRunId,
    },
    retainProvisioningProgress: (runId, progress) =>
      this.retainProvisioningProgress(runId, progress),
    isRuntimeAdapterRunStateReferenced: (runId) =>
      this.runs.has(runId) ||
      [...this.provisioningRunByTeam.values()].includes(runId) ||
      [...this.aliveRunByTeam.values()].includes(runId) ||
      [...this.runtimeAdapterRunByTeam.values()].some((entry) => entry.runId === runId),
  });
  protected readonly runtimeAdapterRunByTeam = new Map<string, RuntimeAdapterRunByTeamEntry>();
  protected readonly runTracking = new TeamProvisioningRunTrackingDeliveryHelper({
    state: {
      provisioningRunByTeam: this.provisioningRunByTeam,
      aliveRunByTeam: this.aliveRunByTeam,
      runs: this.runs,
      runtimeAdapterProgressByRunId: this.runtimeAdapterProgressByRunId,
      runtimeAdapterRunByTeam: this.runtimeAdapterRunByTeam,
      getRetainedProvisioningProgressMap: () =>
        this.retainedProvisioningProgressState.getRetainedProvisioningProgressMap(),
    },
    ports: {
      notifyTeamWatchScopeChanged,
      isTeamAlive: (teamName) => this.isTeamAlive(teamName),
      hasAlivePersistedTeamProcess: (teamName) =>
        this.openCodeStoppedLaneCleanup.hasAlivePersistedTeamProcess(teamName),
      hasOnlyExplicitlyStoppedPersistedTeamProcesses: (teamName) =>
        this.openCodeStoppedLaneCleanup.hasOnlyExplicitlyStoppedPersistedTeamProcesses(teamName),
      logDebug: (message) => logger.debug(message),
    },
    liveRuntimeSnapshotCacheTtlMs: 2_000,
    persistedRuntimeSnapshotCacheTtlMs: 10_000,
  });
  private readonly cancelledRuntimeAdapterRunIds = new Set<string>();
  protected readonly cancellationBoundary: TeamProvisioningCancellationBoundary =
    createTeamProvisioningCancellationBoundary<ProvisioningRun>(
      createTeamProvisioningCancellationBoundaryPortsFromService(
        this as unknown as TeamProvisioningCancellationBoundaryServiceHost<ProvisioningRun>,
        {
          logWarning: (message) => logger.warn(message),
        }
      )
    );
  private readonly transientProbeProcesses = new Set<ReturnType<typeof spawn>>();
  protected readonly secondaryRuntimeRunByTeam = new Map<
    string,
    Map<string, SecondaryRuntimeRunEntry>
  >();
  private readonly secondaryRuntimeRuns = createSecondaryRuntimeRunStore({
    secondaryRuntimeRunByTeam: this.secondaryRuntimeRunByTeam,
    ports: {
      clearOpenCodeRuntimeToolApprovals: (teamName, options) =>
        this.toolApprovalFacade.clearOpenCodeRuntimeToolApprovals(teamName, options),
    },
  });
  private readonly hasSecondaryRuntimeRuns = this.secondaryRuntimeRuns.hasSecondaryRuntimeRuns;
  private readonly getSecondaryRuntimeRuns = this.secondaryRuntimeRuns.getSecondaryRuntimeRuns;
  private readonly setSecondaryRuntimeRun = this.secondaryRuntimeRuns.setSecondaryRuntimeRun;
  private readonly deleteSecondaryRuntimeRun = this.secondaryRuntimeRuns.deleteSecondaryRuntimeRun;
  private readonly clearSecondaryRuntimeRuns = this.secondaryRuntimeRuns.clearSecondaryRuntimeRuns;
  private readonly stoppingSecondaryRuntimeTeams = new Set<string>();
  private readonly openCodeAggregatePrimaryRestartByTeam = new Map<
    string,
    OpenCodeAggregatePrimaryRestartLease
  >();
  private readonly openCodeRuntimeAdapterStopInFlightByTeam = new Map<
    string,
    { teamName: string; runId: string; promise: Promise<void> }
  >();
  private readonly memberLifecycleCompletionByKey = new Map<
    string,
    { teamKey: string; token: symbol; completion: Promise<void> }
  >();
  private readonly preparedOpenCodeRuntimeLaunchMembersByTeam = new Map<
    string,
    TeamCreateRequest['members']
  >();
  protected readonly retainedClaudeLogsByTeam = new Map<string, RetainedClaudeLogsSnapshot>();
  protected readonly bootstrapTranscriptFacade!: TeamProvisioningBootstrapTranscriptFacade;
  protected readonly bootstrapEvidenceFacade!: TeamProvisioningBootstrapEvidenceFacade;

  private readonly teamOpLocks = new Map<string, Promise<void>>();
  protected readonly shutdownCoordination = createTeamProvisioningShutdownCoordination(
    {
      provisioningRunByTeam: this.provisioningRunByTeam,
      aliveRunByTeam: this.aliveRunByTeam,
      runtimeAdapterRunByTeam: this.runtimeAdapterRunByTeam,
      secondaryRuntimeRunByTeam: this.secondaryRuntimeRunByTeam,
      teamOpLocks: this.teamOpLocks,
      runtimeAdapterProgressByRunId: this.runtimeAdapterProgressByRunId,
      transientProbeProcesses: this.transientProbeProcesses,
    },
    {
      isCancellableRuntimeAdapterProgress: (progress) =>
        this.cancellationBoundary.isCancellableRuntimeAdapterProgress(progress),
      stopTeam: (teamName) => this.stopTeam(teamName),
      cancelRuntimeAdapterProvisioning: (runId, progress) =>
        this.cancellationBoundary.cancelRuntimeAdapterProvisioning(runId, progress),
      killProcessTree,
      logger,
    }
  );
  protected readonly memberWorkSyncProofBoundary =
    createTeamProvisioningMemberWorkSyncProofBoundary({
      getAcceptedReportChecker: () =>
        this.appShellBoundary.getMemberWorkSyncAcceptedReportChecker(),
      getProofMissingRecoveryScheduler: () =>
        this.appShellBoundary.getMemberWorkSyncProofMissingRecoveryScheduler(),
      logger,
      getErrorMessage,
    });
  protected readonly leadInboxRelayFacade!: TeamProvisioningLeadInboxRelayCompatibilityFacade<ProvisioningRun>;

  private readonly openCodeRuntimeDeliveryProofReader = new OpenCodeRuntimeDeliveryProofReader();
  protected readonly openCodeRuntimeDeliveryAdvisory =
    createTeamProvisioningOpenCodeRuntimeDeliveryAdvisoryFromService<ProvisioningRun>(
      this as unknown as TeamProvisioningOpenCodeRuntimeDeliveryAdvisoryServiceHost<ProvisioningRun>,
      {
        addTeamNotification: async (notification) => {
          await NotificationManager.getInstance().addTeamNotification(notification);
        },
        logInfo: (message, detail) =>
          detail === undefined ? logger.info(message) : logger.info(message, detail),
        logWarning: (message) => logger.warn(message),
        getErrorMessage,
      }
    );
  private readonly launchNotifications =
    createTeamProvisioningLaunchNotificationsBoundary<ProvisioningRun>({
      areAllExpectedLaunchMembersConfirmed: (run) => this.areAllExpectedLaunchMembersConfirmed(run),
      logger: {
        warn: (message) => logger.warn(message),
      },
    });
  private readonly liveLaunchSnapshotBoundary =
    createTeamProvisioningLiveLaunchSnapshotBoundaryFromService<ProvisioningRun>(
      this as unknown as TeamProvisioningLiveLaunchSnapshotBoundaryServiceHost<ProvisioningRun>,
      {
        getPersistedLaunchMemberNames,
        buildRuntimeSpawnStatusRecord: (run) => this.buildRuntimeSpawnStatusRecord(run),
      }
    );
  private readonly primaryBootstrapTruthReporting =
    createTeamProvisioningPrimaryBootstrapTruthReportingBoundaryFromService<ProvisioningRun>(
      this as unknown as TeamProvisioningPrimaryBootstrapTruthReportingServiceHost<ProvisioningRun>,
      {
        isOpenCodeSecondaryLaneMemberInRun,
        readBootstrapLaunchSnapshot,
        nowIso,
        logger: {
          warn: (message) => logger.warn(message),
        },
      }
    );
  private readonly openCodeVisibleReplyProofService!: OpenCodeVisibleReplyProofService;
  protected readonly openCodePromptDeliveryWatchdogCoordinator!: OpenCodePromptDeliveryWatchdogCoordinator;
  private readonly openCodeRuntimeRecoveryBoundary =
    createTeamProvisioningOpenCodeRuntimeRecoveryBoundary({
      teamsBasePath: getTeamsBasePath(),
      logger,
      getOpenCodeRuntimeAdapter: () => this.appShellBoundary.getOpenCodeRuntimeAdapter(),
      createRunId: randomUUID,
      getErrorMessage,
    });
  private readonly openCodeRuntimePermissionPersistencePorts: OpenCodeRuntimePendingPermissionsPersistencePorts =
    createOpenCodeRuntimePendingPermissionsPersistencePortsFromService(
      this as unknown as OpenCodeRuntimePendingPermissionsPersistenceServiceHost,
      {
        nowIso,
        getTrackedRunId: (teamName) => this.runTracking.getTrackedRunId(teamName),
        readLaunchState: (teamName) => this.launchStateStore.read(teamName).catch(() => null),
        logDebug: (message) => logger.debug(message),
      }
    );
  private readonly openCodeRuntimePermissionSpawnStatusPorts: OpenCodeRuntimePermissionSpawnStatusPorts<ProvisioningRun> =
    createOpenCodeRuntimePermissionSpawnStatusPortsFromService(
      this as unknown as OpenCodeRuntimePermissionSpawnStatusServiceHost<ProvisioningRun>,
      {
        nowIso,
        getTrackedRunId: (teamName) => this.runTracking.getTrackedRunId(teamName),
        getRun: (runId) => this.runs.get(runId) ?? null,
      }
    );
  protected readonly openCodeRuntimePidBridgePorts =
    createRememberOpenCodeRuntimePidFromBridgePortsFromService(
      this as unknown as RememberOpenCodeRuntimePidFromBridgeServiceHost,
      {
        nowIso,
        readProcessCommandByPid: readOpenCodeRuntimeLaneProcessCommandByPid,
        isOpenCodeServeCommand,
        logDebug: (message) => logger.debug(message),
      }
    );
  protected readonly memberSpawnStatusMutationPorts: MemberSpawnStatusMutationPorts<ProvisioningRun> =
    createMemberSpawnStatusMutationPortsFromService(
      this as unknown as MemberSpawnStatusMutationServiceHost<ProvisioningRun>,
      {
        nowIso,
        buildLaunchDiagnostics: (run) => boundLaunchDiagnostics(buildLaunchDiagnosticsFromRun(run)),
      }
    );
  protected readonly memberSpawnStatusAuditPorts: MemberSpawnStatusAuditPorts<ProvisioningRun> =
    createMemberSpawnStatusAuditPortsFromService(
      this as unknown as MemberSpawnStatusAuditServiceHost<ProvisioningRun>,
      {
        nowMs: () => Date.now(),
        minAuditIntervalMs: MEMBER_SPAWN_AUDIT_MIN_INTERVAL_MS,
        isOpenCodeSecondaryLaneMemberInRun: (run, memberName) =>
          isOpenCodeSecondaryLaneMemberInRun(
            run as Parameters<typeof isOpenCodeSecondaryLaneMemberInRun>[0],
            memberName
          ),
      }
    );
  private readonly openCodePromptDeliveryFollowUpPolicy = new OpenCodePromptDeliveryFollowUpPolicy({
    markFailedTerminal: (input) => this.markOpenCodePromptLedgerFailedTerminal(input),
    logEvent: (event, record, extra) => this.logOpenCodePromptDeliveryEvent(event, record, extra),
    scheduleWatchdog: (input) => this.scheduleOpenCodePromptDeliveryWatchdog(input),
    nowIso,
  });
  protected readonly openCodePromptDeliveryWatchdogScheduler!: OpenCodePromptDeliveryWatchdogScheduler;
  protected readonly persistentRuntimeCleanup = createTeamProvisioningPersistentRuntimeCleanup({
    readPersistedRuntimeMembers: (teamName) => this.readPersistedRuntimeMembers(teamName),
    killPersistedPaneMembers: (teamName, members) =>
      killPersistedPaneMembers(teamName, members, logger),
    killOrphanedTeamAgentProcesses: (teamName, currentRunPid) =>
      killOrphanedTeamAgentProcesses({ teamName, currentRunPid, logger }),
    getCurrentRunPid: (teamName) => {
      const currentRunId = this.runTracking.getTrackedRunId(teamName);
      return currentRunId ? this.runs.get(currentRunId)?.child?.pid : undefined;
    },
    cleanupAnthropicTeamApiKeyHelperForTeam,
    getClaudeBasePath,
    logger,
  });

  private readonly runtimeResourceCacheBoundary =
    createTeamProvisioningRuntimeResourceCacheBoundary({
      getTrackedRunId: (teamName) => this.runTracking.getTrackedRunId(teamName),
      logDebug: (message) => logger.debug(message),
    });
  private readonly runtimeResourceSampling =
    this.runtimeResourceCacheBoundary.runtimeResourceSampling;
  private readonly persistedTeamConfigCache =
    this.runtimeResourceCacheBoundary.persistedTeamConfigCache;
  protected readonly runtimeSnapshotFacade!: TeamProvisioningRuntimeProjection['runtimeSnapshotFacade'];
  private readonly memberSpawnStatusesSnapshotCache =
    this.runtimeResourceCacheBoundary.memberSpawnStatusesSnapshotCache;
  private readonly memberSpawnStatusesInFlightByTeam =
    this.runtimeResourceCacheBoundary.memberSpawnStatusesInFlightByTeam;
  protected readonly runtimeSnapshotCacheBoundary =
    this.runtimeResourceCacheBoundary.runtimeSnapshotCacheBoundary;

  private readonly launchStateStore = new TeamLaunchStateStore();
  private readonly defaultLaunchStateStore = this.launchStateStore;
  private readonly configFacade!: TeamProvisioningConfigFacade;
  protected readonly openCodeRuntimeRecoveryFacade!: TeamProvisioningOpenCodeRuntimeRecoveryFacade;

  protected readonly liveRuntimeMetadataPorts!: TeamProvisioningRuntimeProjection['liveRuntimeMetadataPorts'];
  private readonly launchStateWrittenRunIdByTeam = new Map<string, string>();
  private readonly launchStateStoreBoundary!: TeamProvisioningLaunchStateStoreBoundary;
  private readonly persistenceReconcileFacade!: TeamProvisioningPersistenceReconcileFacade<ProvisioningRun>;
  protected readonly launchStateCompatibilityBoundary!: TeamProvisioningLaunchStateCompatibilityBoundary<ProvisioningRun>;
  private readonly configTaskActivityBoundary!: TeamProvisioningConfigTaskActivityBoundary<ProvisioningRun>;
  private readonly failedOpenCodeSecondaryRetryInFlightByTeam = new Map<
    string,
    Promise<RetryFailedOpenCodeSecondaryLanesResult>
  >();
  private readonly memberLifecycleOperations = new Map<string, MemberLifecycleOperation>();
  private readonly baseMemberLifecycleOperationRunner =
    createTeamProvisioningMemberLifecycleOperationRunner({
      memberLifecycleOperations: this.memberLifecycleOperations,
      invalidateRuntimeSnapshotCaches: (teamName) => this.invalidateRuntimeSnapshotCaches(teamName),
      nowMs: () => Date.now(),
    });
  private readonly memberLifecycleOperationRunner = {
    isMemberLifecycleOperationActive: (teamName: string, memberName: string) =>
      this.baseMemberLifecycleOperationRunner.isMemberLifecycleOperationActive(
        teamName,
        memberName
      ),
    runMemberLifecycleOperation: <T>(
      teamName: string,
      memberName: string,
      kind: Parameters<
        typeof this.baseMemberLifecycleOperationRunner.runMemberLifecycleOperation
      >[2],
      operation: () => Promise<T>
    ): Promise<T> =>
      this.baseMemberLifecycleOperationRunner.runMemberLifecycleOperation(
        teamName,
        memberName,
        kind,
        async () => {
          const teamKey = teamName.trim().toLowerCase();
          const operationKey = `${teamKey}\0${memberName.trim().toLowerCase()}`;
          const token = Symbol(`${kind}:${operationKey}`);
          let resolveCompletion!: () => void;
          const completion = new Promise<void>((resolve) => {
            resolveCompletion = resolve;
          });
          this.memberLifecycleCompletionByKey.set(operationKey, {
            teamKey,
            token,
            completion,
          });
          try {
            await this.waitForOpenCodeAggregatePrimaryRestart(teamName, memberName);
            return await operation();
          } finally {
            resolveCompletion();
            if (this.memberLifecycleCompletionByKey.get(operationKey)?.token === token) {
              this.memberLifecycleCompletionByKey.delete(operationKey);
            }
          }
        }
      ),
  };
  private readonly memberLifecycleUseCases = Object.assign(
    createTeamProvisioningMemberLifecycleServiceUseCases({
      persistSentMessage: (teamName, message) =>
        this.persistSentMessage(teamName, message as unknown as InboxMessage),
      readLaunchStateSnapshot: (teamName) => this.launchStateStore.read(teamName),
      getLiveTeamAgentRuntimeMetadata: (teamName) => this.getLiveTeamAgentRuntimeMetadata(teamName),
      appendDirectProcessRuntimeEvent: createAppendDirectProcessRuntimeEventUseCase(
        createNodeAppendDirectProcessRuntimeEventUseCasePorts({ nowIso })
      ),
      stopPrimaryOwnedRosterRuntime: createNodeStopPrimaryOwnedRosterRuntimeUseCase(),
      preparePrimaryOwnedMemberRestartRuntime:
        createNodePreparePrimaryOwnedMemberRestartRuntimeUseCase(),
      nowIso,
      randomUUID,
    }),
    {
      collectFailedOpenCodeSecondaryRetryCandidates: (run: MemberLifecycleProvisioningRun) =>
        this.collectFailedOpenCodeSecondaryRetryCandidates(run),
    }
  );
  private readonly memberLifecycleOperationUseCases =
    createTeamProvisioningMemberLifecycleOperationUseCases({
      operationRunner: this.memberLifecycleOperationRunner,
    });
  private readonly memberLifecycleHost = Object.assign(
    createTeamProvisioningMemberLifecycleHostFromPortGroups<
      ProvisioningRun,
      MixedSecondaryRuntimeLaneState
    >(this.createMemberLifecycleHostPortGroups()),
    {
      stopOpenCodeRuntimeAdapterTeam: (teamName: string, runId: string) =>
        this.stopOpenCodeRuntimeAdapterTeam(teamName, runId),
      setAliveRunId: (teamName: string, runId: string) =>
        this.runTracking.setAliveRunId(teamName, runId),
      deleteAliveRunId: (teamName: string) => this.runTracking.deleteAliveRunId(teamName),
      isTeamAlive: (teamName: string) => this.isTeamAlive(teamName),
      setRuntimeAdapterProgress: (
        progress: TeamProvisioningProgress,
        onProgress: (progress: TeamProvisioningProgress) => void
      ) => this.runtimeAdapterProgressState.setRuntimeAdapterProgress(progress, onProgress),
    }
  );
  private readonly memberLifecycleController = new TeamProvisioningMemberLifecycleController(
    this.memberLifecycleHost,
    this.memberLifecycleOperationUseCases,
    {
      restart: this.memberLifecycleUseCases,
      openCodeRetry: this.memberLifecycleUseCases,
    }
  );
  protected readonly memberLifecycleFacade: TeamProvisioningMemberLifecyclePublicFacade =
    this.memberLifecycleController;
  protected teamChangeEmitter: ((event: TeamChangeEvent) => void) | null = null;
  private readonly runtimeFailureObservationBoundary =
    new TeamProvisioningRuntimeFailureObservationBoundary();
  protected readonly helpOutputCache = { output: null as string | null, cachedAtMs: 0 };
  protected readonly pendingTimeouts = new Map<string, NodeJS.Timeout>();
  protected readonly toolApprovalFacade!: TeamProvisioningToolApprovalFacade<ProvisioningRun>;
  protected readonly transientRunState!: TeamProvisioningTransientRunState;
  protected readonly idlePromptInjectionBoundary!: TeamProvisioningIdlePromptInjectionBoundary<ProvisioningRun>;
  protected readonly providerRuntime!: TeamProvisioningProviderRuntimeFacade;
  private readonly providerRuntimeCompatibility!: TeamProvisioningProviderRuntimeCompatibility;
  protected readonly compatibilityDelegation!: TeamProvisioningCompatibilityDelegation<ProvisioningRun>;
  protected readonly outputRecoveryFacade!: TeamProvisioningOutputRecoveryFacade<ProvisioningRun>;
  protected readonly deterministicCreateSpawnFlowBoundary!: TeamProvisioningCreateDeterministicSpawnFlowBoundary<ProvisioningRun>;
  private readonly deterministicLaunchFlowBoundary!: TeamProvisioningLaunchDeterministicFlowBoundary<MixedSecondaryRuntimeLaneState>;
  // Provider model discovery and runtime-status fallback stay behind the extracted prepare facade.
  protected readonly prepareFacade!: TeamProvisioningPrepareFacade;
  protected readonly verificationProbePorts!: TeamProvisioningVerificationProbePorts<ProvisioningRun>;
  protected readonly processExitPorts!: TeamProvisioningProcessExitPorts<ProvisioningRun>;
  private readonly workspaceTrustPreSpawnBoundary =
    createTeamProvisioningWorkspaceTrustPreSpawnBoundary<
      ProvisioningRun,
      ProvisioningEnvResolution
    >({
      getWorkspaceTrustCoordinator: () => this.appShellBoundary.getWorkspaceTrustCoordinator(),
      getStopAllTeamsGeneration: () => this.stopAllTeamsGeneration,
      updateProgress,
      boundLaunchDiagnostics,
      isLaunchRunStillCurrent: (run) => this.isLaunchRunStillCurrent(run),
      isRunStillTracked: (run) => this.runs.get(run.runId) === run,
      cleanupAnthropicApiKeyHelperMaterial: cleanupAnthropicTeamApiKeyHelperMaterial,
      restorePrelaunchConfig: (teamName) => this.restorePrelaunchConfig(teamName),
      cleanupRun: (run) => this.cleanupRun(run),
      logger,
    });
  protected readonly reevaluateMemberLaunchStatusBoundary =
    createTeamProvisioningReevaluateMemberLaunchStatusBoundary<ProvisioningRun>(
      createTeamProvisioningReevaluateMemberLaunchStatusDepsFromService(
        this as unknown as TeamProvisioningReevaluateMemberLaunchStatusServiceHost<ProvisioningRun>,
        {
          nowIso,
          nowMs: () => Date.now(),
          isOpenCodeSecondaryLaneMemberInRun,
        }
      )
    );
  protected readonly mixedSecondaryLaneWiring =
    createTeamProvisioningMixedSecondaryLaneWiring<ProvisioningRun>(
      createTeamProvisioningMixedSecondaryLaneWiringDepsFromService(
        this as unknown as TeamProvisioningMixedSecondaryLaneWiringServiceHost<ProvisioningRun>,
        { logger }
      )
    );
  protected readonly openCodeLaunchWiring =
    createTeamProvisioningOpenCodeLaunchWiring<ProvisioningRun>(
      createTeamProvisioningOpenCodeLaunchWiringHostFromService(
        this as unknown as TeamProvisioningOpenCodeLaunchWiringServiceHost<ProvisioningRun>
      )
    );
  private readonly requestAdmissionBoundary!: TeamProvisioningServiceComposition['requestAdmissionBoundary'];
  protected readonly openCodeRuntimeDeliveryBoundaryHost!: TeamProvisioningOpenCodeRuntimeDeliveryBoundaryHost<ProvisioningRun>;
  protected readonly openCodeRuntimeControlApi!: TeamProvisioningServiceComposition['openCodeRuntimeControlApi'];

  private createMemberLifecycleHostPortGroups(): TeamProvisioningServiceMemberLifecycleHostPortGroups {
    return createTeamProvisioningServiceMemberLifecycleHostPortGroups(
      this as unknown as TeamProvisioningServiceMemberLifecycleHostPortGroupPorts
    );
  }

  constructor(
    private readonly configReader: TeamConfigReader = new TeamConfigReader(),
    protected readonly inboxReader: TeamInboxReader = new TeamInboxReader(),
    protected readonly membersMetaStore: TeamMembersMetaStore = new TeamMembersMetaStore(),
    private readonly sentMessagesStore: TeamSentMessagesStore = new TeamSentMessagesStore(),
    private readonly mcpConfigBuilder: TeamMcpConfigBuilder = new TeamMcpConfigBuilder(),
    private readonly teamMetaStore: TeamMetaStore = new TeamMetaStore(),
    private readonly inboxWriter: TeamInboxWriter = new TeamInboxWriter(),
    private readonly openCodeTaskLogAttributionStore: OpenCodeTaskLogAttributionStore = new OpenCodeTaskLogAttributionStore(),
    private readonly memberWorktreeManager: TeamMemberWorktreeManager = new TeamMemberWorktreeManager(),
    private readonly attachmentStore: TeamAttachmentStore = new TeamAttachmentStore()
  ) {
    super();
    (
      this as unknown as {
        membersMetaStore: TeamMembersMetaStore;
      }
    ).membersMetaStore = preserveProvisioningRemovalTombstones(this.membersMetaStore);
    createTeamProvisioningServiceComposition(this);
    preserveAuthoritativeMembersMetaResolution(this.configFacade, this.membersMetaStore);
    this.preserveAtomicOpenCodeRuntimePreparation();
    scheduleStaleAnthropicTeamApiKeyHelperCleanup({ baseClaudeDir: getClaudeBasePath(), logger });
  }

  private preserveAtomicOpenCodeRuntimePreparation(): void {
    const prepareOpenCodeRuntimeAdapterLaunch =
      this.prepareFacade.prepareOpenCodeRuntimeAdapterLaunch.bind(this.prepareFacade);
    this.prepareFacade.prepareOpenCodeRuntimeAdapterLaunch = async (params) => {
      const prepared = await prepareOpenCodeRuntimeAdapterLaunch(params);
      const lanePlan = this.planRuntimeLanesOrThrow(
        prepared.launchRequest.providerId,
        prepared.runtimeLaunchMembers,
        prepared.launchRequest.cwd
      );
      const teamKey = prepared.launchRequest.teamName.trim().toLowerCase();
      if (isPureOpenCodeMemberLanePlan(lanePlan)) {
        this.preparedOpenCodeRuntimeLaunchMembersByTeam.set(teamKey, prepared.runtimeLaunchMembers);
      } else {
        this.preparedOpenCodeRuntimeLaunchMembersByTeam.delete(teamKey);
      }
      return { ...prepared, lanePlan };
    };
  }

  protected override async runOpenCodeWorktreeRootAggregateLaunch(input: {
    request: TeamCreateRequest | TeamLaunchRequest;
    members: TeamCreateRequest['members'];
    lanePlan: Extract<TeamRuntimeLanePlan, { mode: 'pure_opencode_member_lanes' }>;
    prompt: string;
    sourceWarning?: string;
    onProgress: (progress: TeamProvisioningProgress) => void;
  }): Promise<TeamLaunchResponse> {
    const teamKey = input.request.teamName.trim().toLowerCase();
    const runtimeLaunchMembers =
      this.preparedOpenCodeRuntimeLaunchMembersByTeam.get(teamKey) ?? input.members;
    try {
      return await super.runOpenCodeWorktreeRootAggregateLaunch({
        ...input,
        members: runtimeLaunchMembers,
      });
    } finally {
      if (this.preparedOpenCodeRuntimeLaunchMembersByTeam.get(teamKey) === runtimeLaunchMembers) {
        this.preparedOpenCodeRuntimeLaunchMembersByTeam.delete(teamKey);
      }
    }
  }

  protected override async runOpenCodeTeamRuntimeAdapterLaunch(input: {
    request: TeamCreateRequest | TeamLaunchRequest;
    members: TeamCreateRequest['members'];
    prompt: string;
    sourceWarning?: string;
    onProgress: (progress: TeamProvisioningProgress) => void;
  }): Promise<TeamLaunchResponse> {
    const configuredLanePlan = this.planRuntimeLanesOrThrow(
      input.request.providerId,
      input.members,
      input.request.cwd
    );
    const runtimeLaunchMembers = this.prepareFacade.buildOpenCodeRuntimeAdapterLaunchMembers(
      input.request,
      input.members,
      configuredLanePlan
    );
    return super.runOpenCodeTeamRuntimeAdapterLaunch({
      ...input,
      members: runtimeLaunchMembers,
    });
  }

  private runAfterInFlightTeamOperation<T>(
    teamName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const pendingTeamOperation = this.teamOpLocks.get(teamName);
    return pendingTeamOperation ? pendingTeamOperation.then(operation) : operation();
  }

  private async waitForMemberLifecycleOperations(teamName: string): Promise<void> {
    const teamKey = teamName.trim().toLowerCase();
    const completions = Array.from(this.memberLifecycleCompletionByKey.values())
      .filter((entry) => entry.teamKey === teamKey)
      .map((entry) => entry.completion);
    const failedLaneRetry = Array.from(
      this.failedOpenCodeSecondaryRetryInFlightByTeam.entries()
    ).find(([candidateTeamName]) => candidateTeamName.trim().toLowerCase() === teamKey)?.[1];
    if (failedLaneRetry) {
      completions.push(
        failedLaneRetry.then(
          () => undefined,
          () => undefined
        )
      );
    }
    await Promise.all(completions);
  }

  private collectFailedOpenCodeSecondaryRetryCandidates(
    run: MemberLifecycleProvisioningRun
  ): ReturnType<
    TeamProvisioningMemberLifecycleController['collectFailedOpenCodeSecondaryRetryCandidatesInternal']
  > {
    return this.memberLifecycleController.collectFailedOpenCodeSecondaryRetryCandidatesInternal(
      run
    );
  }

  private beginOpenCodeAggregatePrimaryRestart(
    teamName: string,
    memberName: string,
    runId: string
  ): { lease: OpenCodeAggregatePrimaryRestartLease; release: () => void } {
    const teamKey = teamName.trim().toLowerCase();
    const activeRestart = this.openCodeAggregatePrimaryRestartByTeam.get(teamKey);
    if (activeRestart) {
      throw new Error(
        `OpenCode aggregate primary restart for teammate "${activeRestart.memberName}" is already in progress for team "${teamName}"`
      );
    }

    const memberKey = `${teamKey}\0${memberName.trim().toLowerCase()}`;
    const precedingLifecycleOperations = Array.from(this.memberLifecycleCompletionByKey.entries())
      .filter(([operationKey, entry]) => entry.teamKey === teamKey && operationKey !== memberKey)
      .map(([, entry]) => entry.completion);
    let resolveCompletion!: () => void;
    const completion = new Promise<void>((resolve) => {
      resolveCompletion = resolve;
    });
    const lease: OpenCodeAggregatePrimaryRestartLease = {
      teamName,
      runId,
      memberName,
      completion,
      precedingLifecycleOperations,
      cancelRequested: false,
    };
    this.openCodeAggregatePrimaryRestartByTeam.set(teamKey, lease);
    return {
      lease,
      release: () => {
        resolveCompletion();
        if (this.openCodeAggregatePrimaryRestartByTeam.get(teamKey) === lease) {
          this.openCodeAggregatePrimaryRestartByTeam.delete(teamKey);
        }
      },
    };
  }

  private isOpenCodeAggregatePrimaryRestartCandidate(
    teamName: string,
    memberName: string
  ): { runId: string; run: ProvisioningRun | null } | null {
    const runtimeRun = this.runtimeAdapterRunByTeam.get(teamName);
    if (runtimeRun?.providerId !== 'opencode') {
      return null;
    }
    const aliveRunId = this.runTracking.getAliveRunId(teamName);
    const run = aliveRunId ? (this.runs.get(aliveRunId) ?? null) : null;
    if (!run || run.processKilled || run.cancelRequested) {
      return { runId: runtimeRun.runId, run: null };
    }
    const normalizedMemberName = memberName.trim().toLowerCase();
    const memberHasSecondaryLane = run.mixedSecondaryLanes.some(
      (lane) => lane.member.name.trim().toLowerCase() === normalizedMemberName
    );
    return memberHasSecondaryLane ? null : { runId: run.runId, run };
  }

  private async waitForOpenCodeAggregatePrimaryRestart(
    teamName: string,
    currentMemberName?: string
  ): Promise<string | null> {
    const restart = this.openCodeAggregatePrimaryRestartByTeam.get(teamName.trim().toLowerCase());
    if (!restart) {
      return null;
    }
    if (
      currentMemberName &&
      restart.memberName.trim().toLowerCase() === currentMemberName.trim().toLowerCase()
    ) {
      return restart.runId;
    }
    await restart.completion;
    return restart.runId;
  }

  private async clearCancelledOpenCodeAggregateRestartState(
    teamName: string,
    runId: string,
    confirmedCancelledRestart?: OpenCodeAggregatePrimaryRestartLease
  ): Promise<void> {
    await this.clearPersistedOpenCodeLaunchStateIfOwned(
      teamName,
      runId,
      confirmedCancelledRestart
    ).catch((error: unknown) => {
      logger.warn(
        `[${teamName}] Failed to clear late launch state after cancelled primary restart: ${getErrorMessage(error)}`
      );
    });
    await this.cancellationBoundary.clearOpenCodeRuntimeAdapterPrimaryLaneIfOwned(teamName, runId);
  }

  private async clearPersistedOpenCodeLaunchStateIfOwned(
    teamName: string,
    expectedRunId: string,
    confirmedCancelledRestart?: OpenCodeAggregatePrimaryRestartLease
  ): Promise<void> {
    await this.enqueueLaunchStateStoreOperation(teamName, async () => {
      const trackedRunId = this.runTracking.getTrackedRunId(teamName);
      if (trackedRunId && trackedRunId !== expectedRunId) {
        return;
      }
      const lastWrittenRunId = this.launchStateWrittenRunIdByTeam.get(teamName);
      if (lastWrittenRunId && lastWrittenRunId !== expectedRunId) {
        return;
      }
      const ownedByExpectedRunWrite = lastWrittenRunId === expectedRunId;
      const cancelledRestart = this.openCodeAggregatePrimaryRestartByTeam.get(
        teamName.trim().toLowerCase()
      );
      const ownedByCancelledRestart =
        (cancelledRestart?.runId === expectedRunId && cancelledRestart.cancelRequested) ||
        (confirmedCancelledRestart?.runId === expectedRunId &&
          confirmedCancelledRestart.cancelRequested);
      const snapshot = await this.launchStateStore.read(teamName).catch(() => null);
      const persistedPrimaryRunIds = new Set(
        Object.values(snapshot?.members ?? {})
          .filter((member) => member.laneId === 'primary' || member.laneKind === 'primary')
          .map((member) => member.runtimeRunId?.trim())
          .filter((candidateRunId): candidateRunId is string => Boolean(candidateRunId))
      );
      if (
        !ownedByExpectedRunWrite &&
        !ownedByCancelledRestart &&
        (persistedPrimaryRunIds.size !== 1 || !persistedPrimaryRunIds.has(expectedRunId))
      ) {
        return;
      }
      await this.launchStateStore.clear(teamName);
      this.launchStateWrittenRunIdByTeam.delete(teamName);
      await clearBootstrapState(teamName);
      this.invalidateRuntimeSnapshotCaches(teamName);
    });
  }

  private getCancelledOpenCodeAggregateRestartError(teamName: string, memberName: string): Error {
    return new Error(
      `OpenCode aggregate primary restart for teammate "${memberName}" was cancelled because team "${teamName}" is no longer running`
    );
  }

  private getCancelledOpenCodeAggregatePrimaryLaunchError(teamName: string): Error {
    return new Error(
      `OpenCode aggregate primary launch for team "${teamName}" was cancelled because the owning run is no longer active`
    );
  }

  private async restartPureOpenCodeAggregatePrimaryMemberExclusive(params: {
    teamName: string;
    memberName: string;
    run: ProvisioningRun;
    restartLease: OpenCodeAggregatePrimaryRestartLease;
  }): Promise<void> {
    const { teamName, memberName, run, restartLease } = params;
    const normalizedMemberName = memberName.trim().toLowerCase();
    const primaryMember = run.effectiveMembers.find(
      (member) => member.name.trim().toLowerCase() === normalizedMemberName
    );
    if (!primaryMember) {
      await this.memberLifecycleController.restartMember(teamName, memberName);
      return;
    }
    if (run.pendingMemberRestarts.has(memberName)) {
      throw new Error(`Restart for teammate "${memberName}" is already in progress`);
    }
    const adapter = this.appShellBoundary.getOpenCodeRuntimeAdapter();
    if (!adapter) {
      throw new Error('OpenCode runtime adapter is not available for member restart.');
    }

    const restartNoLongerCurrent = (): boolean =>
      restartLease.cancelRequested ||
      run.processKilled ||
      run.cancelRequested ||
      this.runs.get(run.runId) !== run;
    const assertRestartCurrent = (): void => {
      if (restartNoLongerCurrent()) {
        throw this.getCancelledOpenCodeAggregateRestartError(teamName, memberName);
      }
    };
    const assertRestartCurrentAfterPersistence = async (): Promise<void> => {
      if (restartNoLongerCurrent()) {
        await this.clearCancelledOpenCodeAggregateRestartState(teamName, run.runId);
      }
      assertRestartCurrent();
    };

    const previousLaunchState = await this.launchStateStore.read(teamName);
    assertRestartCurrent();
    const previousEffectiveMembers = [...run.effectiveMembers];
    const previousExpectedMembers = [...run.expectedMembers];
    const previousSecondaryLanes = [...run.mixedSecondaryLanes];
    const leadMemberName = this.getRunLeadName(run).trim().toLowerCase();
    const hasRetainablePrimaryLead = (result: TeamRuntimeLaunchResult | null): boolean => {
      if (!result) {
        return false;
      }
      const leadEvidence = Object.entries(result.members).find(
        ([name, evidence]) =>
          (evidence.memberName?.trim() || name.trim()).toLowerCase() === leadMemberName
      )?.[1];
      return Boolean(
        leadEvidence &&
        leadEvidence.launchState !== 'failed_to_start' &&
        leadEvidence.hardFailure !== true &&
        isRecoverableOpenCodeRuntimeEvidence(leadEvidence)
      );
    };

    const currentPrimaryRun = this.runtimeAdapterRunByTeam.get(teamName);
    if (currentPrimaryRun?.providerId === 'opencode' && currentPrimaryRun.runId === run.runId) {
      await this.stopOpenCodeRuntimeAdapterTeam(teamName, run.runId);
      assertRestartCurrent();
      this.runTracking.setAliveRunId(teamName, run.runId);
    }

    run.effectiveMembers = run.effectiveMembers.filter(
      (member) => member.name.trim().toLowerCase() !== normalizedMemberName
    );
    run.expectedMembers = run.expectedMembers.filter(
      (name) => name.trim().toLowerCase() !== normalizedMemberName
    );
    const lane: MixedSecondaryRuntimeLaneState = {
      laneId: buildOpenCodeSecondaryLaneId(primaryMember),
      providerId: 'opencode',
      member: { ...primaryMember },
      runId: null,
      state: 'queued',
      result: null,
      warnings: [],
      diagnostics: ['controlled_reattach:manual_restart', 'migrated_from_failed_primary_lane'],
    };
    run.mixedSecondaryLanes = [...run.mixedSecondaryLanes, lane];
    this.memberLifecycleUseCases.persistOpenCodeMemberRestartSystemMessage({
      teamName,
      leadName: this.getRunLeadName(run),
      leadSessionId: run.detectedSessionId?.trim() || run.runId,
      displayName: run.request.displayName?.trim() || run.teamName,
      member: primaryMember,
      reason: 'manual_restart',
      assertStillCurrent: assertRestartCurrent,
    });
    this.invalidateRuntimeSnapshotCaches(teamName);
    this.resetRuntimeToolActivity(run, memberName);
    this.clearMemberSpawnToolTracking(run, memberName);

    let primaryRelaunchResult: TeamRuntimeLaunchResult | null;
    try {
      primaryRelaunchResult = await this.launchOpenCodeAggregatePrimaryLane({
        run,
        adapter,
        prompt: '',
        previousLaunchState,
      });
      if (restartNoLongerCurrent()) {
        await this.stopUnretainableOpenCodePrimaryLane({
          adapter,
          run,
          previousEffectiveMembers,
          previousLaunchState,
        });
        await this.clearCancelledOpenCodeAggregateRestartState(teamName, run.runId);
        throw this.getCancelledOpenCodeAggregatePrimaryLaunchError(teamName);
      }
      if (!hasRetainablePrimaryLead(primaryRelaunchResult)) {
        throw new Error('OpenCode primary member restart did not retain the team lead runtime.');
      }
    } catch (restartError) {
      if (restartNoLongerCurrent()) {
        const abortedByOwnershipGuard = getErrorMessage(restartError).includes(
          'owning run is no longer active'
        );
        if (!abortedByOwnershipGuard) {
          await this.stopUnretainableOpenCodePrimaryLane({
            adapter,
            run,
            previousEffectiveMembers,
            previousLaunchState,
          });
        }
        await this.clearCancelledOpenCodeAggregateRestartState(teamName, run.runId);
        throw abortedByOwnershipGuard
          ? restartError
          : this.getCancelledOpenCodeAggregatePrimaryLaunchError(teamName);
      }
      run.effectiveMembers = previousEffectiveMembers;
      run.expectedMembers = previousExpectedMembers;
      run.mixedSecondaryLanes = previousSecondaryLanes;
      this.invalidateRuntimeSnapshotCaches(teamName);

      try {
        const rollbackResult = await this.launchOpenCodeAggregatePrimaryLane({
          run,
          adapter,
          prompt: '',
          previousLaunchState,
        });
        if (restartNoLongerCurrent()) {
          await this.clearCancelledOpenCodeAggregateRestartState(teamName, run.runId);
          throw this.getCancelledOpenCodeAggregatePrimaryLaunchError(teamName);
        }
        if (!hasRetainablePrimaryLead(rollbackResult)) {
          throw new Error('Primary rollback did not restore a retainable OpenCode team lead.');
        }
        await this.persistLaunchStateSnapshot(run, this.getMixedSecondaryLaunchPhase(run));
        await assertRestartCurrentAfterPersistence();
        this.runTracking.setAliveRunId(teamName, run.runId);
        run.progress = this.runtimeAdapterProgressState.setRuntimeAdapterProgress(
          {
            ...run.progress,
            state: 'ready',
            message: 'OpenCode member restart failed; original primary lane was restored',
            messageSeverity: 'warning',
            updatedAt: nowIso(),
            error: undefined,
            cliLogsTail: getErrorMessage(restartError),
          },
          run.onProgress
        );
      } catch (rollbackError) {
        if (restartNoLongerCurrent()) {
          await this.clearCancelledOpenCodeAggregateRestartState(teamName, run.runId);
          throw rollbackError;
        }
        const restartMessage = getErrorMessage(restartError);
        const rollbackMessage = getErrorMessage(rollbackError);
        await this.stopUnretainableOpenCodePrimaryLane({
          adapter,
          run,
          previousEffectiveMembers,
          previousLaunchState,
        });
        await this.stopMixedSecondaryRuntimeLanes(teamName);
        await this.clearPersistedLaunchState(teamName, { expectedRunId: run.runId }).catch(
          (error: unknown) => {
            logger.warn(
              `[${teamName}] Failed to clear stale launch state after primary rollback failure: ${getErrorMessage(error)}`
            );
          }
        );
        await this.cancellationBoundary.clearOpenCodeRuntimeAdapterPrimaryLaneIfOwned(
          teamName,
          run.runId
        );
        run.processKilled = true;
        run.progress = this.runtimeAdapterProgressState.setRuntimeAdapterProgress(
          {
            ...run.progress,
            state: 'failed',
            message: 'OpenCode member restart and primary rollback failed',
            messageSeverity: 'error',
            updatedAt: nowIso(),
            error: `${restartMessage} Rollback failed: ${rollbackMessage}`,
            cliLogsTail: `${restartMessage}\n${rollbackMessage}`,
          },
          run.onProgress
        );
        if (this.runs.get(run.runId) === run) {
          this.cleanupRun(run);
        }
        throw new Error(
          `OpenCode member restart failed: ${restartMessage}. Primary rollback failed: ${rollbackMessage}`
        );
      }
      throw restartError;
    }

    await this.launchSingleMixedSecondaryLane(run, lane);
    await assertRestartCurrentAfterPersistence();
    await this.persistLaunchStateSnapshot(run, this.getMixedSecondaryLaunchPhase(run));
    await assertRestartCurrentAfterPersistence();
    if (this.isTeamAlive(teamName)) {
      const memberRestartRetained =
        lane.result != null && hasRetainableOpenCodeRuntimeMember(lane.result);
      const restartRetained =
        memberRestartRetained && hasRetainablePrimaryLead(primaryRelaunchResult);
      run.progress = this.runtimeAdapterProgressState.setRuntimeAdapterProgress(
        {
          ...run.progress,
          state: 'ready',
          message: restartRetained
            ? 'OpenCode member lane restart is ready'
            : 'OpenCode team is running with unavailable members',
          messageSeverity: restartRetained ? undefined : 'warning',
          updatedAt: nowIso(),
          error: undefined,
        },
        run.onProgress
      );
    } else {
      this.runTracking.deleteAliveRunId(teamName);
    }
  }

  private async stopUnretainableOpenCodePrimaryLane(input: {
    adapter: TeamLaunchRuntimeAdapter;
    run: ProvisioningRun;
    previousEffectiveMembers: TeamCreateRequest['members'];
    previousLaunchState: Awaited<ReturnType<TeamLaunchStateStore['read']>>;
  }): Promise<void> {
    try {
      await input.adapter.stop({
        runId: input.run.runId,
        laneId: 'primary',
        teamName: input.run.teamName,
        cwd: this.prepareFacade.getOpenCodeRuntimeLaunchCwd(
          input.run.request.cwd,
          input.previousEffectiveMembers
        ),
        providerId: 'opencode',
        reason: 'cleanup',
        previousLaunchState: input.previousLaunchState,
        force: true,
      });
    } catch (error) {
      logger.warn(
        `[${input.run.teamName}] Failed to stop unretainable OpenCode primary lane: ${getErrorMessage(error)}`
      );
    }
  }

  override async attachLiveRosterMember(
    teamName: string,
    memberName: string,
    options?: { reason?: LiveRosterAttachReason }
  ): Promise<void> {
    return this.runAfterInFlightTeamOperation(teamName, () =>
      this.memberLifecycleController.attachLiveRosterMember(teamName, memberName, options)
    );
  }

  override async detachLiveRosterMember(teamName: string, memberName: string): Promise<void> {
    return this.runAfterInFlightTeamOperation(teamName, () =>
      this.memberLifecycleController.detachLiveRosterMember(teamName, memberName)
    );
  }

  override async restartMember(teamName: string, memberName: string): Promise<void> {
    return this.runAfterInFlightTeamOperation(teamName, async () => {
      const activeRestart = this.openCodeAggregatePrimaryRestartByTeam.get(
        teamName.trim().toLowerCase()
      );
      if (activeRestart) {
        throw new Error(
          `OpenCode aggregate primary restart for teammate "${activeRestart.memberName}" is already in progress for team "${teamName}"`
        );
      }
      const candidate = this.isOpenCodeAggregatePrimaryRestartCandidate(teamName, memberName);
      if (!candidate) {
        return this.memberLifecycleController.restartMember(teamName, memberName);
      }

      const restart = this.beginOpenCodeAggregatePrimaryRestart(
        teamName,
        memberName,
        candidate.runId
      );
      try {
        await Promise.all(restart.lease.precedingLifecycleOperations);
        if (candidate.run) {
          await this.memberLifecycleOperationUseCases.runMemberLifecycleOperation(
            teamName,
            memberName,
            'manual_restart',
            () =>
              this.restartPureOpenCodeAggregatePrimaryMemberExclusive({
                teamName,
                memberName,
                run: candidate.run!,
                restartLease: restart.lease,
              })
          );
        } else {
          await this.memberLifecycleController.restartMember(teamName, memberName);
        }
        if (restart.lease.cancelRequested) {
          await this.clearCancelledOpenCodeAggregateRestartState(teamName, restart.lease.runId);
          throw this.getCancelledOpenCodeAggregateRestartError(teamName, memberName);
        }
      } catch (error) {
        if (restart.lease.cancelRequested) {
          await this.clearCancelledOpenCodeAggregateRestartState(teamName, restart.lease.runId);
          if (getErrorMessage(error).includes('owning run is no longer active')) {
            throw error;
          }
          throw this.getCancelledOpenCodeAggregateRestartError(teamName, memberName);
        }
        throw error;
      } finally {
        restart.release();
      }
    });
  }

  override async retryFailedOpenCodeSecondaryLanes(
    teamName: string
  ): Promise<RetryFailedOpenCodeSecondaryLanesResult> {
    return this.runAfterInFlightTeamOperation(teamName, () =>
      this.memberLifecycleController.retryFailedOpenCodeSecondaryLanes(teamName)
    );
  }

  override async reattachOpenCodeOwnedMemberLane(
    teamName: string,
    memberName: string,
    options?: { reason?: 'member_added' | 'member_updated' | 'manual_restart' }
  ): Promise<void> {
    return this.runAfterInFlightTeamOperation(teamName, () =>
      this.memberLifecycleController.reattachOpenCodeOwnedMemberLane(teamName, memberName, options)
    );
  }

  override async detachOpenCodeOwnedMemberLane(
    teamName: string,
    memberName: string
  ): Promise<void> {
    return this.runAfterInFlightTeamOperation(teamName, () =>
      this.memberLifecycleController.detachOpenCodeOwnedMemberLane(teamName, memberName)
    );
  }

  override async stopTeam(teamName: string): Promise<void> {
    const teamKey = teamName.trim().toLowerCase();
    const aggregateRestart = this.openCodeAggregatePrimaryRestartByTeam.get(teamKey);
    if (aggregateRestart) {
      aggregateRestart.cancelRequested = true;
    }
    const primaryStopInFlight = this.openCodeRuntimeAdapterStopInFlightByTeam.get(teamKey)?.promise;
    try {
      await super.stopTeam(teamName);
    } finally {
      await primaryStopInFlight;
    }
  }

  protected override stopOpenCodeRuntimeAdapterTeam(
    teamName: string,
    runId: string
  ): Promise<void> {
    const teamKey = teamName.trim().toLowerCase();
    const existingStop = this.openCodeRuntimeAdapterStopInFlightByTeam.get(teamKey);
    if (existingStop) {
      if (existingStop.runId === runId) {
        return existingStop.promise;
      }
      return existingStop.promise.then(() => this.stopOpenCodeRuntimeAdapterTeam(teamName, runId));
    }

    const cancelledRestartAtStop = this.openCodeAggregatePrimaryRestartByTeam.get(teamKey);
    const promise = super
      .stopOpenCodeRuntimeAdapterTeam(teamName, runId)
      .finally(async () => {
        if (cancelledRestartAtStop?.runId === runId && cancelledRestartAtStop.cancelRequested) {
          await this.clearCancelledOpenCodeAggregateRestartState(
            teamName,
            runId,
            cancelledRestartAtStop
          );
        }
      })
      .finally(() => {
        if (this.openCodeRuntimeAdapterStopInFlightByTeam.get(teamKey)?.promise === promise) {
          this.openCodeRuntimeAdapterStopInFlightByTeam.delete(teamKey);
        }
      });
    this.openCodeRuntimeAdapterStopInFlightByTeam.set(teamKey, { teamName, runId, promise });
    return promise;
  }

  override isTeamAlive(teamName: string): boolean {
    const runId = this.runTracking.getAliveRunId(teamName);
    if (!runId) {
      return false;
    }
    const hasPrimaryRuntime = this.runtimeAdapterRunByTeam.get(teamName)?.runId === runId;
    const run = this.runs.get(runId);
    if (!run) {
      return hasPrimaryRuntime || this.hasSecondaryRuntimeRuns(teamName);
    }
    if (hasPrimaryRuntime || this.hasSecondaryRuntimeRuns(teamName)) {
      return !run.processKilled && !run.cancelRequested;
    }
    return run.child != null && !run.processKilled && !run.cancelRequested;
  }

  setTeamChangeEmitter(emitter: ((event: TeamChangeEvent) => void) | null): void {
    this.teamChangeEmitter = emitter;
  }

  setRuntimeRecoveryFailureObserver(
    observer: ((failure: LeadRuntimeFailureObservation) => void) | null
  ): void {
    this.runtimeFailureObservationBoundary.setObserver(observer);
  }

  protected observeRuntimeFailure(
    run: ProvisioningRun,
    failure: RuntimeFailureObservationInput
  ): void {
    this.runtimeFailureObservationBoundary.observe(run, this.getRunLeadName(run), failure);
  }

  protected override async sendOpenCodeMemberMessageToRuntimeSerialized(input: {
    teamName: string;
    laneId: string;
    memberName?: string;
    send: () => Promise<OpenCodeTeamRuntimeMessageResult>;
  }): Promise<OpenCodeTeamRuntimeMessageResult> {
    const memberName = input.memberName?.trim().toLowerCase();
    return await super.sendOpenCodeMemberMessageToRuntimeSerialized({
      teamName: input.teamName,
      laneId: memberName ? JSON.stringify([input.laneId.trim(), memberName]) : input.laneId,
      send: input.send,
    });
  }

  async createTeam(
    request: TeamCreateRequest,
    onProgress: (progress: TeamProvisioningProgress) => void
  ): Promise<TeamCreateResponse> {
    await this.waitForOpenCodeAggregatePrimaryRestart(request.teamName);
    await this.waitForMemberLifecycleOperations(request.teamName);
    return this.requestAdmissionBoundary.createTeam(request, onProgress);
  }

  async launchTeam(
    request: TeamLaunchRequest,
    onProgress: (progress: TeamProvisioningProgress) => void
  ): Promise<TeamLaunchResponse> {
    await this.waitForOpenCodeAggregatePrimaryRestart(request.teamName);
    await this.waitForMemberLifecycleOperations(request.teamName);
    return this.requestAdmissionBoundary.launchTeam(request, onProgress);
  }
}

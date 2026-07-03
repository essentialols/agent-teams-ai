import {
  type OpenCodeMemberInboxDelivery,
  type OpenCodeMemberMessageDeliveryInput,
  OpenCodeMemberMessageDeliveryService,
  type OpenCodeMemberMessageDeliveryServiceDependencies,
} from '../opencode/delivery/OpenCodeMemberMessageDeliveryService';

import {
  createDefaultOpenCodeRuntimeBootstrapEvidencePorts,
  findDeliverableOpenCodeRuntimeBootstrapSessionEvidence,
  getOpenCodeAppMcpTransportMismatchDiagnostic,
  type OpenCodeRuntimeBootstrapEvidencePorts,
  stampOpenCodeAppMcpTransportEvidenceIfMissing,
} from './TeamProvisioningOpenCodeBootstrapEvidence';

export interface OpenCodeRuntimeBootstrapEvidencePortsFactoryInput {
  teamsBasePath: string;
  warn(message: string): void;
}

export type OpenCodeMemberMessageDeliveryFactoryPorts = Omit<
  OpenCodeMemberMessageDeliveryServiceDependencies,
  | 'findDeliverableOpenCodeRuntimeBootstrapSessionEvidence'
  | 'getOpenCodeAppMcpTransportMismatchDiagnostic'
  | 'stampOpenCodeAppMcpTransportEvidenceIfMissing'
> & {
  createOpenCodeRuntimeBootstrapEvidencePorts(): OpenCodeRuntimeBootstrapEvidencePorts;
};

type DeliveryPorts = OpenCodeMemberMessageDeliveryFactoryPorts;

export interface TeamProvisioningOpenCodeMemberMessageDeliveryHost {
  getOpenCodeRuntimeMessageAdapter: DeliveryPorts['getOpenCodeRuntimeMessageAdapter'];
  readOpenCodeMemberDirectory: DeliveryPorts['readOpenCodeMemberDirectory'];
  resolveOpenCodeMemberIdentityFromDirectory: DeliveryPorts['resolveOpenCodeMemberIdentityFromDirectory'];
  stoppingSecondaryRuntimeTeams: DeliveryPorts['stoppingSecondaryRuntimeTeams'];
  readPersistedTeamProjectPath: DeliveryPorts['readPersistedTeamProjectPath'];
  runTracking: {
    resolveDeliverableTrackedRuntimeRunId: DeliveryPorts['resolveDeliverableTrackedRuntimeRunId'];
  };
  runs: DeliveryPorts['runs'];
  getCurrentOpenCodeRuntimeRunId: DeliveryPorts['getCurrentOpenCodeRuntimeRunId'];
  openCodeRuntimeRecoveryIdentity: {
    resolveCurrentOpenCodeRuntimeRunId: DeliveryPorts['resolveCurrentOpenCodeRuntimeRunId'];
    isOpenCodeRuntimeLaneIndexActive: DeliveryPorts['isOpenCodeRuntimeLaneIndexActive'];
  };
  tryRecoverOpenCodeRuntimeLaneBeforeDelivery: DeliveryPorts['tryRecoverOpenCodeRuntimeLaneBeforeDelivery'];
  tryRecoverOpenCodeRuntimeLaneFromCommittedSessionBeforeDelivery: DeliveryPorts['tryRecoverOpenCodeRuntimeLaneFromCommittedSessionBeforeDelivery'];
  deleteSecondaryRuntimeRun: DeliveryPorts['deleteSecondaryRuntimeRun'];
  cleanupStoppedTeamOpenCodeRuntimeLanesInBackground: DeliveryPorts['cleanupStoppedTeamOpenCodeRuntimeLanesInBackground'];
  createOpenCodeRuntimeBootstrapEvidencePorts(): OpenCodeRuntimeBootstrapEvidencePorts;
  providerRuntime: {
    resolveControlApiBaseUrl: DeliveryPorts['resolveControlApiBaseUrl'];
  };
  sendOpenCodeMemberMessageToRuntimeSerialized: DeliveryPorts['sendOpenCodeMemberMessageToRuntimeSerialized'];
  rememberOpenCodeRuntimePidFromBridge: DeliveryPorts['rememberOpenCodeRuntimePidFromBridge'];
  maybeSyncOpenCodeRuntimePermissionsAfterDelivery: DeliveryPorts['maybeSyncOpenCodeRuntimePermissionsAfterDelivery'];
  isLegacyOpenCodeMemberWorkSyncReadCommitAllowed: DeliveryPorts['isLegacyOpenCodeMemberWorkSyncReadCommitAllowed'];
  createOpenCodePromptDeliveryLedger: DeliveryPorts['createOpenCodePromptDeliveryLedger'];
  openCodeVisibleReplyProofService: DeliveryPorts['openCodeVisibleReplyProofService'];
  openCodePromptDeliveryWatchdogScheduler: DeliveryPorts['openCodePromptDeliveryWatchdogScheduler'];
  openCodePromptDeliveryFollowUpPolicy: DeliveryPorts['openCodePromptDeliveryFollowUpPolicy'];
  isOpenCodeDeliveryResponseReadCommitAllowed: DeliveryPorts['isOpenCodeDeliveryResponseReadCommitAllowed'];
  getOpenCodeDeliveryPendingReason: DeliveryPorts['getOpenCodeDeliveryPendingReason'];
  markOpenCodeAcceptedDeliveryMissingPromptProofForRetry: DeliveryPorts['markOpenCodeAcceptedDeliveryMissingPromptProofForRetry'];
  scheduleOpenCodePromptDeliveryWatchdog: DeliveryPorts['scheduleOpenCodePromptDeliveryWatchdog'];
  logOpenCodePromptDeliveryEvent: DeliveryPorts['logOpenCodePromptDeliveryEvent'];
  requeueOpenCodeRuntimeManifestWatermarkDeliveryIfNeeded: DeliveryPorts['requeueOpenCodeRuntimeManifestWatermarkDeliveryIfNeeded'];
  emitOpenCodePromptDeliveryTaskLogChange: DeliveryPorts['emitOpenCodePromptDeliveryTaskLogChange'];
  observeOpenCodeDirectUserDeliveryInlineIfNeeded: DeliveryPorts['observeOpenCodeDirectUserDeliveryInlineIfNeeded'];
}

export function createOpenCodeRuntimeBootstrapEvidencePorts(
  input: OpenCodeRuntimeBootstrapEvidencePortsFactoryInput
): OpenCodeRuntimeBootstrapEvidencePorts {
  return createDefaultOpenCodeRuntimeBootstrapEvidencePorts(input);
}

export function createOpenCodeMemberMessageDeliveryService(
  ports: OpenCodeMemberMessageDeliveryFactoryPorts
): OpenCodeMemberMessageDeliveryService {
  return new OpenCodeMemberMessageDeliveryService({
    ...ports,
    findDeliverableOpenCodeRuntimeBootstrapSessionEvidence: (input) =>
      findDeliverableOpenCodeRuntimeBootstrapSessionEvidence(
        input,
        ports.createOpenCodeRuntimeBootstrapEvidencePorts()
      ),
    getOpenCodeAppMcpTransportMismatchDiagnostic: (session) =>
      getOpenCodeAppMcpTransportMismatchDiagnostic(session),
    stampOpenCodeAppMcpTransportEvidenceIfMissing: (session, options) =>
      stampOpenCodeAppMcpTransportEvidenceIfMissing(
        session,
        ports.createOpenCodeRuntimeBootstrapEvidencePorts(),
        options
      ),
  });
}

export function createOpenCodeMemberMessageDeliveryServiceFromHost(
  host: TeamProvisioningOpenCodeMemberMessageDeliveryHost
): OpenCodeMemberMessageDeliveryService {
  return createOpenCodeMemberMessageDeliveryService({
    getOpenCodeRuntimeMessageAdapter: () => host.getOpenCodeRuntimeMessageAdapter(),
    readOpenCodeMemberDirectory: (teamName) => host.readOpenCodeMemberDirectory(teamName),
    resolveOpenCodeMemberIdentityFromDirectory: (teamName, memberName, directory) =>
      host.resolveOpenCodeMemberIdentityFromDirectory(teamName, memberName, directory),
    stoppingSecondaryRuntimeTeams: host.stoppingSecondaryRuntimeTeams,
    readPersistedTeamProjectPath: (teamName) => host.readPersistedTeamProjectPath(teamName),
    resolveDeliverableTrackedRuntimeRunId: (teamName) =>
      host.runTracking.resolveDeliverableTrackedRuntimeRunId(teamName),
    runs: host.runs,
    getCurrentOpenCodeRuntimeRunId: (teamName, laneId) =>
      host.getCurrentOpenCodeRuntimeRunId(teamName, laneId),
    resolveCurrentOpenCodeRuntimeRunId: (teamName, laneId) =>
      host.openCodeRuntimeRecoveryIdentity.resolveCurrentOpenCodeRuntimeRunId(teamName, laneId),
    isOpenCodeRuntimeLaneIndexActive: (teamName, laneId) =>
      host.openCodeRuntimeRecoveryIdentity.isOpenCodeRuntimeLaneIndexActive(teamName, laneId),
    tryRecoverOpenCodeRuntimeLaneBeforeDelivery: (input) =>
      host.tryRecoverOpenCodeRuntimeLaneBeforeDelivery(input),
    tryRecoverOpenCodeRuntimeLaneFromCommittedSessionBeforeDelivery: (input) =>
      host.tryRecoverOpenCodeRuntimeLaneFromCommittedSessionBeforeDelivery(input),
    deleteSecondaryRuntimeRun: (teamName, laneId) =>
      host.deleteSecondaryRuntimeRun(teamName, laneId),
    cleanupStoppedTeamOpenCodeRuntimeLanesInBackground: (teamName) =>
      host.cleanupStoppedTeamOpenCodeRuntimeLanesInBackground(teamName),
    createOpenCodeRuntimeBootstrapEvidencePorts: () =>
      host.createOpenCodeRuntimeBootstrapEvidencePorts(),
    resolveControlApiBaseUrl: () => host.providerRuntime.resolveControlApiBaseUrl(),
    sendOpenCodeMemberMessageToRuntimeSerialized: (input) =>
      host.sendOpenCodeMemberMessageToRuntimeSerialized(input),
    rememberOpenCodeRuntimePidFromBridge: (input) =>
      host.rememberOpenCodeRuntimePidFromBridge(input),
    maybeSyncOpenCodeRuntimePermissionsAfterDelivery: (input) =>
      host.maybeSyncOpenCodeRuntimePermissionsAfterDelivery(input),
    isLegacyOpenCodeMemberWorkSyncReadCommitAllowed: (input) =>
      host.isLegacyOpenCodeMemberWorkSyncReadCommitAllowed(input),
    createOpenCodePromptDeliveryLedger: (teamName, laneId) =>
      host.createOpenCodePromptDeliveryLedger(teamName, laneId),
    openCodeVisibleReplyProofService: host.openCodeVisibleReplyProofService,
    openCodePromptDeliveryWatchdogScheduler: host.openCodePromptDeliveryWatchdogScheduler,
    openCodePromptDeliveryFollowUpPolicy: host.openCodePromptDeliveryFollowUpPolicy,
    isOpenCodeDeliveryResponseReadCommitAllowed: (input) =>
      host.isOpenCodeDeliveryResponseReadCommitAllowed(input),
    getOpenCodeDeliveryPendingReason: (input) => host.getOpenCodeDeliveryPendingReason(input),
    markOpenCodeAcceptedDeliveryMissingPromptProofForRetry: (input) =>
      host.markOpenCodeAcceptedDeliveryMissingPromptProofForRetry(input),
    scheduleOpenCodePromptDeliveryWatchdog: (input) =>
      host.scheduleOpenCodePromptDeliveryWatchdog(input),
    logOpenCodePromptDeliveryEvent: (event, record, extra) =>
      host.logOpenCodePromptDeliveryEvent(event, record, extra),
    requeueOpenCodeRuntimeManifestWatermarkDeliveryIfNeeded: (input) =>
      host.requeueOpenCodeRuntimeManifestWatermarkDeliveryIfNeeded(input),
    emitOpenCodePromptDeliveryTaskLogChange: (record, detail) =>
      host.emitOpenCodePromptDeliveryTaskLogChange(record, detail),
    observeOpenCodeDirectUserDeliveryInlineIfNeeded: (input) =>
      host.observeOpenCodeDirectUserDeliveryInlineIfNeeded(input),
  });
}

export async function deliverOpenCodeMemberMessage(
  service: OpenCodeMemberMessageDeliveryService,
  teamName: string,
  input: OpenCodeMemberMessageDeliveryInput
): Promise<OpenCodeMemberInboxDelivery> {
  return await service.deliver(teamName, input);
}

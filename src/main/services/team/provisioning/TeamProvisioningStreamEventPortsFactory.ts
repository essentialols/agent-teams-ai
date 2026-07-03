import { killTeamProcess } from '@main/utils/childProcess';

import { boundProgressAssistantParts } from '../progressPayload';

import {
  type LeadContextUsageRunLike,
  updateLeadContextUsageFromUsageForRun,
} from './TeamProvisioningLeadContextUsage';
import {
  hasApiError,
  isAuthFailureWarning,
  isQuotaRetryMessage,
  normalizeApiRetryErrorMessage,
  toMarkdownCodeSafe,
} from './TeamProvisioningOutputErrorPolicy';
import {
  appendProvisioningTrace,
  boundRunProvisioningOutputParts,
  buildProvisioningLiveOutput,
  type TeamProvisioningTraceRun,
} from './TeamProvisioningProgressBuffers';
import { extractCliLogsFromRun, type RetainedLogsRunLike } from './TeamProvisioningRetainedLogs';

import type {
  TeamProvisioningStreamEventPorts,
  TeamProvisioningStreamRun,
} from './TeamProvisioningStreamEvents';

export type TeamProvisioningStreamEventPortsFactoryRun = TeamProvisioningStreamRun &
  TeamProvisioningTraceRun &
  RetainedLogsRunLike &
  LeadContextUsageRunLike;

export interface TeamProvisioningStreamEventPortCallbacks<
  TRun extends TeamProvisioningStreamEventPortsFactoryRun,
> {
  updateProgress: TeamProvisioningStreamEventPorts<TRun>['updateProgress'];
  resetLiveLeadTextBuffer: TeamProvisioningStreamEventPorts<TRun>['resetLiveLeadTextBuffer'];
  handleTeammatePermissionRequest: TeamProvisioningStreamEventPorts<TRun>['handleTeammatePermissionRequest'];
  finishRuntimeToolActivity: TeamProvisioningStreamEventPorts<TRun>['finishRuntimeToolActivity'];
  handleNativeTeammateUserMessage: TeamProvisioningStreamEventPorts<TRun>['handleNativeTeammateUserMessage'];
  handleAuthFailureInOutput: TeamProvisioningStreamEventPorts<TRun>['handleAuthFailureInOutput'];
  failProvisioningWithApiError: TeamProvisioningStreamEventPorts<TRun>['failProvisioningWithApiError'];
  appendProvisioningAssistantText: TeamProvisioningStreamEventPorts<TRun>['appendProvisioningAssistantText'];
  pushLiveLeadTextMessage: TeamProvisioningStreamEventPorts<TRun>['pushLiveLeadTextMessage'];
  startRuntimeToolActivity: TeamProvisioningStreamEventPorts<TRun>['startRuntimeToolActivity'];
  getRunLeadName: TeamProvisioningStreamEventPorts<TRun>['getRunLeadName'];
  captureTeamSpawnEvents: TeamProvisioningStreamEventPorts<TRun>['captureTeamSpawnEvents'];
  captureSendMessages: TeamProvisioningStreamEventPorts<TRun>['captureSendMessages'];
  emitLeadContextUsage: TeamProvisioningStreamEventPorts<TRun>['emitLeadContextUsage'];
  resetRuntimeToolActivity: TeamProvisioningStreamEventPorts<TRun>['resetRuntimeToolActivity'];
  setLeadActivity: TeamProvisioningStreamEventPorts<TRun>['setLeadActivity'];
  emitTeamChange: TeamProvisioningStreamEventPorts<TRun>['emitTeamChange'];
  pushLiveLeadProcessMessage: TeamProvisioningStreamEventPorts<TRun>['pushLiveLeadProcessMessage'];
  injectPostCompactReminder: TeamProvisioningStreamEventPorts<TRun>['injectPostCompactReminder'];
  injectGeminiPostLaunchHydration: TeamProvisioningStreamEventPorts<TRun>['injectGeminiPostLaunchHydration'];
  completeProvisioningFromSuccessfulResult: TeamProvisioningStreamEventPorts<TRun>['completeProvisioningFromSuccessfulResult'];
  handleControlRequest: TeamProvisioningStreamEventPorts<TRun>['handleControlRequest'];
  handleProvisioningTurnComplete: TeamProvisioningStreamEventPorts<TRun>['handleProvisioningTurnComplete'];
  cleanupRun: TeamProvisioningStreamEventPorts<TRun>['cleanupRun'];
  emitApiErrorWarning: TeamProvisioningStreamEventPorts<TRun>['emitApiErrorWarning'];
  setMemberSpawnStatus: TeamProvisioningStreamEventPorts<TRun>['setMemberSpawnStatus'];
  appendMemberBootstrapDiagnostic: TeamProvisioningStreamEventPorts<TRun>['appendMemberBootstrapDiagnostic'];
  reevaluateMemberLaunchStatus: TeamProvisioningStreamEventPorts<TRun>['reevaluateMemberLaunchStatus'];
  invalidateRuntimeSnapshotCaches: TeamProvisioningStreamEventPorts<TRun>['invalidateRuntimeSnapshotCaches'];
  markUnconfirmedBootstrapMembersFailed: TeamProvisioningStreamEventPorts<TRun>['markUnconfirmedBootstrapMembersFailed'];
  stopPersistentTeamMembers: TeamProvisioningStreamEventPorts<TRun>['stopPersistentTeamMembers'];
  persistLaunchStateSnapshot: TeamProvisioningStreamEventPorts<TRun>['persistLaunchStateSnapshot'];
}

export function createTeamProvisioningStreamEventPorts<
  TRun extends TeamProvisioningStreamEventPortsFactoryRun,
>(
  callbacks: TeamProvisioningStreamEventPortCallbacks<TRun>
): TeamProvisioningStreamEventPorts<TRun> {
  return {
    updateProgress: callbacks.updateProgress,
    extractCliLogsFromRun,
    buildProvisioningLiveOutput,
    boundRunProvisioningOutputParts,
    boundProgressAssistantParts,
    appendProvisioningTrace,
    resetLiveLeadTextBuffer: callbacks.resetLiveLeadTextBuffer,
    handleTeammatePermissionRequest: callbacks.handleTeammatePermissionRequest,
    finishRuntimeToolActivity: callbacks.finishRuntimeToolActivity,
    handleNativeTeammateUserMessage: callbacks.handleNativeTeammateUserMessage,
    handleAuthFailureInOutput: callbacks.handleAuthFailureInOutput,
    hasApiError,
    isAuthFailureWarning,
    failProvisioningWithApiError: callbacks.failProvisioningWithApiError,
    appendProvisioningAssistantText: callbacks.appendProvisioningAssistantText,
    pushLiveLeadTextMessage: callbacks.pushLiveLeadTextMessage,
    startRuntimeToolActivity: callbacks.startRuntimeToolActivity,
    getRunLeadName: callbacks.getRunLeadName,
    captureTeamSpawnEvents: callbacks.captureTeamSpawnEvents,
    captureSendMessages: callbacks.captureSendMessages,
    updateLeadContextUsageFromUsage: updateLeadContextUsageFromUsageForRun,
    emitLeadContextUsage: callbacks.emitLeadContextUsage,
    resetRuntimeToolActivity: callbacks.resetRuntimeToolActivity,
    setLeadActivity: callbacks.setLeadActivity,
    emitTeamChange: callbacks.emitTeamChange,
    pushLiveLeadProcessMessage: callbacks.pushLiveLeadProcessMessage,
    injectPostCompactReminder: callbacks.injectPostCompactReminder,
    injectGeminiPostLaunchHydration: callbacks.injectGeminiPostLaunchHydration,
    completeProvisioningFromSuccessfulResult: callbacks.completeProvisioningFromSuccessfulResult,
    handleControlRequest: callbacks.handleControlRequest,
    handleProvisioningTurnComplete: callbacks.handleProvisioningTurnComplete,
    cleanupRun: callbacks.cleanupRun,
    killTeamProcess,
    normalizeApiRetryErrorMessage,
    isQuotaRetryMessage,
    toMarkdownCodeSafe,
    emitApiErrorWarning: callbacks.emitApiErrorWarning,
    setMemberSpawnStatus: callbacks.setMemberSpawnStatus,
    appendMemberBootstrapDiagnostic: callbacks.appendMemberBootstrapDiagnostic,
    reevaluateMemberLaunchStatus: callbacks.reevaluateMemberLaunchStatus,
    invalidateRuntimeSnapshotCaches: callbacks.invalidateRuntimeSnapshotCaches,
    markUnconfirmedBootstrapMembersFailed: callbacks.markUnconfirmedBootstrapMembersFailed,
    stopPersistentTeamMembers: callbacks.stopPersistentTeamMembers,
    persistLaunchStateSnapshot: callbacks.persistLaunchStateSnapshot,
  };
}

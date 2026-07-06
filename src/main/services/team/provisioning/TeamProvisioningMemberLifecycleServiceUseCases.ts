import {
  createPersistOpenCodeMemberRestartSystemMessageUseCase,
  type PersistOpenCodeMemberRestartSystemMessageUseCase,
} from './TeamProvisioningOpenCodeMemberRestartSystemMessageUseCase';

import type { AppendDirectProcessRuntimeEventUseCase } from './TeamProvisioningAppendDirectProcessRuntimeEventUseCase';
import type { TeamProvisioningMemberLifecycleUseCasePorts } from './TeamProvisioningMemberLifecycle';
import type { TeamProvisioningMemberLifecycleOperationRunner } from './TeamProvisioningMemberLifecycleOperationRunner';

export interface TeamProvisioningMemberLifecycleServiceUseCasePorts {
  persistSentMessage(teamName: string, message: Record<string, unknown>): void;
  appendDirectProcessRuntimeEvent: AppendDirectProcessRuntimeEventUseCase;
  operationRunner: Pick<
    TeamProvisioningMemberLifecycleOperationRunner,
    'runMemberLifecycleOperation'
  >;
  nowIso(): string;
  randomUUID(): string;
}

export interface TeamProvisioningMemberLifecycleServiceUseCases extends Pick<
  TeamProvisioningMemberLifecycleUseCasePorts,
  | 'persistOpenCodeMemberRestartSystemMessage'
  | 'appendDirectProcessRuntimeEvent'
  | 'runMemberLifecycleOperation'
> {
  persistOpenCodeMemberRestartSystemMessage: PersistOpenCodeMemberRestartSystemMessageUseCase;
  appendDirectProcessRuntimeEvent: AppendDirectProcessRuntimeEventUseCase;
  runMemberLifecycleOperation: TeamProvisioningMemberLifecycleOperationRunner['runMemberLifecycleOperation'];
}

export function createTeamProvisioningMemberLifecycleServiceUseCases(
  ports: TeamProvisioningMemberLifecycleServiceUseCasePorts
): TeamProvisioningMemberLifecycleServiceUseCases {
  return {
    persistOpenCodeMemberRestartSystemMessage:
      createPersistOpenCodeMemberRestartSystemMessageUseCase({
        persistSentMessage: ports.persistSentMessage,
        nowIso: ports.nowIso,
        randomUUID: ports.randomUUID,
      }),
    appendDirectProcessRuntimeEvent: ports.appendDirectProcessRuntimeEvent,
    runMemberLifecycleOperation: (teamName, memberName, kind, operation) =>
      ports.operationRunner.runMemberLifecycleOperation(teamName, memberName, kind, operation),
  };
}

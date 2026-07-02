import { type TeamRuntimeLaneCoordinator } from '@features/team-runtime-lanes/main';

import {
  type OpenCodeMemberInboxDelivery,
  type OpenCodeMemberMessageDeliveryInput,
  OpenCodeMemberMessageDeliveryService,
  type OpenCodeMemberMessageDeliveryServiceDependencies,
} from '../opencode/delivery/OpenCodeMemberMessageDeliveryService';

import { isPureOpenCodeProvisioningRequest } from './TeamProvisioningLaunchCompatibility';
import {
  createDefaultOpenCodeRuntimeBootstrapEvidencePorts,
  findDeliverableOpenCodeRuntimeBootstrapSessionEvidence,
  getOpenCodeAppMcpTransportMismatchDiagnostic,
  type OpenCodeRuntimeBootstrapEvidencePorts,
  stampOpenCodeAppMcpTransportEvidenceIfMissing,
} from './TeamProvisioningOpenCodeBootstrapEvidence';
import {
  createMixedSecondaryLaneStates as createMixedSecondaryLaneStatesFromPlan,
  type MixedSecondaryRuntimeLaneState,
} from './TeamProvisioningSecondaryRuntimeRuns';

import type { TeamRuntimeLanePlan } from '@features/team-runtime-lanes';
import type { TeamCreateRequest, TeamProviderId } from '@shared/types';

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

export async function deliverOpenCodeMemberMessage(
  service: OpenCodeMemberMessageDeliveryService,
  teamName: string,
  input: OpenCodeMemberMessageDeliveryInput
): Promise<OpenCodeMemberInboxDelivery> {
  return await service.deliver(teamName, input);
}

export function shouldRouteOpenCodeToRuntimeAdapter(
  request: {
    providerId?: TeamProviderId;
    members?: readonly { providerId?: TeamProviderId; provider?: TeamProviderId }[];
  },
  hasOpenCodeRuntimeAdapter: boolean
): boolean {
  return isPureOpenCodeProvisioningRequest(request) && hasOpenCodeRuntimeAdapter;
}

export function planRuntimeLanesOrThrow(
  runtimeLaneCoordinator: Pick<TeamRuntimeLaneCoordinator, 'planProvisioningMembers'>,
  input: {
    leadProviderId: TeamProviderId | undefined;
    members: TeamCreateRequest['members'];
    baseCwd?: string;
    hasOpenCodeRuntimeAdapter: boolean;
  }
): TeamRuntimeLanePlan {
  return runtimeLaneCoordinator.planProvisioningMembers(input);
}

export function createMixedSecondaryLaneStates(
  plan: TeamRuntimeLanePlan
): MixedSecondaryRuntimeLaneState[] {
  return createMixedSecondaryLaneStatesFromPlan(plan);
}

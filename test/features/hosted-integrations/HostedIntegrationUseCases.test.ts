import { HostedIntegrationUseCases } from '@features/hosted-integrations/core/application';
import { HostedIntegrationDomainError } from '@features/hosted-integrations/core/domain';

import type {
  HostedGitHubActionCommandDto,
  HostedGitHubActionStatusDto,
  HostedGitHubRepositoryTargetDto,
  HostedIntegrationStateDto,
} from '@features/hosted-integrations/contracts';
import type { HostedIntegrationUseCasePorts } from '@features/hosted-integrations/core/application';

const now = '2026-01-01T00:00:00.000Z';

describe('HostedIntegrationUseCases', () => {
  it('refreshes target state before action submit and blocks disabled targets before upload', async () => {
    const actions = {
      getAgentGithubActionStatus: vi.fn(),
      submitAgentGithubAction: vi.fn(),
    };
    const stateStore = {
      ...createStateStore(),
      saveTargets: vi.fn(),
    };
    const ports = createPorts({
      actions,
      stateStore,
      targets: {
        ...createTargetsPort(),
        listTargets: vi.fn(async () => [target({ status: 'disabled', targetId: 'target_1' })]),
      },
    });
    const useCases = new HostedIntegrationUseCases(ports);

    await expect(useCases.submitAgentGithubAction(command())).rejects.toThrow(
      HostedIntegrationDomainError
    );

    expect(stateStore.saveTargets).toHaveBeenCalledWith([
      expect.objectContaining({ status: 'disabled', targetId: 'target_1' }),
    ]);
    expect(actions.submitAgentGithubAction).not.toHaveBeenCalled();
  });

  it('submits a trusted envelope only after the target is confirmed enabled', async () => {
    const status: HostedGitHubActionStatusDto = {
      actionRequestId: 'action_1',
      fetchedAt: now,
      status: 'queued',
    };
    const actions = {
      getAgentGithubActionStatus: vi.fn(),
      submitAgentGithubAction: vi.fn(async () => status),
    };
    const ports = createPorts({
      actions,
      targets: {
        ...createTargetsPort(),
        listTargets: vi.fn(async () => [target({ status: 'enabled', targetId: 'target_1' })]),
      },
    });
    const useCases = new HostedIntegrationUseCases(ports);

    await expect(useCases.submitAgentGithubAction(command())).resolves.toEqual(status);

    expect(actions.submitAgentGithubAction).toHaveBeenCalledWith(
      'agtcp_secret',
      expect.objectContaining({
        requestedBy: expect.objectContaining({
          agentId: 'agent:reviewer',
          teamId: 'team:core',
        }),
        requestId: 'github-action:stable',
        targetId: 'target_1',
      })
    );
  });
});

function command(): HostedGitHubActionCommandDto {
  return {
    actionType: 'issue_comment',
    localAttemptId: 'attempt_1',
    payload: { body: 'Ready for review' },
    runtimeMember: {
      agentId: 'reviewer',
      agentName: 'Reviewer',
      teamId: 'core',
      teamName: 'Core',
    },
    targetId: 'target_1',
  };
}

function createPorts(
  overrides: Partial<HostedIntegrationUseCasePorts> = {}
): HostedIntegrationUseCasePorts {
  return {
    actions: {
      getAgentGithubActionStatus: vi.fn(),
      submitAgentGithubAction: vi.fn(),
    },
    browserOpen: { openExternal: vi.fn() },
    clock: { now: () => new Date(now) },
    connection: {
      bootstrapWorkspace: vi.fn(),
      getMe: vi.fn(),
      revokeSession: vi.fn(),
    },
    idGenerator: { stableActionRequestId: vi.fn(async () => 'github-action:stable') },
    pairing: {
      completePairing: vi.fn(),
      startPairing: vi.fn(),
    },
    setup: {
      getGitHubSetupStatus: vi.fn(),
      startGitHubSetup: vi.fn(),
    },
    stateStore: createStateStore(),
    targets: createTargetsPort(),
    tokenStore: {
      clearToken: vi.fn(),
      isAvailable: vi.fn(async () => true),
      readToken: vi.fn(async () => 'agtcp_secret'),
      writeToken: vi.fn(),
    },
    ...overrides,
  };
}

function createStateStore(): HostedIntegrationUseCasePorts['stateStore'] {
  return {
    markSessionRevoked: vi.fn(),
    readState: vi.fn(async () => state()),
    saveActionStatus: vi.fn(),
    saveConnections: vi.fn(),
    saveControlPlaneBaseUrl: vi.fn(),
    saveSession: vi.fn(),
    saveSetupSession: vi.fn(),
    saveTargets: vi.fn(),
  };
}

function createTargetsPort(): HostedIntegrationUseCasePorts['targets'] {
  return {
    disableTarget: vi.fn(),
    enableTarget: vi.fn(),
    listAvailableRepositories: vi.fn(),
    listConnections: vi.fn(),
    listTargets: vi.fn(async () => [target({ status: 'enabled', targetId: 'target_1' })]),
  };
}

function state(): HostedIntegrationStateDto {
  return {
    availability: {
      contractVersion: 'desktop-hosted-integrations-v1',
      status: 'available',
    },
    connections: [],
    fetchedAt: now,
    recentActions: [],
    targets: [],
  };
}

function target(
  overrides: Partial<HostedGitHubRepositoryTargetDto> = {}
): HostedGitHubRepositoryTargetDto {
  return {
    connectionId: 'connection_1',
    displayFullName: 'org/repo',
    displayName: 'repo',
    displayOwner: 'org',
    fetchedAt: now,
    githubRepositoryId: '123',
    status: 'enabled',
    targetId: 'target_1',
    ...overrides,
  };
}

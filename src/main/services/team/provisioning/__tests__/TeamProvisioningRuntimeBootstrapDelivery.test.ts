import { createTeamRuntimeLaneCoordinator } from '@features/team-runtime-lanes/main';
import { tmpdir } from 'os';
import { describe, expect, it, vi } from 'vitest';

import {
  createMixedSecondaryLaneStates,
  createOpenCodeMemberMessageDeliveryService,
  createOpenCodeRuntimeBootstrapEvidencePorts,
  deliverOpenCodeMemberMessage,
  type OpenCodeMemberMessageDeliveryFactoryPorts,
  planRuntimeLanesOrThrow,
  shouldRouteOpenCodeToRuntimeAdapter,
} from '../TeamProvisioningRuntimeBootstrapDelivery';

import type { TeamCreateRequest } from '@shared/types';

function member(
  name: string,
  providerId: 'anthropic' | 'codex' | 'opencode',
  extra: Partial<TeamCreateRequest['members'][number]> = {}
): TeamCreateRequest['members'][number] {
  return {
    name,
    role: 'engineer',
    providerId,
    ...extra,
  } as TeamCreateRequest['members'][number];
}

describe('TeamProvisioningRuntimeBootstrapDelivery', () => {
  it('routes only pure OpenCode requests when the runtime adapter exists', () => {
    expect(
      shouldRouteOpenCodeToRuntimeAdapter(
        {
          providerId: 'opencode',
          members: [member('Ada', 'opencode')],
        },
        true
      )
    ).toBe(true);

    expect(
      shouldRouteOpenCodeToRuntimeAdapter(
        {
          providerId: 'opencode',
          members: [member('Ada', 'opencode')],
        },
        false
      )
    ).toBe(false);

    expect(
      shouldRouteOpenCodeToRuntimeAdapter(
        {
          providerId: 'codex',
          members: [member('Ada', 'codex'), member('Grace', 'opencode')],
        },
        true
      )
    ).toBe(false);
  });

  it('plans OpenCode side lanes only when the runtime adapter is available', () => {
    const coordinator = createTeamRuntimeLaneCoordinator();
    const members = [member('Ada', 'codex'), member('Grace', 'opencode')];

    expect(() =>
      planRuntimeLanesOrThrow(coordinator, {
        leadProviderId: 'codex',
        members,
        hasOpenCodeRuntimeAdapter: false,
      })
    ).toThrow('OpenCode side lanes require the OpenCode runtime adapter to be registered.');

    const plan = planRuntimeLanesOrThrow(coordinator, {
      leadProviderId: 'codex',
      members,
      hasOpenCodeRuntimeAdapter: true,
    });

    expect(plan.mode).toBe('mixed_opencode_side_lanes');
    expect(plan.primaryMembers.map((candidate) => candidate.name)).toEqual(['Ada']);
    expect(createMixedSecondaryLaneStates(plan)).toMatchObject([
      {
        laneId: 'secondary:opencode:Grace',
        providerId: 'opencode',
        state: 'queued',
        member: { name: 'Grace' },
      },
    ]);
  });

  it('creates bootstrap evidence ports from explicit factory input', () => {
    const warn = vi.fn();
    const ports = createOpenCodeRuntimeBootstrapEvidencePorts({
      teamsBasePath: tmpdir(),
      warn,
    });

    expect(ports.teamsBasePath).toBe(tmpdir());
    expect(ports.warn).toBe(warn);
  });

  it('builds the delivery service and delegates delivery through the helper', async () => {
    const ports = {
      getOpenCodeRuntimeMessageAdapter: vi.fn(() => null),
      createOpenCodeRuntimeBootstrapEvidencePorts: vi.fn(() =>
        createOpenCodeRuntimeBootstrapEvidencePorts({
          teamsBasePath: tmpdir(),
          warn: vi.fn(),
        })
      ),
    } as unknown as OpenCodeMemberMessageDeliveryFactoryPorts;

    const service = createOpenCodeMemberMessageDeliveryService(ports);
    const delivery = await deliverOpenCodeMemberMessage(service, 'team-a', {
      memberName: 'Ada',
      text: 'hello',
    });

    expect(delivery).toEqual({
      delivered: false,
      reason: 'opencode_runtime_message_bridge_unavailable',
    });
    expect(ports.getOpenCodeRuntimeMessageAdapter).toHaveBeenCalledTimes(1);
    expect(ports.createOpenCodeRuntimeBootstrapEvidencePorts).not.toHaveBeenCalled();
  });
});

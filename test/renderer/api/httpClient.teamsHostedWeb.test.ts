import { HttpAPIClient } from '@renderer/api/httpClient';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

class FakeEventSource {
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  addEventListener = vi.fn();
  close = vi.fn();
}

describe('HttpAPIClient hosted web teams', () => {
  let calls: Array<{ url: string; init: RequestInit | undefined }>;
  let fetchMock: ReturnType<typeof vi.fn>;
  let eventSourceMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    calls = [];
    fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return routeResponse(url);
    });
    eventSourceMock = vi.fn(() => new FakeEventSource());
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('EventSource', eventSourceMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('maps the Electron teams surface to typed hosted-web HTTP routes', async () => {
    const client = new HttpAPIClient('https://hosted.example');

    await expect(client.teams.list()).resolves.toEqual([
      expect.objectContaining({
        teamName: 'team/1',
        displayName: 'Team 1',
        memberCount: 1,
        projectPath: '/workspace/project',
      }),
    ]);

    await expect(client.teams.getData('team/1')).resolves.toMatchObject({
      teamName: 'team/1',
      config: { projectPath: '/workspace/project' },
      tasks: [{ id: 'task-1', kanbanColumn: 'review' }],
      kanbanState: { columnOrder: { review: ['task-1'] } },
      processes: [],
      isAlive: true,
    });

    await expect(
      client.teams.createTeam({
        teamName: 'new-team',
        cwd: '/workspace/new-project',
        members: [
          {
            name: 'Builder',
            role: 'Implementation',
            isolation: 'worktree',
            providerId: 'codex',
            model: 'gpt-5',
          },
        ],
        providerId: 'codex',
        model: 'gpt-5',
        effort: 'high',
        skipPermissions: false,
      })
    ).resolves.toEqual({ runId: 'run-create', launchStatus: 'started' });

    await expect(
      client.teams.launchTeam({
        teamName: 'team/1',
        cwd: '/workspace/project',
        providerId: 'codex',
        model: 'gpt-5',
      })
    ).resolves.toEqual({
      runId: 'run-launch',
      launchStatus: 'already_running',
      alreadyRunning: true,
    });

    await expect(client.teams.getProvisioningStatus('run-launch')).resolves.toMatchObject({
      runId: 'run-launch',
      teamName: 'team/1',
      state: 'ready',
      message: 'Ready',
    });
    await expect(client.teams.processAlive('team/1')).resolves.toBe(true);
    await expect(client.teams.aliveList()).resolves.toEqual(['team/1']);
    await expect(client.teams.stop('team/1')).resolves.toBeUndefined();

    expect(calls.map((call) => call.url)).toEqual([
      'https://hosted.example/api/hosted/v1/teams',
      'https://hosted.example/api/hosted/v1/teams/team%2F1',
      'https://hosted.example/api/hosted/v1/teams/new-team/launch',
      'https://hosted.example/api/hosted/v1/teams/team%2F1/launch',
      'https://hosted.example/api/hosted/v1/teams/provisioning/run-launch',
      'https://hosted.example/api/hosted/v1/teams/team%2F1/runtime',
      'https://hosted.example/api/hosted/v1/teams/runtime/alive',
      'https://hosted.example/api/hosted/v1/teams/team%2F1/stop',
    ]);

    expect(calls[2].init).toMatchObject({ method: 'POST' });
    expect(JSON.parse(String(calls[2].init?.body))).toEqual({
      workspaceRef: { id: '/workspace/new-project', displayName: 'new-project' },
      provider: { providerId: 'codex', modelId: 'gpt-5', effort: 'high' },
      members: [
        {
          displayName: 'Builder',
          role: 'Implementation',
          isolation: 'managed-worktree',
          provider: { providerId: 'codex', modelId: 'gpt-5' },
        },
      ],
      requireManualApproval: true,
    });
    expect(calls[3].init).toMatchObject({ method: 'POST' });
    expect(JSON.parse(String(calls[3].init?.body))).toEqual({
      workspaceRef: { id: '/workspace/project', displayName: 'project' },
      provider: { providerId: 'codex', modelId: 'gpt-5' },
    });
    expect(calls[7].init).toMatchObject({ method: 'POST' });
  });

  it('uses hosted-web safe error mapping for browser teams failures', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: {
            code: '../../../Users/name/project/provider_payload',
            message: 'Provider failed at /Users/name/project with token sk-secret',
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    );
    const client = new HttpAPIClient('https://hosted.example');

    let error: unknown;
    try {
      await client.teams.list();
    } catch (caught) {
      error = caught;
    }

    expect(error).toMatchObject({
      name: 'HostedWebTransportError',
      kind: 'http',
      status: 500,
      route: '/api/hosted/v1/teams',
      code: '/api/hosted/v1/errors/http_500',
      message: 'Hosted web request failed with status 500',
    });
    expect(error instanceof Error ? error.message : String(error)).not.toContain('/Users/name');
  });
});

function routeResponse(url: string): Response {
  if (url.endsWith('/api/hosted/v1/teams')) {
    return jsonResponse({ teams: [hostedTeam()] });
  }
  if (url.endsWith('/api/hosted/v1/teams/team%2F1')) {
    return jsonResponse({
      team: hostedTeam(),
      tasks: [
        {
          taskId: 'task-1',
          displayId: 'T-1',
          subject: 'Ship browser teams',
          status: 'in_progress',
          ownerMemberId: 'builder',
          reviewState: 'review',
          updatedAt: '2026-07-11T00:00:00.000Z',
        },
      ],
      kanban: [{ status: 'review', taskIds: ['task-1'] }],
      revision: 'rev-1',
    });
  }
  if (url.endsWith('/api/hosted/v1/teams/new-team/launch')) {
    return jsonResponse({ runId: 'run-create', launchStatus: 'started' });
  }
  if (url.endsWith('/api/hosted/v1/teams/team%2F1/launch')) {
    return jsonResponse({ runId: 'run-launch', launchStatus: 'already_running' });
  }
  if (url.endsWith('/api/hosted/v1/teams/provisioning/run-launch')) {
    return jsonResponse({
      runId: 'run-launch',
      teamId: 'team/1',
      state: 'ready',
      message: 'Ready',
      startedAt: '2026-07-11T00:00:00.000Z',
      updatedAt: '2026-07-11T00:00:01.000Z',
    });
  }
  if (url.endsWith('/api/hosted/v1/teams/team%2F1/runtime')) {
    return jsonResponse({ isAlive: true, terminalAvailable: true, activeProcessCount: 1 });
  }
  if (url.endsWith('/api/hosted/v1/teams/runtime/alive')) {
    return jsonResponse({ teamIds: ['team/1'] });
  }
  if (url.endsWith('/api/hosted/v1/teams/team%2F1/stop')) {
    return jsonResponse({ isAlive: false, terminalAvailable: false, activeProcessCount: 0 });
  }
  return jsonResponse({ error: { code: '/api/hosted/v1/errors/not_found' } }, 404);
}

function hostedTeam() {
  return {
    teamId: 'team/1',
    displayName: 'Team 1',
    description: 'Hosted team',
    color: '#0f766e',
    project: {
      workspaceRef: {
        id: '/workspace/project',
        displayName: 'project',
        repositoryLabel: 'agent-teams-ai',
        branchLabel: 'main',
      },
    },
    members: [
      {
        memberId: 'builder',
        displayName: 'Builder',
        role: 'Implementation',
        color: '#2563eb',
        provider: { providerId: 'codex', modelId: 'gpt-5', effort: 'high' },
        currentTaskId: 'task-1',
        taskCount: 1,
        isolation: 'managed-worktree',
      },
    ],
    taskCount: 1,
    lastActivity: '2026-07-11T00:00:00.000Z',
    runtime: { isAlive: true, terminalAvailable: true, activeProcessCount: 1 },
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

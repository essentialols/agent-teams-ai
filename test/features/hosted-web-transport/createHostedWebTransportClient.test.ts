import {
  createHostedWebTransportClient,
  type HostedWebEventSourceConstructor,
  type HostedWebFetch,
  type HostedWebSocketConstructor,
  HostedWebTransportError,
} from '@features/hosted-web-transport/renderer';
import { describe, expect, it, vi } from 'vitest';

class MockEventSource {
  static instances: MockEventSource[] = [];

  readonly listeners = new Map<string, EventListener>();
  readonly url: string;
  closed = false;

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  addEventListener(type: string, listener: EventListener): void {
    this.listeners.set(type, listener);
  }

  close(): void {
    this.closed = true;
  }

  emit(type: string, data: string, lastEventId?: string): void {
    this.listeners.get(type)?.({ type, data, lastEventId } as MessageEvent);
  }
}

class MockWebSocket {
  static instances: MockWebSocket[] = [];

  readonly url: string;
  readonly protocols?: string | string[];

  constructor(url: string, protocols?: string | string[]) {
    this.url = url;
    this.protocols = protocols;
    MockWebSocket.instances.push(this);
  }
}

describe('createHostedWebTransportClient', () => {
  it('uses typed HTTP routes and workspaceRef DTOs for the high-value team workflow subset', async () => {
    const calls: Array<{ url: string; init: Parameters<HostedWebFetch>[1] }> = [];
    const fetchMock: HostedWebFetch = vi.fn(async (url, init) => {
      calls.push({ url, init });
      if (url.endsWith('/teams')) {
        return jsonResponse({
          teams: [],
        });
      }
      if (url.endsWith('/teams/team%2F1')) {
        return jsonResponse({
          team: {
            teamId: 'team/1',
            displayName: 'Team 1',
            description: '',
            project: null,
            members: [],
            taskCount: 0,
            lastActivity: null,
            runtime: { isAlive: false, terminalAvailable: false, activeProcessCount: 0 },
          },
          tasks: [],
          kanban: [],
          revision: 'rev-1',
        });
      }
      if (url.endsWith('/teams/team%2F1/launch')) {
        return jsonResponse({ runId: 'run-1', launchStatus: 'started' });
      }
      if (url.endsWith('/teams/provisioning/run-1')) {
        return jsonResponse({
          runId: 'run-1',
          teamId: 'team/1',
          state: 'ready',
          message: 'Ready',
          startedAt: '2026-07-10T00:00:00.000Z',
          updatedAt: '2026-07-10T00:00:01.000Z',
        });
      }
      if (url.endsWith('/teams/team%2F1/runtime')) {
        return jsonResponse({ isAlive: true, terminalAvailable: true, activeProcessCount: 1 });
      }
      if (url.endsWith('/teams/runtime/alive')) {
        return jsonResponse({ teamIds: ['team/1'] });
      }
      if (url.endsWith('/teams/team%2F1/stop')) {
        return jsonResponse({ isAlive: false, terminalAvailable: false, activeProcessCount: 0 });
      }
      if (url.endsWith('/teams/team%2F1/tasks')) {
        return jsonResponse({
          task: { taskId: 'task-1', subject: 'Ship it', status: 'pending' },
        });
      }
      if (url.endsWith('/teams/team%2F1/terminal/sessions')) {
        return jsonResponse({
          terminalSessionId: 'session-1',
          webSocketUrl: 'wss://hosted.example/api/hosted/v1/terminal/session-1',
          expiresAt: '2026-07-10T00:00:00.000Z',
        });
      }
      return jsonResponse(
        { error: { code: '/api/hosted/v1/errors/not_found', message: 'not found' } },
        false,
        404
      );
    });

    const client = createHostedWebTransportClient({
      baseUrl: 'https://hosted.example',
      fetch: fetchMock,
    });

    await expect(client.listTeams()).resolves.toEqual({ teams: [] });
    await expect(client.getTeamSnapshot('team/1')).resolves.toMatchObject({ revision: 'rev-1' });
    await expect(
      client.launchTeam('team/1', {
        workspaceRef: {
          id: 'workspace_123',
          displayName: 'agent-teams-ai',
        },
        provider: { providerId: 'codex', modelId: 'gpt-5.2' },
      })
    ).resolves.toEqual({ runId: 'run-1', launchStatus: 'started' });
    await expect(client.getProvisioningStatus('run-1')).resolves.toMatchObject({
      runId: 'run-1',
      teamId: 'team/1',
      state: 'ready',
    });
    await expect(client.getRuntimeState('team/1')).resolves.toEqual({
      isAlive: true,
      terminalAvailable: true,
      activeProcessCount: 1,
    });
    await expect(client.listAliveTeams()).resolves.toEqual({ teamIds: ['team/1'] });
    await expect(client.stopTeam('team/1')).resolves.toEqual({
      isAlive: false,
      terminalAvailable: false,
      activeProcessCount: 0,
    });
    await expect(client.createTask('team/1', { subject: 'Ship it' })).resolves.toMatchObject({
      task: { taskId: 'task-1' },
    });
    await expect(client.createTerminalSession('team/1', {})).resolves.toMatchObject({
      terminalSessionId: 'session-1',
      webSocketUrl: 'wss://hosted.example/api/hosted/v1/terminal/session-1',
    });

    expect(calls.map((call) => call.url)).toEqual([
      'https://hosted.example/api/hosted/v1/teams',
      'https://hosted.example/api/hosted/v1/teams/team%2F1',
      'https://hosted.example/api/hosted/v1/teams/team%2F1/launch',
      'https://hosted.example/api/hosted/v1/teams/provisioning/run-1',
      'https://hosted.example/api/hosted/v1/teams/team%2F1/runtime',
      'https://hosted.example/api/hosted/v1/teams/runtime/alive',
      'https://hosted.example/api/hosted/v1/teams/team%2F1/stop',
      'https://hosted.example/api/hosted/v1/teams/team%2F1/tasks',
      'https://hosted.example/api/hosted/v1/teams/team%2F1/terminal/sessions',
    ]);
    expect(calls[2].init?.body).toBe(
      JSON.stringify({
        workspaceRef: { id: 'workspace_123', displayName: 'agent-teams-ai' },
        provider: { providerId: 'codex', modelId: 'gpt-5.2' },
      })
    );
    expect(calls[2].init?.body).not.toContain('providerBackendId');
    expect(calls[6].init?.method).toBe('POST');
  });

  it('uses SSE resume cursors and routes parse errors separately from stream errors', () => {
    MockEventSource.instances = [];
    MockWebSocket.instances = [];
    const onEvent = vi.fn();
    const onCursor = vi.fn();
    const onParseError = vi.fn();
    const onStreamError = vi.fn();
    const client = createHostedWebTransportClient({
      fetch: vi.fn() as HostedWebFetch,
      EventSource: MockEventSource as unknown as HostedWebEventSourceConstructor,
      WebSocket: MockWebSocket as unknown as HostedWebSocketConstructor,
    });

    const subscription = client.subscribeToTeamEvents(
      { teamId: 'team 1', resumeAfterEventId: 'event-0' },
      { onEvent, onCursor, onParseError, onStreamError }
    );
    expect(MockEventSource.instances).toHaveLength(1);
    expect(MockEventSource.instances[0]?.url).toBe(
      '/api/hosted/v1/events?teamId=team+1&cursor=event-0'
    );

    MockEventSource.instances[0]?.emit(
      'hosted.runtime.state',
      JSON.stringify({
        type: 'hosted.runtime.state',
        eventId: 'event-1',
        teamId: 'team 1',
        emittedAt: '2026-07-10T00:00:00.000Z',
        payload: {
          isAlive: true,
          terminalAvailable: true,
          activeTerminalSessionIds: [],
        },
      }),
      'event-1'
    );
    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'hosted.runtime.state' })
    );
    expect(onCursor).toHaveBeenCalledWith('event-1');
    expect(subscription.getLastEventId()).toBe('event-1');

    MockEventSource.instances[0]?.emit(
      'hosted.runtime.state',
      JSON.stringify({
        type: 'hosted.runtime.state',
        eventId: 'event-2',
        teamId: 'team 1',
        emittedAt: '2026-07-10T00:00:00.000Z',
        payload: { isAlive: 'invalid' },
      }),
      'event-2'
    );
    expect(onParseError).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'sse_parse',
        code: '/api/hosted/v1/errors/sse_parse_failed',
      })
    );

    MockEventSource.instances[0]?.emit('error', '');
    expect(onStreamError).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'sse_stream',
        code: '/api/hosted/v1/errors/sse_stream_failed',
      })
    );
  });

  it('uses WebSocket only for terminal streams and never terminal bytes over SSE', () => {
    MockEventSource.instances = [];
    MockWebSocket.instances = [];
    const client = createHostedWebTransportClient({
      baseUrl: 'https://hosted.example',
      fetch: vi.fn() as HostedWebFetch,
      EventSource: MockEventSource as unknown as HostedWebEventSourceConstructor,
      WebSocket: MockWebSocket as unknown as HostedWebSocketConstructor,
    });

    client.subscribeToTeamEvents({ teamId: 'team 1' }, { onEvent: vi.fn() });
    expect(MockWebSocket.instances).toHaveLength(0);
    expect(MockEventSource.instances[0]?.listeners.has('hosted.terminal.bytes')).toBe(false);

    client.openTerminalStream({
      terminalSessionId: 'session-1',
      protocols: 'agent-teams-terminal.v1',
    });
    expect(MockWebSocket.instances).toHaveLength(1);
    expect(MockWebSocket.instances[0]).toMatchObject({
      url: 'wss://hosted.example/api/hosted/v1/terminal/session-1',
      protocols: 'agent-teams-terminal.v1',
    });
  });

  it('normalizes hosted HTTP error codes under /api/hosted/v1', async () => {
    const client = createHostedWebTransportClient({
      fetch: vi.fn(async () =>
        jsonResponse({ error: { code: 'not_found', message: 'No' } }, false, 404)
      ),
    });

    await expect(client.listTeams()).rejects.toMatchObject({
      name: 'HostedWebTransportError',
      kind: 'http',
      status: 404,
      code: '/api/hosted/v1/errors/not_found',
    });
    await expect(client.listTeams()).rejects.toBeInstanceOf(HostedWebTransportError);
  });

  it('rejects successful HTTP JSON that does not match the expected response shape', async () => {
    const client = createHostedWebTransportClient({
      fetch: vi.fn(async () => jsonResponse({ teams: [{ teamId: 'team-1' }] })),
    });

    await expect(client.listTeams()).rejects.toMatchObject({
      name: 'HostedWebTransportError',
      kind: 'response_validation',
      status: 200,
      route: '/api/hosted/v1/teams',
      code: '/api/hosted/v1/errors/invalid_response',
      message: 'Hosted web response did not match the expected schema',
    });
  });

  it('rejects successful HTTP responses whose JSON cannot be parsed', async () => {
    const text = vi.fn(async () => 'sensitive backend fallback must not be read');
    const client = createHostedWebTransportClient({
      fetch: vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError('Unexpected token with /Users/name/project and sk-secret');
        },
        text,
      })),
    });

    let error: unknown;
    try {
      await client.listTeams();
    } catch (caught) {
      error = caught;
    }

    expect(error).toMatchObject({
      name: 'HostedWebTransportError',
      kind: 'response_validation',
      status: 200,
      route: '/api/hosted/v1/teams',
      code: '/api/hosted/v1/errors/invalid_json_response',
      message: 'Hosted web response was not valid JSON',
    });
    expect(error instanceof Error ? error.message : String(error)).not.toContain('sk-secret');
    expect(text).not.toHaveBeenCalled();
  });

  it('passes AbortSignal to fetch and propagates fetch abort rejections unchanged', async () => {
    const abortController = new AbortController();
    const abortError = Object.assign(new Error('This operation was aborted'), {
      name: 'AbortError',
    });
    const fetchMock: HostedWebFetch = vi.fn(async (_url, init) => {
      expect(init?.signal).toBe(abortController.signal);
      throw abortError;
    });
    const client = createHostedWebTransportClient({
      fetch: fetchMock,
      signal: abortController.signal,
    });

    abortController.abort();

    await expect(client.listTeams()).rejects.toBe(abortError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('reads error bodies once and does not expose backend text in renderer errors', async () => {
    const text = vi.fn(async () =>
      JSON.stringify({
        error: {
          code: '../../../Users/name/project/provider_payload',
          message: 'Provider failed at /Users/name/project with token sk-secret',
        },
      })
    );
    const json = vi.fn(async () => {
      throw new Error('json() must not be used for error bodies');
    });
    const client = createHostedWebTransportClient({
      fetch: vi.fn(async () => ({
        ok: false,
        status: 500,
        json,
        text,
      })),
    });

    let error: unknown;
    try {
      await client.listTeams();
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
    expect(error).toBeInstanceOf(HostedWebTransportError);
    expect(error instanceof Error ? error.message : String(error)).not.toContain(
      '/Users/name/project'
    );
    expect(text).toHaveBeenCalledTimes(1);
    expect(json).not.toHaveBeenCalled();
  });

  it('does not expose sensitive non-JSON error bodies in renderer errors', async () => {
    const text = vi.fn(async () =>
      'provider failed at /Users/name/project with Authorization: Bearer sk-secret'
    );
    const json = vi.fn(async () => {
      throw new Error('json() must not be used for error bodies');
    });
    const client = createHostedWebTransportClient({
      fetch: vi.fn(async () => ({
        ok: false,
        status: 502,
        json,
        text,
      })),
    });

    let error: unknown;
    try {
      await client.listTeams();
    } catch (caught) {
      error = caught;
    }

    expect(error).toMatchObject({
      name: 'HostedWebTransportError',
      kind: 'http',
      status: 502,
      route: '/api/hosted/v1/teams',
      code: '/api/hosted/v1/errors/http_502',
      message: 'Hosted web request failed with status 502',
    });
    expect(error instanceof Error ? error.message : String(error)).not.toContain(
      '/Users/name/project'
    );
    expect(error instanceof Error ? error.message : String(error)).not.toContain('sk-secret');
    expect(text).toHaveBeenCalledTimes(1);
    expect(json).not.toHaveBeenCalled();
  });

  it('resolves relative terminal WebSocket URLs against same-origin location when baseUrl is absent', () => {
    MockWebSocket.instances = [];
    withLocationOrigin('https://hosted.example', () => {
      const client = createHostedWebTransportClient({
        fetch: vi.fn() as HostedWebFetch,
        WebSocket: MockWebSocket as unknown as HostedWebSocketConstructor,
      });

      client.openTerminalStream({
        webSocketUrl: '/api/hosted/v1/terminal/session-1',
        protocols: 'agent-teams-terminal.v1',
      });
    });

    expect(MockWebSocket.instances).toHaveLength(1);
    expect(MockWebSocket.instances[0]).toMatchObject({
      url: 'wss://hosted.example/api/hosted/v1/terminal/session-1',
      protocols: 'agent-teams-terminal.v1',
    });
  });

  it('rejects absolute base URLs with credentials or hosted API path confusion', () => {
    const fetchMock = vi.fn() as HostedWebFetch;

    for (const baseUrl of [
      'https://hosted.example@evil.example',
      'https://user:secret@hosted.example',
      'https://hosted.example/api/hosted/v1',
      'https://hosted.example/%2F%2Fevil.example',
    ]) {
      expect(() =>
        createHostedWebTransportClient({
          baseUrl,
          fetch: fetchMock,
        })
      ).toThrow(/base URL is not allowed/);
    }

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects unsafe terminal WebSocket targets from session responses and stream calls', async () => {
    MockWebSocket.instances = [];
    const client = createHostedWebTransportClient({
      baseUrl: 'https://hosted.example',
      fetch: vi.fn(async () =>
        jsonResponse({
          terminalSessionId: 'session-1',
          webSocketUrl: 'wss://evil.example/api/hosted/v1/terminal/session-1',
          expiresAt: '2026-07-10T00:00:00.000Z',
        })
      ),
      WebSocket: MockWebSocket as unknown as HostedWebSocketConstructor,
    });

    await expect(client.createTerminalSession('team-1', {})).rejects.toMatchObject({
      name: 'HostedWebTransportError',
      kind: 'response_validation',
      code: '/api/hosted/v1/errors/invalid_response',
      message: 'Hosted web response did not match the expected schema',
    });

    expect(() =>
      client.openTerminalStream({
        webSocketUrl: 'https://hosted.example/api/hosted/v1/terminal/session-1',
      })
    ).toThrow(/terminal stream target is not allowed/);
    expect(() =>
      client.openTerminalStream({
        webSocketUrl: 'wss://hosted.example/api/hosted/v1/teams/team-1/terminal/sessions',
      })
    ).toThrow(/terminal stream target is not allowed/);
    expect(() =>
      client.openTerminalStream({
        webSocketUrl: 'api/hosted/v1/terminal/session-1',
      })
    ).toThrow(/terminal stream target is not allowed/);
    expect(() =>
      client.openTerminalStream({
        webSocketUrl: '//evil.example/api/hosted/v1/terminal/session-1',
      })
    ).toThrow(/terminal stream target is not allowed/);
    expect(() =>
      client.openTerminalStream({
        webSocketUrl: 'wss://hosted.example/api/hosted/v1/terminal/session-1?token=secret',
      })
    ).toThrow(/terminal stream target is not allowed/);
    expect(() =>
      client.openTerminalStream({
        webSocketUrl: 'wss://hosted.example/api/hosted/v1/terminal/session-1#token',
      })
    ).toThrow(/terminal stream target is not allowed/);
    expect(MockWebSocket.instances).toHaveLength(0);
  });
});

function jsonResponse(payload: unknown, ok = true, status = 200): ReturnType<HostedWebFetch> {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(payload),
    text: () => Promise.resolve(JSON.stringify(payload)),
  });
}

function withLocationOrigin(origin: string, run: () => void): void {
  const previousLocation = Object.getOwnPropertyDescriptor(globalThis, 'location');
  Object.defineProperty(globalThis, 'location', {
    configurable: true,
    value: { origin },
  });
  try {
    run();
  } finally {
    if (previousLocation) {
      Object.defineProperty(globalThis, 'location', previousLocation);
    } else {
      Reflect.deleteProperty(globalThis, 'location');
    }
  }
}

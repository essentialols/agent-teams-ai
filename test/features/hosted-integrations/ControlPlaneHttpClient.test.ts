import { HostedIntegrationDomainError } from '@features/hosted-integrations/core/domain';
import { ControlPlaneHttpClient } from '@features/hosted-integrations/main/infrastructure/ControlPlaneHttpClient';

describe('ControlPlaneHttpClient', () => {
  it('sends desktop bearer token only to normalized control-plane routes', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            desktopClientId: 'desktop_1',
            workspaceId: 'workspace_1',
          }),
          { headers: { 'content-type': 'application/json' }, status: 200 }
        )
    ) as typeof fetch;
    const client = new ControlPlaneHttpClient({
      allowLocalhostHttp: true,
      fetchImpl,
      getBaseUrl: async () => 'http://127.0.0.1:4100',
    });

    const session = await client.getMe('agtcp_secret');

    expect(session).toMatchObject({
      desktopClientId: 'desktop_1',
      state: 'paired',
      workspaceId: 'workspace_1',
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      'http://127.0.0.1:4100/api/desktop/v1/me',
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: 'Bearer agtcp_secret',
        }),
        redirect: 'manual',
      })
    );
  });

  it('rejects redirects before following token-bearing requests', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response('', {
          headers: { location: 'https://evil.example.com/callback' },
          status: 302,
        })
    ) as typeof fetch;
    const client = new ControlPlaneHttpClient({
      fetchImpl,
      getBaseUrl: async () => 'https://cp.example.com',
    });

    await expect(client.getMe('agtcp_secret')).rejects.toThrow(HostedIntegrationDomainError);
  });

  it('normalizes GitHub action status responses without raw credential fields', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            actionRequestId: 'action_1',
            githubUrl: 'https://github.com/org/repo/issues/1#issuecomment-1',
            status: 'succeeded',
            token: 'should-not-be-read',
          }),
          { status: 200 }
        )
    ) as typeof fetch;
    const client = new ControlPlaneHttpClient({
      fetchImpl,
      getBaseUrl: async () => 'https://cp.example.com',
    });

    const status = await client.getAgentGithubActionStatus('agtcp_secret', 'action_1');

    expect(status).toEqual({
      actionRequestId: 'action_1',
      fetchedAt: expect.any(String),
      githubUrl: 'https://github.com/org/repo/issues/1#issuecomment-1',
      status: 'succeeded',
    });
  });
});

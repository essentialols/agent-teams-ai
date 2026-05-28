import {
  HOSTED_INTEGRATIONS_GET_STATE,
  HOSTED_INTEGRATIONS_OPEN_SETUP_URL,
  HOSTED_INTEGRATIONS_START_GITHUB_SETUP,
} from '@features/hosted-integrations/contracts';
import { createHostedIntegrationsBridge } from '@features/hosted-integrations/preload';

describe('createHostedIntegrationsBridge', () => {
  it('forwards setup commands through named IPC channels', async () => {
    const invoke = vi.fn(async (channel: string) => ({ channel }));
    const bridge = createHostedIntegrationsBridge({ invoke } as never);

    await bridge.getState();
    await bridge.startGitHubSetup();
    await bridge.openSetupUrl({
      setupSessionId: 'setup_1',
      setupUrl: 'https://github.com/apps/agent-teams',
    });

    expect(invoke).toHaveBeenNthCalledWith(1, HOSTED_INTEGRATIONS_GET_STATE);
    expect(invoke).toHaveBeenNthCalledWith(2, HOSTED_INTEGRATIONS_START_GITHUB_SETUP);
    expect(invoke).toHaveBeenNthCalledWith(3, HOSTED_INTEGRATIONS_OPEN_SETUP_URL, {
      setupSessionId: 'setup_1',
      setupUrl: 'https://github.com/apps/agent-teams',
    });
  });
});

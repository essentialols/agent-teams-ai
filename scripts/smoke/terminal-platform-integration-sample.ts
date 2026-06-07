#!/usr/bin/env tsx

import { createTerminalPlatformIntegrationSampleFeature } from '@features/terminal-platform-integration-sample/main';

interface SmokeReport {
  phase: string;
  sdkLoaded: boolean;
  sidecarPid: number | null;
  addressKind: string;
  addressLabel: string;
  createSessionChecked: boolean;
  sessionId: string | null;
  focusedPaneId: string | null;
}

const logger = {
  info: (message: string) => console.log(`[terminal-platform-smoke] ${message}`),
  warn: (message: string) => console.warn(`[terminal-platform-smoke] ${message}`),
  error: (message: string) => console.error(`[terminal-platform-smoke] ${message}`),
};

async function runSmoke(): Promise<SmokeReport> {
  const feature = createTerminalPlatformIntegrationSampleFeature({ logger });
  const initial = feature.getStatus();
  if (!initial.config.enabled) {
    throw new Error(
      'Terminal Platform sample is disabled. Set AGENT_TEAMS_TERMINAL_PLATFORM_ENABLED=1.'
    );
  }

  try {
    const started = await feature.start();
    if (started.phase !== 'ready') {
      throw new Error(
        `Terminal Platform sample did not become ready: ${started.phase}: ${
          started.lastError ?? 'no error detail'
        }`
      );
    }

    let sessionId: string | null = null;
    let focusedPaneId: string | null = null;
    const createSessionChecked = process.env.TERMINAL_PLATFORM_SMOKE_CREATE_SESSION === '1';

    if (createSessionChecked) {
      const session = await feature.createNativeSession({
        title: 'Agent Teams Terminal Platform smoke',
        cwd: process.cwd(),
      });
      sessionId = session.sessionId;
      focusedPaneId = session.focusedPaneId;

      if (focusedPaneId) {
        await feature.sendInput({
          sessionId,
          paneId: focusedPaneId,
          data: 'printf "agent-teams-terminal-platform-smoke-ok\\n"\\n',
        });
      }
    }

    const status = feature.getStatus();
    return {
      phase: status.phase,
      sdkLoaded: status.sdkLoaded,
      sidecarPid: status.sidecar.pid,
      addressKind: status.config.addressKind,
      addressLabel: status.config.addressLabel,
      createSessionChecked,
      sessionId,
      focusedPaneId,
    };
  } finally {
    await feature.dispose();
  }
}

runSmoke()
  .then((report) => {
    console.log(JSON.stringify(report, null, 2));
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

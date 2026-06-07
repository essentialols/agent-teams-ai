import { useCallback, useEffect, useMemo, useState } from 'react';

import type {
  TerminalPlatformIntegrationSampleApi,
  TerminalPlatformIntegrationStatus,
  TerminalPlatformScreenSnapshot,
  TerminalPlatformSessionSummary,
} from '@features/terminal-platform-integration-sample/contracts';
import type { ElectronAPI } from '@shared/types';

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

export interface TerminalPlatformIntegrationSampleModel {
  loadState: LoadState;
  status: TerminalPlatformIntegrationStatus | null;
  session: TerminalPlatformSessionSummary | null;
  snapshot: TerminalPlatformScreenSnapshot | null;
  error: string | null;
  refreshStatus(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  createSession(): Promise<void>;
  sendProbeInput(paneId: string): Promise<void>;
  refreshSnapshot(sessionId: string, paneId: string): Promise<void>;
}

export function useTerminalPlatformIntegrationSample(
  api: TerminalPlatformIntegrationSampleApi | null = resolveApi()
): TerminalPlatformIntegrationSampleModel {
  const [status, setStatus] = useState<TerminalPlatformIntegrationStatus | null>(null);
  const [session, setSession] = useState<TerminalPlatformSessionSummary | null>(null);
  const [snapshot, setSnapshot] = useState<TerminalPlatformScreenSnapshot | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async <T>(work: () => Promise<T>): Promise<T | null> => {
      if (!api) {
        setError('Terminal Platform sample API is not exposed by preload.');
        setLoadState('error');
        return null;
      }
      setLoadState('loading');
      setError(null);
      try {
        const result = await work();
        setLoadState('ready');
        return result;
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : String(nextError));
        setLoadState('error');
        return null;
      }
    },
    [api]
  );

  const refreshStatus = useCallback(async () => {
    const next = await run(() => api!.getStatus());
    if (next) setStatus(next);
  }, [api, run]);

  const start = useCallback(async () => {
    const next = await run(() => api!.start());
    if (next) setStatus(next);
  }, [api, run]);

  const stop = useCallback(async () => {
    const next = await run(() => api!.stop());
    if (next) {
      setStatus(next);
      setSession(null);
      setSnapshot(null);
    }
  }, [api, run]);

  const createSession = useCallback(async () => {
    const next = await run(() =>
      api!.createNativeSession({
        title: 'Agent Teams Terminal Platform sample',
        cwd: null,
      })
    );
    if (next) setSession(next);
  }, [api, run]);

  const sendProbeInput = useCallback(
    async (paneId: string) => {
      if (!session) {
        setError('Create a Terminal Platform session before sending input.');
        setLoadState('error');
        return;
      }
      await run(() =>
        api!.sendInput({
          sessionId: session.sessionId,
          paneId,
          data: 'printf "agent-teams-terminal-platform-ok\\n"\\n',
        })
      );
    },
    [api, run, session]
  );

  const refreshSnapshot = useCallback(
    async (sessionId: string, paneId: string) => {
      const next = await run(() => api!.screenSnapshot({ sessionId, paneId }));
      if (next) setSnapshot(next);
    },
    [api, run]
  );

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  return useMemo(
    () => ({
      loadState,
      status,
      session,
      snapshot,
      error,
      refreshStatus,
      start,
      stop,
      createSession,
      sendProbeInput,
      refreshSnapshot,
    }),
    [
      createSession,
      error,
      loadState,
      refreshSnapshot,
      refreshStatus,
      sendProbeInput,
      session,
      snapshot,
      start,
      status,
      stop,
    ]
  );
}

function resolveApi(): TerminalPlatformIntegrationSampleApi | null {
  const api = (globalThis as typeof globalThis & { electronAPI?: ElectronAPI }).electronAPI;
  return api?.terminalPlatform ?? null;
}

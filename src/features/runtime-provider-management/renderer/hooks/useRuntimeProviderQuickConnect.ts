import { useCallback, useEffect, useRef, useState } from 'react';

import { api } from '@renderer/api';

import type { RuntimeProviderDirectoryEntryDto } from '../../contracts';

interface UseRuntimeProviderQuickConnectOptions {
  enabled: boolean;
  projectPath?: string | null;
  refreshKey?: number;
}

export interface RuntimeProviderQuickConnectDirectoryState {
  entries: readonly RuntimeProviderDirectoryEntryDto[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
  refresh: () => void;
}

const INITIAL_LOAD_DELAY_MS = 200;
const AUTHORITATIVE_LOAD_DELAY_MS = 3_000;

export function useRuntimeProviderQuickConnect({
  enabled,
  projectPath = null,
  refreshKey = 0,
}: UseRuntimeProviderQuickConnectOptions): RuntimeProviderQuickConnectDirectoryState {
  const requestSequence = useRef(0);
  const previousRefreshKey = useRef(refreshKey);
  const previousManualRefreshSequence = useRef(0);
  const hasStartedLoad = useRef(false);
  const [entries, setEntries] = useState<readonly RuntimeProviderDirectoryEntryDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualRefreshSequence, setManualRefreshSequence] = useState(0);

  const refresh = useCallback(() => {
    setManualRefreshSequence((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const requestId = requestSequence.current + 1;
    requestSequence.current = requestId;
    const refreshRequested =
      manualRefreshSequence !== previousManualRefreshSequence.current ||
      refreshKey !== previousRefreshKey.current;
    previousRefreshKey.current = refreshKey;
    previousManualRefreshSequence.current = manualRefreshSequence;
    let cancelled = false;
    let authoritativeTimeout: number | null = null;

    const loadDirectory = async (input: {
      summary: boolean;
      refresh: boolean;
      silent: boolean;
    }): Promise<boolean> => {
      if (!input.silent) {
        setLoading(true);
        setError(null);
      }

      try {
        const response = await api.runtimeProviderManagement.loadProviderDirectory({
          runtimeId: 'opencode',
          summary: input.summary,
          projectPath,
          query: null,
          filter: 'all',
          // The live pass needs the complete provider set so every curated
          // dashboard card is reconciled against the managed OpenCode host.
          limit: input.summary ? 100 : 250,
          cursor: null,
          refresh: input.refresh,
        });
        if (cancelled || requestSequence.current !== requestId) {
          return false;
        }
        if (response.error) {
          if (!input.silent) {
            setError(response.error.message);
          }
          return false;
        }
        if (!response.directory) {
          if (!input.silent) {
            setError('Provider directory response was empty');
          }
          return false;
        }
        setEntries(response.directory.entries);
        setLoaded(true);
        return true;
      } catch (loadError) {
        if (cancelled || requestSequence.current !== requestId) {
          return false;
        }
        if (!input.silent) {
          setError(
            loadError instanceof Error ? loadError.message : 'Failed to load provider status'
          );
        }
        return false;
      } finally {
        if (!input.silent && !cancelled && requestSequence.current === requestId) {
          setLoading(false);
        }
      }
    };

    const loadDelay = hasStartedLoad.current ? 0 : INITIAL_LOAD_DELAY_MS;
    const timeout = window.setTimeout(() => {
      hasStartedLoad.current = true;
      if (refreshRequested) {
        void loadDirectory({ summary: false, refresh: true, silent: false });
        return;
      }

      void loadDirectory({ summary: true, refresh: false, silent: false }).then((loadedSummary) => {
        if (!loadedSummary || cancelled || requestSequence.current !== requestId) {
          return;
        }
        authoritativeTimeout = window.setTimeout(() => {
          void loadDirectory({ summary: false, refresh: false, silent: true });
        }, AUTHORITATIVE_LOAD_DELAY_MS);
      });
    }, loadDelay);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      if (authoritativeTimeout !== null) {
        window.clearTimeout(authoritativeTimeout);
      }
    };
  }, [enabled, manualRefreshSequence, projectPath, refreshKey]);

  return { entries, loading, loaded, error, refresh };
}

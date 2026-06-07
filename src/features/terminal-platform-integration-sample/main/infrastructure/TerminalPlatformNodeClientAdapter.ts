import type { TerminalPlatformClientPort } from '../../core/application/ports';
import type {
  TerminalPlatformCreateNativeSessionRequest,
  TerminalPlatformIntegrationConfig,
  TerminalPlatformScreenSnapshot,
  TerminalPlatformScreenSnapshotRequest,
  TerminalPlatformSendInputRequest,
  TerminalPlatformSessionSummary,
} from '@features/terminal-platform-integration-sample/contracts';

type UnknownRecord = Record<string, unknown>;
type DynamicImport = (specifier: string) => Promise<unknown>;

const dynamicImport = new Function('specifier', 'return import(specifier)') as DynamicImport;

export async function createTerminalPlatformNodeClient(
  config: TerminalPlatformIntegrationConfig,
  importModule: DynamicImport = dynamicImport
): Promise<TerminalPlatformClientPort> {
  const sdk = asRecord(await importModule(config.nodePackageName));
  const terminalNodeClient = asRecord(sdk.TerminalNodeClient);
  const clientFactory = resolveClientFactory(terminalNodeClient, config.address.kind);
  const client = asRecord(clientFactory(config.address.value));
  return new TerminalPlatformNodeClientAdapter(client);
}

class TerminalPlatformNodeClientAdapter implements TerminalPlatformClientPort {
  constructor(private readonly client: UnknownRecord) {}

  handshakeInfo(): Promise<unknown> {
    return callClientMethod<unknown>(this.client, 'handshakeInfo');
  }

  async createNativeSession(
    request: TerminalPlatformCreateNativeSessionRequest = {}
  ): Promise<TerminalPlatformSessionSummary> {
    const raw = await callClientMethod<unknown>(
      this.client,
      'createNativeSession',
      toNodeCreateSessionRequest(request)
    );
    const summary = normalizeSessionSummary(raw);
    const attached = await callClientMethod<unknown>(
      this.client,
      'attachSession',
      summary.sessionId
    );
    return {
      ...summary,
      focusedPaneId: readFocusedPaneId(asRecord(attached)) ?? summary.focusedPaneId,
    };
  }

  async sendInput(request: TerminalPlatformSendInputRequest): Promise<void> {
    await callClientMethod<unknown>(this.client, 'dispatchMuxCommand', request.sessionId, {
      kind: 'send_input',
      pane_id: request.paneId,
      data: request.data,
    });
  }

  async screenSnapshot(
    request: TerminalPlatformScreenSnapshotRequest
  ): Promise<TerminalPlatformScreenSnapshot> {
    const raw = await callClientMethod<unknown>(
      this.client,
      'screenSnapshot',
      request.sessionId,
      request.paneId
    );
    return normalizeScreenSnapshot(raw);
  }

  async dispose(): Promise<void> {
    const dispose = this.client.dispose;
    if (typeof dispose === 'function') {
      await dispose.call(this.client);
    }
  }
}

function resolveClientFactory(
  terminalNodeClient: UnknownRecord,
  addressKind: TerminalPlatformIntegrationConfig['address']['kind']
): (value: string) => unknown {
  const methodName =
    addressKind === 'runtime_slug'
      ? 'fromRuntimeSlug'
      : addressKind === 'filesystem_path'
        ? 'fromFilesystemPath'
        : 'fromNamespacedAddress';
  const factory = terminalNodeClient[methodName];
  if (typeof factory !== 'function') {
    throw new Error(`terminal-platform-node is missing TerminalNodeClient.${methodName}`);
  }
  return factory.bind(terminalNodeClient) as (value: string) => unknown;
}

function toNodeCreateSessionRequest(
  request: TerminalPlatformCreateNativeSessionRequest
): UnknownRecord {
  return {
    title: request.title ?? 'Agent Teams Terminal Platform',
    launch: request.shell
      ? {
          program: request.shell,
          args: request.args ?? [],
          cwd: request.cwd ?? null,
        }
      : null,
  };
}

async function callClientMethod<T>(
  client: UnknownRecord,
  methodName: string,
  ...args: unknown[]
): Promise<T> {
  const method = client[methodName];
  if (typeof method !== 'function') {
    throw new Error(`Terminal Platform client is missing ${methodName}()`);
  }
  return (await method.call(client, ...args)) as T;
}

function normalizeSessionSummary(raw: unknown): TerminalPlatformSessionSummary {
  const value = asRecord(raw);
  const sessionId = readString(value.session_id) ?? readString(value.sessionId);
  if (!sessionId) {
    throw new Error('Terminal Platform createNativeSession returned no session id');
  }
  return {
    sessionId,
    title: readString(value.title),
    focusedPaneId: readFocusedPaneId(value),
  };
}

function normalizeScreenSnapshot(raw: unknown): TerminalPlatformScreenSnapshot {
  const value = asRecord(raw);
  const surface = asRecord(value.surface);
  const lines = Array.isArray(surface.lines)
    ? surface.lines.map((line) => readString(asRecord(line).text) ?? '').filter(Boolean)
    : [];
  const paneId = readString(value.pane_id) ?? readString(value.paneId);

  if (!paneId) {
    throw new Error('Terminal Platform screenSnapshot returned no pane id');
  }

  return {
    paneId,
    sequence: readNumber(value.sequence) ?? 0,
    rows: readNumber(value.rows) ?? 0,
    cols: readNumber(value.cols) ?? 0,
    source: readString(value.source),
    lines,
  };
}

function readFocusedPaneId(value: UnknownRecord): string | null {
  const direct = readString(value.focused_pane_id) ?? readString(value.focusedPaneId);
  if (direct) return direct;

  const focusedScreen = asRecord(value.focused_screen ?? value.focusedScreen);
  const focusedScreenPane = readString(focusedScreen.pane_id) ?? readString(focusedScreen.paneId);
  if (focusedScreenPane) return focusedScreenPane;

  const topology = asRecord(value.topology ?? value);
  const focusedTabId = readString(topology.focused_tab) ?? readString(topology.focusedTab);
  const tabs = Array.isArray(topology.tabs) ? topology.tabs.map(asRecord) : [];
  const focusedTab =
    (focusedTabId
      ? tabs.find(
          (tab) => readString(tab.tab_id) === focusedTabId || readString(tab.tabId) === focusedTabId
        )
      : null) ??
    tabs.find((tab) => readBoolean(tab.focused) === true) ??
    tabs[0] ??
    null;

  if (!focusedTab) return null;
  return (
    readString(focusedTab.focused_pane) ??
    readString(focusedTab.focusedPane) ??
    readFirstPaneIdFromNode(focusedTab.root)
  );
}

function asRecord(value: unknown): UnknownRecord {
  if (!value || (typeof value !== 'object' && typeof value !== 'function')) {
    return {};
  }
  return value as UnknownRecord;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function readFirstPaneIdFromNode(value: unknown): string | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const node = value as UnknownRecord;
  const paneId = readString(node.pane_id) ?? readString(node.paneId);
  if (paneId) return paneId;

  const firstPaneId = readFirstPaneIdFromNode(node.first);
  if (firstPaneId) return firstPaneId;

  return readFirstPaneIdFromNode(node.second);
}

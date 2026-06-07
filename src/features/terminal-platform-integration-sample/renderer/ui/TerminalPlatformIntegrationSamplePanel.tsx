import type { TerminalPlatformIntegrationSampleModel } from '../hooks/useTerminalPlatformIntegrationSample';
import type { ReactElement } from 'react';

export interface TerminalPlatformIntegrationSamplePanelProps {
  model: TerminalPlatformIntegrationSampleModel;
}

export const TerminalPlatformIntegrationSamplePanel = (
  props: TerminalPlatformIntegrationSamplePanelProps
): ReactElement => {
  const { model } = props;
  const status = model.status;
  const focusedPaneId = model.session?.focusedPaneId ?? model.snapshot?.paneId;

  return (
    <section className="rounded-lg border border-slate-700 bg-slate-950 p-4 text-slate-100">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">Terminal Platform integration sample</h2>
          <p className="mt-1 text-xs text-slate-400">
            Rust Terminal Platform sidecar and SDK status.
          </p>
        </div>
        <span className="rounded border border-slate-600 px-2 py-1 text-xs">
          {status?.phase ?? model.loadState}
        </span>
      </div>

      {model.error ? <p className="mt-3 text-xs text-red-300">{model.error}</p> : null}
      {status?.lastError ? <p className="mt-3 text-xs text-amber-300">{status.lastError}</p> : null}

      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <StatusItem label="Enabled" value={status?.config.enabled ? 'yes' : 'no'} />
        <StatusItem label="Runtime" value={status?.config.addressLabel ?? 'unknown'} />
        <StatusItem label="SDK loaded" value={status?.sdkLoaded ? 'yes' : 'no'} />
        <StatusItem label="Sidecar pid" value={String(status?.sidecar.pid ?? 'not running')} />
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <button className="rounded bg-emerald-600 px-3 py-1.5 text-xs" onClick={model.start}>
          Start
        </button>
        <button className="rounded bg-slate-700 px-3 py-1.5 text-xs" onClick={model.stop}>
          Stop
        </button>
        <button className="rounded bg-sky-600 px-3 py-1.5 text-xs" onClick={model.createSession}>
          Create native session
        </button>
        {model.session && focusedPaneId ? (
          <button
            className="rounded bg-violet-600 px-3 py-1.5 text-xs"
            onClick={() => model.sendProbeInput(focusedPaneId)}
          >
            Send probe input
          </button>
        ) : null}
      </div>

      {model.session ? (
        <div className="mt-4 rounded border border-slate-800 bg-slate-900 p-3 text-xs">
          <div className="font-mono text-slate-300">session {model.session.sessionId}</div>
          <button
            className="mt-2 rounded bg-slate-700 px-2 py-1"
            onClick={() => {
              if (focusedPaneId)
                void model.refreshSnapshot(model.session!.sessionId, focusedPaneId);
            }}
          >
            Refresh focused snapshot
          </button>
        </div>
      ) : null}

      {model.snapshot ? (
        <pre className="mt-4 max-h-64 overflow-auto rounded bg-black p-3 text-xs text-emerald-200">
          {model.snapshot.lines.join('\n')}
        </pre>
      ) : null}
    </section>
  );
};

const StatusItem = (props: { label: string; value: string }): ReactElement => {
  return (
    <div>
      <dt className="text-slate-500">{props.label}</dt>
      <dd className="mt-1 font-mono text-slate-200">{props.value}</dd>
    </div>
  );
};

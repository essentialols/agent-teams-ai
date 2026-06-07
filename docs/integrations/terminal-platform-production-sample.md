# Terminal Platform production integration sample

This is an opt-in production integration path for testing Terminal Platform inside Agent Teams AI without replacing the existing `node-pty` terminal path.

## What is included

- main-process sidecar supervisor for `terminal-daemon`
- optional dynamic loading of `terminal-platform-node`
- safe preload bridge exposed as `electronAPI.terminalPlatform`
- renderer hook and sample panel
- focused tests for config redaction and daemon launch arguments

## Enable locally

1. Build Terminal Platform from `/Users/belief/dev/projects/claude/terminal-platform`.
2. Stage or install `terminal-platform-node` so Electron main can resolve it.
3. Start Agent Teams with:

```bash
AGENT_TEAMS_TERMINAL_PLATFORM_ENABLED=1 \
TERMINAL_PLATFORM_AUTO_START=1 \
TERMINAL_PLATFORM_RUNTIME_SLUG=agent-teams \
TERMINAL_PLATFORM_DAEMON_PATH=/Users/belief/dev/projects/claude/terminal-platform/target/debug/terminal-daemon \
TERMINAL_PLATFORM_SESSION_STORE=/tmp/agent-teams-terminal-platform.sqlite3 \
pnpm dev
```

Use `TERMINAL_PLATFORM_SOCKET_PATH=/tmp/agent-teams-terminal.sock` instead of `TERMINAL_PLATFORM_RUNTIME_SLUG` when you want an explicit filesystem socket.

## Headless smoke

After the daemon and Node package are built/resolvable:

```bash
AGENT_TEAMS_TERMINAL_PLATFORM_ENABLED=1 \
TERMINAL_PLATFORM_AUTO_START=1 \
TERMINAL_PLATFORM_RUNTIME_SLUG=agent-teams \
TERMINAL_PLATFORM_DAEMON_PATH=/Users/belief/dev/projects/claude/terminal-platform/target/debug/terminal-daemon \
TERMINAL_PLATFORM_SESSION_STORE=/tmp/agent-teams-terminal-platform.sqlite3 \
pnpm smoke:terminal-platform-sample
```

Add `TERMINAL_PLATFORM_SMOKE_CREATE_SESSION=1` to create a native session and send a probe command. This requires a `terminal-daemon` build with the native backend enabled.

## Wire the sample panel

The sample intentionally does not add navigation by default. To mount it in a product screen:

```tsx
import {
  TerminalPlatformIntegrationSamplePanel,
  useTerminalPlatformIntegrationSample,
} from '@features/terminal-platform-integration-sample/renderer';

export function TerminalPlatformExperiment(): JSX.Element {
  const model = useTerminalPlatformIntegrationSample();
  return <TerminalPlatformIntegrationSamplePanel model={model} />;
}
```

## Production policy

- Keep the existing `node-pty` terminal path until Terminal Platform passes app-specific parity tests.
- Keep Terminal Platform behind an explicit env or feature flag.
- Do not expose raw `ipcRenderer` or raw Terminal Platform native handles to renderer code.
- Persist session history through `terminal-daemon --session-store`.
- Treat `tmux` and `Zellij` as capability-gated foreign backends, not as NativeMux parity.
- Run `pnpm typecheck` and the focused tests before wiring into a visible app route.

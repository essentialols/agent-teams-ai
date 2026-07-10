import {
  RunEventProviderKind,
  projectScopedControllerToolNames,
  type ControlledAgentProviderEnforcementCapabilities,
} from "@vioxen/subscription-runtime/worker-core";

export type ClaudeControlledAgentProfileInput = {
  readonly stateDir: string;
  readonly mcpServerName?: string;
  readonly mcpCommand?: string;
  readonly mcpArgs?: readonly string[];
  readonly mcpCwd?: string;
};

export type ClaudeControlledAgentProfile = {
  readonly providerKind: RunEventProviderKind.Claude;
  readonly configDir: string;
  readonly mcpServerName: string;
  readonly mcpConfig: string;
  readonly strictMcpConfig: true;
  readonly allowedTools: readonly string[];
  readonly disallowedTools: readonly string[];
  readonly appendSystemPrompt: string;
  readonly enforcement: ControlledAgentProviderEnforcementCapabilities;
};

export function buildClaudeControlledAgentProfile(
  input: ClaudeControlledAgentProfileInput,
): ClaudeControlledAgentProfile {
  const mcpServerName = input.mcpServerName ?? "subscription_runtime_project_control";
  assertClaudeMcpServerName(mcpServerName);
  const allowedTools = projectScopedControllerToolNames().map((toolName) =>
    claudeMcpToolName(mcpServerName, toolName)
  );
  return {
    providerKind: RunEventProviderKind.Claude,
    configDir: `${input.stateDir}/claude-config`,
    mcpServerName,
    mcpConfig: JSON.stringify({
      mcpServers: {
        [mcpServerName]: {
          command: input.mcpCommand ?? "subscription-runtime-codex-goal-mcp",
          args: input.mcpArgs ?? [],
          ...(input.mcpCwd === undefined ? {} : { cwd: input.mcpCwd }),
        },
      },
    }),
    strictMcpConfig: true,
    allowedTools,
    disallowedTools: claudeControllerDisallowedTools(),
    appendSystemPrompt: claudeControllerRulesText(),
    enforcement: {
      providerKind: RunEventProviderKind.Claude,
      canRestrictToolSurface: true,
      canDisableRawShell: true,
      canEnforceFilesystemSandbox: true,
      canIsolateHome: true,
      canIsolateTemp: true,
      canRestrictNetwork: true,
    },
  };
}

function claudeControllerDisallowedTools(): readonly string[] {
  return [
    "Bash",
    "Edit",
    "MultiEdit",
    "Write",
    "Read",
    "WebFetch",
    "WebSearch",
    "Task",
    "Agent",
  ];
}

function claudeMcpToolName(serverName: string, toolName: string): string {
  return `mcp__${serverName}__${toolName}`;
}

function assertClaudeMcpServerName(value: string): void {
  if (/^[A-Za-z0-9_-]+$/.test(value) && !value.includes("__")) return;
  throw new Error("claude_controlled_agent_mcp_server_name_invalid");
}

function claudeControllerRulesText(): string {
  return [
    "You are a broker-only controlled agent running under subscription-runtime.",
    "Use only the configured MCP broker/status tools.",
    "Do not use Bash, Edit, Write, Read, WebFetch, WebSearch, Task, Agent or local filesystem tools.",
    "Do not request raw shell, raw git, raw tmux, registry writes or auth files.",
    "Execute project-control and project-integration broker tools only when requested by the host objective or delivered guidance.",
    "Do not invent project strategy, worker mix, review policy, benchmark priority or backlog order from this runtime prompt.",
    "Never print secrets, auth payloads, API keys, token contents or raw provider payloads.",
  ].join("\n");
}

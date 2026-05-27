import { createSafeError, type SafeError } from "@agent-teams-control-plane/shared";

import type { GitHubActionAttribution } from "./github-action.js";

export type AgentAttributionRendererSettings = Readonly<{
  defaultAgentAvatarUrl: string;
  allowedAvatarOrigins: readonly string[];
}>;

export type RenderGitHubActionBodyInput = Readonly<{
  actionRequestId: string;
  body: string;
  attribution: GitHubActionAttribution;
  settings: AgentAttributionRendererSettings;
}>;

export function renderGitHubActionBody(input: RenderGitHubActionBodyInput): string {
  const avatarUrl = selectSafeAvatarUrl({
    settings: input.settings,
    ...(input.attribution.agentAvatarUrl === undefined
      ? {}
      : { agentAvatarUrl: input.attribution.agentAvatarUrl }),
  });
  const lines = [
    input.body.trimEnd(),
    "",
    `<!-- agent-teams-action:${input.actionRequestId} -->`,
    "",
    "---",
    "Agent Teams",
    `Avatar: <img src="${escapeHtmlAttribute(avatarUrl)}" alt="Agent Teams avatar" width="32" height="32" />`,
    `Agent: ${escapeMarkdownText(input.attribution.agentDisplayName)}`,
  ];

  if (input.attribution.teamDisplayName !== undefined) {
    lines.push(`Team: ${escapeMarkdownText(input.attribution.teamDisplayName)}`);
  }
  lines.push(`Workspace action: ${input.actionRequestId}`);
  return `${lines.join("\n")}\n`;
}

export function validateAttributionRendererSettings(
  settings: AgentAttributionRendererSettings,
): SafeError | undefined {
  const defaultUrl = parseSafeAvatarUrl(settings.defaultAgentAvatarUrl, settings);
  if (defaultUrl === undefined) {
    return createSafeError({
      category: "validation",
      code: "CONTROL_PLANE_GITHUB_ACTION_DEFAULT_AVATAR_UNSAFE",
      message: "Default Agent Teams avatar URL is not safe.",
    });
  }
  return undefined;
}

export function selectSafeAvatarUrl(input: {
  agentAvatarUrl?: string;
  settings: AgentAttributionRendererSettings;
}): string {
  const agentUrl =
    input.agentAvatarUrl === undefined
      ? undefined
      : parseSafeAvatarUrl(input.agentAvatarUrl, input.settings);
  return agentUrl ?? input.settings.defaultAgentAvatarUrl;
}

function parseSafeAvatarUrl(
  value: string,
  settings: AgentAttributionRendererSettings,
): string | undefined {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") {
      return undefined;
    }
    if (!settings.allowedAvatarOrigins.includes(url.origin)) {
      return undefined;
    }
    if (url.username.length > 0 || url.password.length > 0) {
      return undefined;
    }
    return url.toString();
  } catch {
    return undefined;
  }
}

function escapeMarkdownText(value: string): string {
  return value.trim().replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function escapeHtmlAttribute(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
}

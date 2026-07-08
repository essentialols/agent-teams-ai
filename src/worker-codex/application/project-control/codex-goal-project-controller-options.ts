import {
  RunEventProviderKind,
  isRunEventProviderKind,
} from "@vioxen/subscription-runtime/worker-core";

export type ProjectControllerProviderKind =
  | RunEventProviderKind.Codex
  | RunEventProviderKind.Claude;

export type ProjectControllerOptions = {
  readonly cwd: string;
  readonly providerKind?: string;
  readonly stateDir?: string;
  readonly sessionArtifactPath?: string;
  readonly claudePath?: string;
  readonly mcpServerName?: string;
  readonly mcpCommand?: string;
  readonly mcpArgs?: readonly string[];
  readonly mcpCwd?: string;
  readonly rawShellMode?: "disabled-by-provider" | "sandboxed-deny-rules-only";
  readonly maxGoalTurns?: number;
  readonly reason?: string;
  readonly deliveryAttemptId?: string;
};

export function projectControllerProviderKind(
  options: Pick<ProjectControllerOptions, "providerKind">,
): ProjectControllerProviderKind {
  const providerKind = options.providerKind ?? RunEventProviderKind.Codex;
  if (
    isRunEventProviderKind(providerKind) &&
    (providerKind === RunEventProviderKind.Codex ||
      providerKind === RunEventProviderKind.Claude)
  ) {
    return providerKind;
  }
  throw new Error(
    "project_controller_provider_kind_unsupported:" + providerKind,
  );
}

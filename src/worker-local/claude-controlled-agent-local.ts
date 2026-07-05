import { createHash } from "node:crypto";
import { readFile, realpath } from "node:fs/promises";
import { isAbsolute, join, resolve, sep } from "node:path";
import type {
  RedactorPort,
  SessionArtifact,
} from "@vioxen/subscription-runtime/core";
import {
  claudeProviderId,
  claudeSessionFormatVersion,
} from "@vioxen/subscription-runtime/provider-claude";
import {
  buildClaudeControlledAgentProfile,
  ClaudeControlledAgentProvider,
  type ClaudeControlledAgentProfile,
} from "@vioxen/subscription-runtime/worker-claude";
import type { ControlledAgentProviderPort } from "@vioxen/subscription-runtime/worker-core";

export type LocalClaudeControlledAgentProfileInput = Parameters<
  typeof buildClaudeControlledAgentProfile
>[0];

export type LoadedClaudeSessionArtifact = {
  readonly path: string;
  readonly sha256Prefix: string;
  readonly sessionArtifact: SessionArtifact;
};

export function buildLocalClaudeControlledAgentProfile(
  input: LocalClaudeControlledAgentProfileInput,
): ClaudeControlledAgentProfile {
  return buildClaudeControlledAgentProfile(input);
}

export async function loadScopedClaudeSessionArtifact(input: {
  readonly sessionArtifactPath: string;
  readonly authRoot: string;
  readonly cwd: string;
}): Promise<LoadedClaudeSessionArtifact> {
  const authRoot = resolve(input.authRoot);
  const sessionPath = resolvePath(input.cwd, input.sessionArtifactPath);
  if (!pathInsideOrEqual(sessionPath, authRoot)) {
    throw new Error("project_control_controller_session_artifact_outside_scope");
  }
  const [realAuthRoot, realSessionPath] = await Promise.all([
    realpath(authRoot),
    realpath(sessionPath),
  ]);
  if (!pathInsideOrEqual(realSessionPath, realAuthRoot)) {
    throw new Error("project_control_controller_session_artifact_symlink_escape");
  }
  const bytes = await readFile(realSessionPath);
  return {
    path: realSessionPath,
    sha256Prefix: createHash("sha256").update(bytes).digest("hex").slice(0, 12),
    sessionArtifact: {
      kind: "json-file",
      providerId: claudeProviderId,
      formatVersion: claudeSessionFormatVersion,
      bytes,
      contentType: "application/json",
    },
  };
}

export function createLocalClaudeControlledAgentProvider(input: {
  readonly profile: ClaudeControlledAgentProfile;
  readonly sessionArtifact: SessionArtifact;
  readonly workspacePath: string;
  readonly controllerObjective: string;
  readonly claudePath?: string;
  readonly model?: string;
  readonly maxTurns?: number;
  readonly redactor?: RedactorPort;
}): ControlledAgentProviderPort {
  return new ClaudeControlledAgentProvider({
    profile: input.profile,
    sessionArtifact: input.sessionArtifact,
    workspacePath: input.workspacePath,
    controllerObjective: input.controllerObjective,
    ...(input.claudePath === undefined ? {} : { claudePath: input.claudePath }),
    ...(input.model === undefined ? {} : { model: input.model }),
    ...(input.maxTurns === undefined ? {} : { maxTurns: input.maxTurns }),
    ...(input.redactor === undefined ? {} : { redactor: input.redactor }),
  });
}

function resolvePath(cwd: string, value: string): string {
  const expanded = value.startsWith("~/")
    ? join(process.env.HOME ?? "", value.slice(2))
    : value;
  return isAbsolute(expanded) ? expanded : resolve(cwd, expanded);
}

function pathInsideOrEqual(path: string, root: string): boolean {
  const normalizedPath = stripTrailingSeparator(resolve(path));
  const normalizedRoot = stripTrailingSeparator(resolve(root));
  return normalizedPath === normalizedRoot ||
    normalizedPath.startsWith(`${normalizedRoot}${sep}`);
}

function stripTrailingSeparator(path: string): string {
  return path.length > 1 && path.endsWith(sep) ? path.slice(0, -1) : path;
}

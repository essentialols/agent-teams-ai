import { createPersistedLaunchSnapshot } from '@main/services/team/TeamLaunchStateEvaluator';

import { cloneFixture } from './harnessData';

import type { ProvisioningRun } from '@main/services/team/provisioning/TeamProvisioningRunModel';
import type { TeamRuntimeMemberLaunchEvidence } from '@main/services/team/runtime';
import type { TeamMetaFile } from '@main/services/team/TeamMetaStore';
import type {
  MemberLaunchState,
  PersistedTeamLaunchMemberState,
  PersistedTeamLaunchPhase,
  PersistedTeamLaunchSnapshot,
  TeamAgentRuntimeEntry,
  TeamAgentRuntimeSnapshot,
  TeamConfig,
  TeamCreateRequest,
  TeamFastMode,
  TeamMember,
  TeamProviderBackendId,
  TeamProviderId,
  TeamProvisioningProgress,
} from '@shared/types';

export const HARNESS_DEFAULT_TEAM_NAME = 'harness-team';
export const HARNESS_DEFAULT_NOW_ISO = '2026-01-01T00:00:00.000Z';
export const HARNESS_INERT_PROJECT_PATH = '/tmp/agent-teams-harness/project';
export const HARNESS_INERT_MODEL = 'harness-model';
export const HARNESS_INERT_PROVIDER_BACKEND_ID = 'adapter';

export type MemberFixtureOptions = Partial<TeamMember>;

function member(
  name: string,
  providerId: TeamProviderId,
  role: string,
  overrides: MemberFixtureOptions = {}
): TeamMember {
  const fixture: TeamMember = {
    name,
    role,
    providerId,
    providerBackendId: HARNESS_INERT_PROVIDER_BACKEND_ID,
    model: HARNESS_INERT_MODEL,
    ...overrides,
  };
  assertNoSecretLikeFixtureValues(fixture);
  return cloneFixture(fixture);
}

export const memberFixture = {
  lead(overrides: MemberFixtureOptions = {}): TeamMember {
    return member('Lead', 'codex', 'Team Lead', overrides);
  },

  codex(name: string, overrides: MemberFixtureOptions = {}): TeamMember {
    return member(name, 'codex', 'Engineer', overrides);
  },

  anthropic(name: string, overrides: MemberFixtureOptions = {}): TeamMember {
    return member(name, 'anthropic', 'Engineer', overrides);
  },

  opencode(name: string, overrides: MemberFixtureOptions = {}): TeamMember {
    return member(name, 'opencode', 'Engineer', overrides);
  },
};

export type TeamConfigFixtureOptions = Partial<TeamConfig> & {
  teamName?: string;
};

export const teamConfigFixture = {
  basic(options: TeamConfigFixtureOptions = {}): TeamConfig {
    const {
      teamName = HARNESS_DEFAULT_TEAM_NAME,
      members = [memberFixture.lead(), memberFixture.codex('Builder')],
      projectPath = HARNESS_INERT_PROJECT_PATH,
      ...overrides
    } = options;

    const fixture: TeamConfig = {
      name: overrides.name ?? teamName,
      description: 'Harness fixture team',
      color: 'blue',
      projectPath,
      leadSessionId: 'harness-lead-session',
      members,
      ...overrides,
    };
    assertNoSecretLikeFixtureValues(fixture);
    return cloneFixture(fixture);
  },
};

export type TeamMetaFixtureOptions = Partial<Omit<TeamMetaFile, 'version'>>;

export const teamMetaFixture = {
  basic(options: TeamMetaFixtureOptions = {}): TeamMetaFile {
    const fixture: TeamMetaFile = {
      version: 1,
      displayName: HARNESS_DEFAULT_TEAM_NAME,
      description: 'Harness fixture team',
      color: 'blue',
      cwd: HARNESS_INERT_PROJECT_PATH,
      providerId: 'codex',
      providerBackendId: HARNESS_INERT_PROVIDER_BACKEND_ID,
      model: HARNESS_INERT_MODEL,
      createdAt: Date.parse(HARNESS_DEFAULT_NOW_ISO),
      ...options,
    };
    assertNoSecretLikeFixtureValues(fixture);
    return cloneFixture(fixture);
  },
};

export function toMetaMembers(members: TeamCreateRequest['members']): TeamMember[] {
  return cloneFixture(
    members.map(
      (memberValue) =>
        ({
          name: memberValue.name,
          role: memberValue.role,
          workflow: memberValue.workflow,
          isolation: memberValue.isolation,
          cwd: memberValue.cwd,
          providerId: memberValue.providerId,
          model: memberValue.model,
          effort: memberValue.effort,
          mcpPolicy: memberValue.mcpPolicy,
          agentType: 'teammate',
        }) satisfies TeamMember
    )
  );
}

function toProvisioningMemberInputs(members: readonly TeamMember[]): TeamCreateRequest['members'] {
  return cloneFixture(
    members.map((memberValue) => ({
      name: memberValue.name,
      role: memberValue.role,
      workflow: memberValue.workflow,
      isolation: memberValue.isolation,
      cwd: memberValue.cwd,
      providerId: memberValue.providerId,
      providerBackendId: memberValue.providerBackendId,
      model: memberValue.model,
      effort: memberValue.effort,
      fastMode: memberValue.fastMode,
      mcpPolicy: memberValue.mcpPolicy,
    }))
  );
}

export type TeamCreateRequestFixtureOptions = Partial<Omit<TeamCreateRequest, 'members'>> & {
  members?: TeamCreateRequest['members'] | readonly TeamMember[];
};

export function makeTeamCreateRequest(
  options: TeamCreateRequestFixtureOptions = {}
): TeamCreateRequest {
  const defaultMembers = [memberFixture.lead(), memberFixture.codex('Builder')];
  const {
    teamName = HARNESS_DEFAULT_TEAM_NAME,
    cwd = HARNESS_INERT_PROJECT_PATH,
    members = defaultMembers,
    ...overrides
  } = options;
  const request: TeamCreateRequest = {
    teamName,
    cwd,
    members: toProvisioningMemberInputs(members as readonly TeamMember[]),
    prompt: 'Harness fixture prompt',
    providerId: 'codex',
    providerBackendId: HARNESS_INERT_PROVIDER_BACKEND_ID,
    model: HARNESS_INERT_MODEL,
    ...overrides,
  };
  assertNoSecretLikeFixtureValues(request);
  return cloneFixture(request);
}

export interface ProvisioningRunFixtureOptions {
  runId?: string;
  teamName?: string;
  startedAt?: string;
  request?: TeamCreateRequest;
  progress?: Partial<TeamProvisioningProgress>;
  expectedMembers?: readonly string[];
  effectiveMembers?: TeamCreateRequest['members'];
  overrides?: Partial<ProvisioningRun>;
}

function makeProvisioningProgress(
  runId: string,
  teamName: string,
  startedAt: string,
  overrides: Partial<TeamProvisioningProgress> = {}
): TeamProvisioningProgress {
  return cloneFixture({
    runId,
    teamName,
    state: 'configuring',
    message: 'Harness provisioning run',
    startedAt,
    updatedAt: startedAt,
    ...overrides,
  });
}

export function makeProvisioningRun(options: ProvisioningRunFixtureOptions = {}): ProvisioningRun {
  const runId = options.runId ?? 'harness-run-id';
  const teamName = options.teamName ?? options.request?.teamName ?? HARNESS_DEFAULT_TEAM_NAME;
  const startedAt = options.startedAt ?? HARNESS_DEFAULT_NOW_ISO;
  const request = cloneFixture(options.request ?? makeTeamCreateRequest({ teamName }));
  const allEffectiveMembers = cloneFixture(options.effectiveMembers ?? request.members);
  const effectiveMembers = cloneFixture(options.effectiveMembers ?? request.members);
  const expectedMembers =
    options.expectedMembers ?? effectiveMembers.map((memberValue) => memberValue.name);
  const progress = makeProvisioningProgress(runId, teamName, startedAt, options.progress);
  const run = {
    runId,
    teamName,
    startedAt,
    progress,
    stdoutBuffer: '',
    stderrBuffer: '',
    claudeLogLines: [],
    lastClaudeLogStream: null,
    stdoutLogLineBuf: '',
    stderrLogLineBuf: '',
    stdoutParserCarry: '',
    stdoutParserCarryIsCompleteJson: false,
    stdoutParserCarryLooksLikeClaudeJson: false,
    deterministicBootstrapMemberSpawnSeen: false,
    deterministicBootstrapMemberResultSeen: false,
    processKilled: false,
    finalizingByTimeout: false,
    cancelRequested: false,
    teamsBasePathsToProbe: [],
    child: null,
    timeoutHandle: null,
    fsMonitorHandle: null,
    onProgress: () => undefined,
    expectedMembers: [...expectedMembers],
    request,
    allEffectiveMembers,
    effectiveMembers,
    launchIdentity: null,
    mixedSecondaryLanes: [],
    lastLogProgressAt: 0,
    lastDataReceivedAt: 0,
    lastStdoutReceivedAt: 0,
    stallCheckHandle: null,
    stallWarningIndex: null,
    preStallMessage: null,
    lastRetryAt: 0,
    apiRetryWarningIndex: null,
    apiErrorWarningEmitted: false,
    fsPhase: 'waiting_config',
    waitingTasksSince: null,
    provisioningComplete: false,
    processClosed: false,
    requiresFirstRealTurnSuccess: false,
    firstRealTurnSucceeded: false,
    mcpConfigPath: null,
    memberMcpConfigPaths: [],
    bootstrapSpecPath: null,
    bootstrapUserPromptPath: null,
    isLaunch: true,
    launchStateClearedForRun: false,
    deterministicBootstrap: true,
    leadRelayCapture: null,
    activeCrossTeamReplyHints: [],
    leadMsgSeq: 0,
    liveLeadTextBuffer: null,
    pendingToolCalls: [],
    activeToolCalls: new Map(),
    pendingDirectCrossTeamSendRefresh: false,
    lastLeadTextEmitMs: 0,
    silentUserDmForward: null,
    silentUserDmForwardClearHandle: null,
    pendingInboxRelayCandidates: [],
    provisioningOutputParts: [],
    provisioningTraceLines: [],
    lastProvisioningTraceKey: null,
    provisioningOutputIndexByMessageId: new Map(),
    detectedSessionId: null,
    leadActivityState: 'idle',
    authFailureRetried: false,
    authRetryInProgress: false,
    leadContextUsage: null,
    spawnContext: null,
    anthropicApiKeyHelper: null,
    pendingApprovals: new Map(),
    processedPermissionRequestIds: new Set(),
    pendingPostCompactReminder: false,
    postCompactReminderInFlight: false,
    suppressPostCompactReminderOutput: false,
    pendingGeminiPostLaunchHydration: false,
    geminiPostLaunchHydrationInFlight: false,
    geminiPostLaunchHydrationSent: false,
    suppressGeminiPostLaunchHydrationOutput: false,
    memberSpawnStatuses: new Map(),
    memberSpawnToolUseIds: new Map(),
    pendingMemberRestarts: new Map(),
    memberSpawnLeadInboxCursorByMember: new Map(),
    lastDeterministicBootstrapSeq: 0,
    lastMemberSpawnAuditAt: 0,
    lastMemberSpawnAuditConfigReadWarningAt: 0,
    lastMemberSpawnAuditMissingWarningAt: new Map(),
    ...options.overrides,
  } as ProvisioningRun;
  assertNoSecretLikeFixtureValues({
    runId: run.runId,
    teamName: run.teamName,
    startedAt: run.startedAt,
    progress: run.progress,
    request: run.request,
    expectedMembers: run.expectedMembers,
  });
  return run;
}

export interface LaunchStateFixtureOptions {
  teamName?: string;
  expectedMembers?: readonly string[];
  bootstrapExpectedMembers?: readonly string[];
  includeLeadMembers?: boolean;
  leadSessionId?: string;
  launchPhase?: PersistedTeamLaunchPhase;
  members?: Record<string, PersistedTeamLaunchMemberState>;
  updatedAt?: string;
}

export function makeLaunchState(
  options: LaunchStateFixtureOptions = {}
): PersistedTeamLaunchSnapshot {
  const snapshot = createPersistedLaunchSnapshot({
    teamName: options.teamName ?? HARNESS_DEFAULT_TEAM_NAME,
    expectedMembers: options.expectedMembers ?? ['Builder'],
    bootstrapExpectedMembers: options.bootstrapExpectedMembers,
    includeLeadMembers: options.includeLeadMembers,
    leadSessionId: options.leadSessionId ?? 'harness-lead-session',
    launchPhase: options.launchPhase,
    members: options.members,
    updatedAt: options.updatedAt ?? HARNESS_DEFAULT_NOW_ISO,
  });
  assertNoSecretLikeFixtureValues(snapshot);
  return cloneFixture(snapshot);
}

export interface RuntimeSnapshotFixtureOptions {
  teamName?: string;
  runId?: string | null;
  updatedAt?: string;
  providerBackendId?: TeamProviderBackendId;
  fastMode?: TeamFastMode;
  members?: Record<string, TeamAgentRuntimeEntry>;
}

export function makeRuntimeSnapshot(
  options: RuntimeSnapshotFixtureOptions = {}
): TeamAgentRuntimeSnapshot {
  const updatedAt = options.updatedAt ?? HARNESS_DEFAULT_NOW_ISO;
  const members = cloneFixture(
    options.members ??
      ({
        Builder: {
          memberName: 'Builder',
          alive: true,
          restartable: true,
          backendType: 'process',
          providerId: 'opencode',
          providerBackendId: 'opencode-cli',
          laneId: 'lane-builder',
          laneKind: 'secondary',
          runtimePid: 4242,
          livenessKind: 'confirmed_bootstrap',
          pidSource: 'runtime_bootstrap',
          updatedAt,
        },
      } satisfies Record<string, TeamAgentRuntimeEntry>)
  );
  const snapshot: TeamAgentRuntimeSnapshot = {
    teamName: options.teamName ?? HARNESS_DEFAULT_TEAM_NAME,
    updatedAt,
    runId: options.runId ?? 'harness-run-id',
    providerBackendId: options.providerBackendId ?? HARNESS_INERT_PROVIDER_BACKEND_ID,
    fastMode: options.fastMode ?? 'off',
    members,
  };
  assertNoSecretLikeFixtureValues(snapshot);
  return cloneFixture(snapshot);
}

export interface OpenCodeEvidenceFixtureOptions {
  memberName?: string;
  model?: string;
  launchState?: MemberLaunchState;
  agentToolAccepted?: boolean;
  runtimeAlive?: boolean;
  bootstrapConfirmed?: boolean;
  hardFailure?: boolean;
  hardFailureReason?: string;
  sessionId?: string;
  runtimePid?: number;
  diagnostics?: string[];
}

export function makeOpenCodeEvidence(
  options: OpenCodeEvidenceFixtureOptions = {}
): TeamRuntimeMemberLaunchEvidence {
  const evidence: TeamRuntimeMemberLaunchEvidence = {
    memberName: options.memberName ?? 'Builder',
    providerId: 'opencode',
    model: options.model ?? HARNESS_INERT_MODEL,
    launchState: options.launchState ?? 'confirmed_alive',
    agentToolAccepted: options.agentToolAccepted ?? true,
    runtimeAlive: options.runtimeAlive ?? true,
    bootstrapConfirmed: options.bootstrapConfirmed ?? true,
    hardFailure: options.hardFailure ?? false,
    ...(options.hardFailureReason ? { hardFailureReason: options.hardFailureReason } : {}),
    sessionId: options.sessionId ?? 'harness-opencode-session',
    bootstrapEvidenceSource: 'runtime_bootstrap_checkin',
    backendType: 'process',
    runtimePid: options.runtimePid ?? 4242,
    livenessKind: 'confirmed_bootstrap',
    pidSource: 'runtime_bootstrap',
    diagnostics: cloneFixture(options.diagnostics ?? []),
  };
  assertNoSecretLikeFixtureValues(evidence);
  return cloneFixture(evidence);
}

export interface SecretLikeFixtureFinding {
  path: string;
  reason: string;
  patternName?: string;
  stringLength?: number;
  redactedValue?: '<redacted>';
}

const SECRET_LIKE_KEY_PATTERN = new RegExp(
  [
    'api[_-]?key',
    'apiKey',
    'auth[_-]?token',
    'authToken',
    'oauth[_-]?token',
    'oauthToken',
    'secret',
    'password',
    'passwd',
    'private[_-]?key',
    'privateKey',
  ].join('|'),
  'i'
);
const SECRET_LIKE_VALUE_PATTERNS: readonly { name: string; pattern: RegExp }[] = [
  { name: 'bearer-token', pattern: /\bBearer\s+[A-Za-z0-9._-]{10,}\b/i },
  { name: 'openai-api-key', pattern: /\bsk-(?:live|test|proj)?[A-Za-z0-9_-]{10,}\b/i },
  { name: 'github-token', pattern: /\bgh[pousr]_[A-Za-z0-9_]{10,}\b/i },
  { name: 'slack-token', pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/i },
  { name: 'aws-access-key-id', pattern: /\bAKIA[0-9A-Z]{12,}\b/ },
  { name: 'private-key-block', pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
];

const SAFE_FIXTURE_PATH_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_-]{0,63}$/;

function findSecretLikeValuePattern(
  value: string
): (typeof SECRET_LIKE_VALUE_PATTERNS)[number] | undefined {
  return SECRET_LIKE_VALUE_PATTERNS.find(({ pattern }) => pattern.test(value));
}

function findSecretLikeKeyPattern(key: string): { name: string } | undefined {
  if (SECRET_LIKE_KEY_PATTERN.test(key)) {
    return { name: 'secret-like-key' };
  }
  const matchedValuePattern = findSecretLikeValuePattern(key);
  if (matchedValuePattern) {
    return { name: `secret-like-${matchedValuePattern.name}` };
  }
  return undefined;
}

function formatObjectKeyPathSegment(key: string, index: number): string {
  if (findSecretLikeKeyPattern(key)) {
    return `[key#${index}:redacted]`;
  }
  if (SAFE_FIXTURE_PATH_KEY_PATTERN.test(key)) {
    return `[key#${index}:safe]`;
  }
  return `[key#${index}:sanitized]`;
}

function scanFixtureValue(
  value: unknown,
  path: string,
  findings: SecretLikeFixtureFinding[]
): void {
  if (typeof value === 'string') {
    const matchedPattern = findSecretLikeValuePattern(value);
    if (matchedPattern) {
      findings.push({
        path,
        reason: `value matched secret-like pattern ${matchedPattern.name}`,
        patternName: matchedPattern.name,
        stringLength: value.length,
        redactedValue: '<redacted>',
      });
    }
    return;
  }

  if (!value || typeof value !== 'object') {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => scanFixtureValue(item, `${path}[${index}]`, findings));
    return;
  }

  for (const [index, [key, child]] of Object.entries(value).entries()) {
    const childPath = `${path}${formatObjectKeyPathSegment(key, index)}`;
    const matchedKeyPattern = findSecretLikeKeyPattern(key);
    if (matchedKeyPattern) {
      findings.push({
        path: childPath,
        reason: 'key matched secret-like pattern',
        patternName: matchedKeyPattern.name,
      });
    }
    scanFixtureValue(child, childPath, findings);
  }
}

export function collectSecretLikeFixtureValues(value: unknown): SecretLikeFixtureFinding[] {
  const findings: SecretLikeFixtureFinding[] = [];
  scanFixtureValue(value, '$', findings);
  return findings;
}

export function assertNoSecretLikeFixtureValues(value: unknown): void {
  const findings = collectSecretLikeFixtureValues(value);
  if (findings.length === 0) {
    return;
  }

  const details = findings
    .map((finding) =>
      finding.redactedValue
        ? `${finding.path}: ${finding.reason} ` +
          `(length=${finding.stringLength}, value=${finding.redactedValue})`
        : `${finding.path}: ${finding.reason}`
    )
    .join('\n');
  throw new Error(`Secret-like fixture values are not allowed:\n${details}`);
}

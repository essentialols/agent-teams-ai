import {
  AccessDecisionReason,
  ProjectOperation,
  createAccessPolicyService,
  type AccessPolicyContext,
  type AccessPolicyService,
  type PolicyDecision,
  type ProjectGitAccessRequest,
  type ProjectJobAccessRequest,
  type ProjectWorktreeAccessRequest,
} from "./access-control";

export enum ProjectControlAuditEventType {
  DecisionRecorded = "project_control.decision_recorded",
}

export type ProjectControlOperationResult = {
  readonly status: "applied" | "noop";
  readonly safeMessage?: string;
  readonly resourceId?: string;
};

export type ProjectControlCreateJobInput = ProjectJobAccessRequest & {
  readonly promptPath?: string;
  readonly accounts?: readonly string[];
};

export type ProjectControlWriteReviewMarkerInput = ProjectJobAccessRequest & {
  readonly markerType: "review" | "stop" | "maintenance_pause" | "handoff";
  readonly note?: string;
};

export type ProjectControlBrokerEvent = {
  readonly schemaVersion: 1;
  readonly type: ProjectControlAuditEventType;
  readonly occurredAt: string;
  readonly operation: ProjectOperation;
  readonly decision: PolicyDecision;
};

export interface ProjectControlAuditPort {
  record(event: ProjectControlBrokerEvent): Promise<void> | void;
}

export interface ProjectJobRegistryPort {
  createJob(input: ProjectControlCreateJobInput): Promise<ProjectControlOperationResult>;
  writeReviewMarker(
    input: ProjectControlWriteReviewMarkerInput,
  ): Promise<ProjectControlOperationResult>;
}

export interface ProjectWorkerSupervisorPort {
  startWorker(input: ProjectJobAccessRequest): Promise<ProjectControlOperationResult>;
  stopWorker(input: ProjectJobAccessRequest): Promise<ProjectControlOperationResult>;
}

export interface ProjectWorkspacePort {
  createWorktree(
    input: ProjectWorktreeAccessRequest,
  ): Promise<ProjectControlOperationResult>;
}

export interface ProjectGitPort {
  integrateCommit(input: ProjectGitAccessRequest): Promise<ProjectControlOperationResult>;
  pushBranch(input: ProjectGitAccessRequest): Promise<ProjectControlOperationResult>;
}

export type ProjectControlBrokerPorts = {
  readonly registry: ProjectJobRegistryPort;
  readonly supervisor: ProjectWorkerSupervisorPort;
  readonly workspace: ProjectWorkspacePort;
  readonly git: ProjectGitPort;
  readonly audit?: ProjectControlAuditPort;
  readonly clock?: { now(): Date };
};

export class ProjectControlDeniedError extends Error {
  readonly decision: PolicyDecision;

  constructor(decision: PolicyDecision) {
    super(`project_control_denied:${decision.reason}`);
    this.name = "ProjectControlDeniedError";
    this.decision = decision;
  }
}

export class ProjectControlBroker {
  private readonly policy: AccessPolicyService;
  private readonly clock: { now(): Date };

  constructor(
    context: AccessPolicyContext | AccessPolicyService,
    private readonly ports: ProjectControlBrokerPorts,
  ) {
    this.policy = isPolicyService(context)
      ? context
      : createAccessPolicyService(context);
    this.clock = ports.clock ?? { now: () => new Date() };
  }

  async createJob(
    input: ProjectControlCreateJobInput,
  ): Promise<ProjectControlOperationResult> {
    await this.authorize(this.policy.canCreateJob(input));
    for (const accountId of input.accounts ?? []) {
      await this.authorize(this.policy.canUseAccount({ accountId }));
    }
    return this.ports.registry.createJob(input);
  }

  async startWorker(
    input: ProjectJobAccessRequest,
  ): Promise<ProjectControlOperationResult> {
    await this.authorize(this.policy.canStartWorker(input));
    return this.ports.supervisor.startWorker(input);
  }

  async stopWorker(
    input: ProjectJobAccessRequest,
  ): Promise<ProjectControlOperationResult> {
    await this.authorize(this.policy.canStopWorker(input));
    return this.ports.supervisor.stopWorker(input);
  }

  async createWorktree(
    input: ProjectWorktreeAccessRequest,
  ): Promise<ProjectControlOperationResult> {
    await this.authorize(this.policy.canCreateWorktree(input));
    return this.ports.workspace.createWorktree(input);
  }

  async writeReviewMarker(
    input: ProjectControlWriteReviewMarkerInput,
  ): Promise<ProjectControlOperationResult> {
    await this.authorize(this.policy.canWriteReviewMarker(input));
    return this.ports.registry.writeReviewMarker(input);
  }

  async integrateCommit(
    input: ProjectGitAccessRequest,
  ): Promise<ProjectControlOperationResult> {
    await this.authorize(this.policy.canIntegrateCommit(input));
    return this.ports.git.integrateCommit(input);
  }

  async pushBranch(
    input: ProjectGitAccessRequest,
  ): Promise<ProjectControlOperationResult> {
    await this.authorize(this.policy.canPushBranch(input));
    return this.ports.git.pushBranch(input);
  }

  private async authorize(decision: PolicyDecision): Promise<void> {
    await this.ports.audit?.record({
      schemaVersion: 1,
      type: ProjectControlAuditEventType.DecisionRecorded,
      occurredAt: this.clock.now().toISOString(),
      operation: decision.operation,
      decision,
    });
    if (!decision.allowed) throw new ProjectControlDeniedError(decision);
  }
}

export function projectControlDeniedReason(error: unknown): AccessDecisionReason | null {
  return error instanceof ProjectControlDeniedError
    ? error.decision.reason
    : null;
}

function isPolicyService(value: unknown): value is AccessPolicyService {
  return Boolean(
    value &&
      typeof value === "object" &&
      "canCreateJob" in value &&
      "canStartWorker" in value &&
      "canPushBranch" in value,
  );
}

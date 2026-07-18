import {
  lstat,
  mkdir,
  readFile,
  realpath,
  rm,
  rmdir,
  writeFile,
} from "node:fs/promises";
import { hostname } from "node:os";
import { basename, dirname, join } from "node:path";
import {
  AccessBoundary,
  NetworkAccessMode,
  type ProjectAccessScope,
  type ProjectControlBroker,
  type ProjectControlOperationResult,
} from "@vioxen/subscription-runtime/worker-core";
import {
  codexGoalJobToArgs,
  readCodexGoalJob,
  summarizeCodexGoalJob,
  type CodexGoalJobManifest,
  type CodexGoalJobManifestInput,
} from "./codex-goal-jobs";
import {
  runDependencyBootstrap,
  type DependencyPreflightResult,
} from "./dependency-bootstrap";
import {
  collectCodexGoalStatus,
  resolveCodexGoalWorkerLiveness,
  type CodexGoalStatus,
} from "./codex-goal-ops";
import {
  type CodexGoalProjectCreateWorktreeInput,
  type CodexProjectControlBrokerInput,
  projectControlAuditPath,
} from "./codex-goal-mcp-project-broker";
import {
  createOrReuseProjectControlOperation,
  ProjectControlOperationStatus,
  projectControlOperationExecutionMode,
  projectControlOperationView,
  projectControlOperationsRoot,
  readProjectControlOperationById,
  recoverProjectControlOperations,
  startProjectControlOperationRunner,
  updateProjectControlOperation,
  type JsonRecord as ProjectControlOperationJsonRecord,
  type ProjectControlOperationToolName,
} from "./project-control-operation-lifecycle";
import { codexGoalAccountCapacityFacts } from "./codex-goal-mcp-account-capacity-facts";
import {
  projectControlDefaultAccountNames,
  projectControlRefillAccountNames,
  rotateProjectControlAccountNames,
} from "./codex-goal-mcp-project-accounts";
import {
  assertProjectControlCreateManifestPaths,
  assertProjectControlDependencyBootstrapReady,
  projectControlCanonicalWorkspacePath,
  projectControlChildScope,
  projectControlDependencyBootstrapMode,
  projectControlPathArg,
  projectControlRealPathIfExists,
  projectControlRealPathOutsideWorkspaceScope,
  projectControlWorkerRole,
} from "./codex-goal-mcp-project-scope";
import {
  assertSafeGitRefName,
  stagedPatchSha256ForRevision,
} from "./codex-goal-mcp-project-git";
import { publishImmutableTextArtifact } from "./local-immutable-text-artifact";
import {
  resolveProjectSourceReference,
  resolveProjectSourceRevision,
} from "./application/project-control/codex-goal-project-source-revision";
import { execGitStdout } from "./application/project-control/codex-goal-project-git";
import {
  finalizeProjectMergeBoundSource,
  parseProjectMergeBindingRequest,
  readExistingProjectMergeBinding,
} from "./application/project-control/codex-goal-project-merge-binding";
import { assertProjectRefillInputPatchSource } from "./application/project-control/codex-goal-project-input-patch-policy";
import {
  matchesProjectControlPrefix,
  uniqueProjectControlStrings,
} from "./codex-goal-mcp-project-utils";
import {
  assertReadablePrompt,
  createOrReuseProjectJob,
  createOrReuseProjectWorktree,
  projectRefillJobMismatches,
  projectRefillLaunchArtifactTransactionPending,
  readTextFileIfExists,
  reconcileProjectRefillLaunchArtifactTransaction,
  replaceProjectRefillLaunchArtifacts,
  rollbackProjectRefillPartial,
} from "./application/project-control/codex-goal-project-refill";
import {
  assertProjectPreStartAdmissionLaunchBinding,
  assertProjectPreStartAdmissionSourceRevision,
  planProjectPreStartAdmission,
  prepareProjectPreStartAdmission,
  removeProjectPreStartAdmissionPaths,
  validateStoredProjectPreStartAdmission,
} from "./application/project-control/codex-goal-project-pre-start-admission";
import { validateProjectRefillPreStartAdmission } from "./application/project-control/codex-goal-project-refill-admission";
import { projectControlChildManifestInput } from "./application/project-control/codex-goal-project-child-manifest";
import {
  projectControlWorkspaceLocks,
  withValidatedProjectWorkspaceLock,
} from "./codex-goal-project-workspace-lock";
import {
  booleanValue,
  requiredRawString,
  stringValue,
  tagValues,
} from "./codex-goal-mcp-values";
import type {
  JobCreateMcpArgs,
  ProjectControlMcpArgs,
} from "./codex-goal-mcp-inputs";
import { goalLaunchInput } from "./codex-goal-mcp-launch-input";
import { ensureTerminalCodexGoalHandoffArtifacts } from "./application/ensure-codex-goal-handoff-artifacts";
import {
  readVerifiableProducerHandoff,
  readVerifiedProducerHandoff,
  type VerifiedProducerHandoff,
} from "./application/project-control/codex-goal-project-verifier-handoff";
import { codexGoalStatusInputFromLaunch } from "./application/codex-goal-status-input";
import {
  releaseCodexProjectAccount,
  reserveCodexProjectAccount,
  type CodexProjectAccountReservation,
} from "./application/project-control/codex-goal-project-account-reservation";
import {
  resolveReviewedOutputAggregate,
  reviewedOutputAggregateView,
  type ReviewedOutputAggregate,
} from "./application/project-control/reviewed-output-aggregate-materializer";
import {
  LocalReviewedWorkerOutputStore,
  reviewedWorkerOutputRoot,
} from "./reviewed-worker-output";
import {
  rejectedReviewedOutputRemediationView,
  resolveRejectedReviewedOutputRemediation,
} from "./application/project-control/rejected-reviewed-output-remediation";

type JsonObject = Readonly<Record<string, unknown>>;

type LoadedProjectControlController = {
  readonly registryRootDir: string;
  readonly controller: CodexGoalJobManifest;
  readonly scope: ProjectAccessScope;
};

export type CodexGoalMcpProjectControlJobsDeps = {
  readonly loadProjectControlController: (
    args: ProjectControlMcpArgs,
  ) => Promise<LoadedProjectControlController>;
  readonly codexProjectControlBroker: (
    input: Omit<CodexProjectControlBrokerInput, "admissionDeps">,
  ) => ProjectControlBroker;
};

export { projectControlCreateCodexGoalJobView } from "./codex-goal-mcp-project-control-create-job";

export async function projectControlRefillWorkerView(
  args: ProjectControlMcpArgs,
  deps: CodexGoalMcpProjectControlJobsDeps,
  boundedToolName: ProjectControlOperationToolName = "codex_goal_project_refill_worker",
): Promise<JsonObject> {
  const executionMode =
    args.executionMode ??
    (booleanValue(args.startWorker) === false ? "sync" : "bounded");
  if (projectControlOperationExecutionMode(executionMode) === "bounded") {
    return projectControlRefillWorkerBoundedView(args, deps, boundedToolName);
  }
  const controller = await deps.loadProjectControlController(args);
  if (args.projectAccessScope !== undefined) {
    throw new Error("project_control_child_scope_is_controller_owned");
  }
  if (args.allowDangerFullAccess === true) {
    throw new Error("project_control_child_danger_full_access_denied");
  }
  let promptBody = requiredRawString(args.promptBody, "promptBody");
  const unboundPromptBody = promptBody;
  const sourceWorkspacePath = projectControlPathArg(
    args,
    args.sourceWorkspacePath,
    "sourceWorkspacePath",
  );

  const requested = projectControlChildManifestInput({
    args: args as JobCreateMcpArgs,
    scope: controller.scope,
    registryRootDir: controller.registryRootDir,
  });
  if (
    requested.accessBoundary === AccessBoundary.ProjectScopedControl ||
    requested.accessBoundary === AccessBoundary.DangerFullAccess
  ) {
    throw new Error("project_control_child_boundary_denied");
  }
  const accounts = await projectControlRefillAccountNames({
    ...(requested.authRootDir === undefined
      ? {}
      : { authRootDir: requested.authRootDir }),
    requestedAccounts: requested.accounts,
    allowedAccountIds: controller.scope.allowedAccountIds ?? [],
    rotationKey: requested.jobId,
  });
  if (!accounts.length) {
    throw new Error("project_control_refill_no_ready_account");
  }
  const role = projectControlWorkerRole(args.workerRole);
  const producerJobId = stringValue(args.producerJobId);
  const reviewedOutputId = stringValue(args.reviewedOutputId);
  const reviewedOutputIds = reviewedOutputIdValues(args.reviewedOutputIds);
  assertVerifierInputSource({
    operationToolName: boundedToolName,
    producerJobId,
    reviewedOutputIds,
  });
  const accessBoundary =
    requested.accessBoundary ?? AccessBoundary.IsolatedWorkspaceWrite;
  const baseCreateManifest: CodexGoalJobManifestInput = {
    ...requested,
    accounts,
    tags: uniqueProjectControlStrings([
      ...tagValues(requested.tags),
      "project-control-refill",
      `worker-role-${role}`,
    ]),
    accessBoundary,
    projectAccessScope: projectControlChildScope(
      controller.scope,
      requested.workspacePath,
    ),
    allowDangerFullAccess: false,
    networkAccess: requested.networkAccess ?? NetworkAccessMode.Restricted,
    reasoningEffort: requested.reasoningEffort ?? "high",
    serviceTier: requested.serviceTier ?? "default",
  };
  const mergeBinding = parseProjectMergeBindingRequest({
    value: args.mergeBinding,
    admission: args.preStartAdmission,
    requireCanonicalRemoteHead:
      booleanValue(args.requireCanonicalRemoteHead) === true,
    expectedSourceCommit: args.expectedSourceCommit,
  });

  const baseBranch = stringValue(args.baseBranch) ?? "origin/main";
  assertSafeGitRefName(baseBranch, "baseBranch");
  const sourceRef = stringValue(args.sourceRef);
  if (sourceRef) assertSafeGitRefName(sourceRef, "sourceRef");
  const expectedSourceCommit = stringValue(args.expectedSourceCommit);
  const newBranch = stringValue(args.newBranch);
  if (newBranch) assertSafeGitRefName(newBranch, "newBranch");
  const realSourceWorkspacePath =
    await projectControlRealPathOutsideWorkspaceScope(
      sourceWorkspacePath,
      controller.scope,
    );
  const realPath = await projectControlRealPathOutsideWorkspaceScope(
    baseCreateManifest.workspacePath,
    controller.scope,
  );
  const expectedRealPath = await projectControlRealPathIfExists(
    baseCreateManifest.workspacePath,
  );
  const requestedWorktreeAccessInput = {
    sourceWorkspacePath,
    ...(realSourceWorkspacePath ? { realSourceWorkspacePath } : {}),
    path: baseCreateManifest.workspacePath,
    ...(realPath ? { realPath } : {}),
    ...(expectedRealPath ? { expectedRealPath } : {}),
    baseBranch,
    ...(sourceRef ? { sourceRef } : {}),
    ...(newBranch ? { newBranch } : {}),
    workerRole: role,
    ...(baseCreateManifest.tags ? { tags: baseCreateManifest.tags } : {}),
  };

  if (!args.confirmRefill) {
    return {
      ok: false,
      reason: "confirm_refill_required",
      mode: "project_control_refill_worker",
      controllerJobId: controller.controller.jobId,
      targetJobId: baseCreateManifest.jobId,
      auditPath: projectControlAuditPath(controller.controller),
      workerRole: role,
      startWorker: booleanValue(args.startWorker) !== false,
      worktreePreview: requestedWorktreeAccessInput,
      manifestPreview: baseCreateManifest as unknown as JsonObject,
      promptPath: baseCreateManifest.promptPath,
    };
  }

  const resolverBroker = deps.codexProjectControlBroker({
    registryRootDir: controller.registryRootDir,
    controller: controller.controller,
    scope: controller.scope,
  });
  const canonicalSourceWorkspacePath =
    booleanValue(args.requireCanonicalRemoteHead) === true
      ? await projectControlCanonicalWorkspacePath(
          sourceWorkspacePath,
          controller.scope,
        )
      : undefined;
  const sourceReference = resolveProjectSourceReference({
    requestedRef: canonicalSourceWorkspacePath
      ? baseBranch
      : (sourceRef ?? baseBranch),
    scope: controller.scope,
    remoteVerificationRequired:
      canonicalSourceWorkspacePath !== undefined ||
      expectedSourceCommit !== undefined,
  });
  const worktreeAccessInput = sourceReference.remoteVerified
    ? {
        ...requestedWorktreeAccessInput,
        sourceRef: sourceReference.worktreeSourceRef,
      }
    : requestedWorktreeAccessInput;
  const resolvedSource =
    await resolverBroker.resolveWorktreeRevision(worktreeAccessInput);
  const finalizedSource = await finalizeProjectMergeBoundSource({
    binding: mergeBinding,
    jobRootDir: baseCreateManifest.jobRootDir,
    admission: args.preStartAdmission,
    resolvedSource,
    scope: controller.scope,
    targetRemoteTrackingRef: sourceReference.remoteTrackingRef,
    ...(expectedSourceCommit ? { expectedSourceCommit } : {}),
    requireRemoteHead: canonicalSourceWorkspacePath !== undefined,
  });
  const { merge, sourceRevision } = finalizedSource;
  const preStartAdmission = planProjectPreStartAdmission({
    value: finalizedSource.admission,
    confirmed: booleanValue(args.confirmPreStartAdmission) === true,
    scope: controller.scope,
    manifest: baseCreateManifest,
  });
  if (
    boundedToolName === "codex_goal_project_refill_worker" &&
    role !== "adoption"
  ) {
    assertProjectRefillInputPatchSource({
      contract: preStartAdmission?.contract,
      producerJobId,
      reviewedOutputId,
      workerRole: role,
    });
  }
  const createManifest: CodexGoalJobManifestInput = {
    ...baseCreateManifest,
    ...(preStartAdmission
      ? { projectPreStartAdmission: preStartAdmission.descriptor }
      : {}),
  };
  const mergeRebindExisting = mergeBinding
    ? await projectMergeRebindExistingJob({
        registryRootDir: controller.registryRootDir,
        expected: createManifest,
      })
    : undefined;
  const mergeAlreadyBound =
    mergeBinding && !mergeRebindExisting
      ? await projectExactExistingMergeBoundJob({
          registryRootDir: controller.registryRootDir,
          expected: createManifest,
        })
      : undefined;
  assertProjectControlCreateManifestPaths({
    scope: controller.scope,
    registryRootDir: controller.registryRootDir,
    manifest: createManifest,
  });
  promptBody += finalizedSource.promptSuffix;
  const producerHandoff =
    producerJobId && !reviewedOutputId
      ? await resolveProducerHandoffForVerifier({
          registryRootDir: controller.registryRootDir,
          producerJobId,
          expectedInputPatchHash: preStartAdmission?.contract.inputPatchHash,
          allowProviderOutputInvalid:
            boundedToolName === "codex_goal_project_prepare_verifier",
        })
      : undefined;
  const reviewedOutputAggregate = reviewedOutputIds
    ? await resolveLocalReviewedOutputAggregate({
        registryRootDir: controller.registryRootDir,
        projectId: controller.scope.projectId,
        reviewedOutputIds,
        expectedBaseCommit: sourceRevision.revision,
      })
    : undefined;
  const rejectedReviewedOutputStore =
    reviewedOutputId && producerJobId
      ? new LocalReviewedWorkerOutputStore({
          rootDir: reviewedWorkerOutputRoot(controller.registryRootDir),
        })
      : undefined;
  const rejectedReviewedOutput =
    reviewedOutputId && producerJobId && rejectedReviewedOutputStore
      ? await resolveRejectedReviewedOutputRemediation(
          {
            store: rejectedReviewedOutputStore,
            readPatch: async (snapshot) =>
              await rejectedReviewedOutputStore.readPatch(snapshot),
            stagedPatchSha256ForRevision,
          },
          {
            projectId: controller.scope.projectId,
            reviewedOutputId,
            expectedWorkerJobId: producerJobId,
            expectedBaseCommit: sourceRevision.revision,
            expectedPatchSha256: preStartAdmission?.contract.inputPatchHash,
            sourceWorkspacePath: resolvedSource.sourceRealPath,
          },
        )
      : undefined;
  assertProjectPreStartAdmissionSourceRevision({
    plan: preStartAdmission,
    sourceRevision: sourceRevision.revision,
  });
  let aggregateArtifactCreatedPaths: readonly string[] = [];
  let aggregateInputPatch:
    | {
        readonly path: string;
        readonly sha256: string;
        readonly stagedSha256: string;
        readonly baseCommit: string;
        readonly changedPaths: readonly string[];
      }
    | undefined;
  if (reviewedOutputAggregate) {
    const artifacts = await materializeReviewedOutputAggregateArtifacts({
      jobRootDir: createManifest.jobRootDir,
      aggregate: reviewedOutputAggregate,
    });
    aggregateArtifactCreatedPaths = artifacts.createdPaths;
    try {
      aggregateInputPatch = {
        path: artifacts.patchPath,
        sha256: reviewedOutputAggregate.patchSha256,
        stagedSha256: await stagedPatchSha256ForRevision({
          workspacePath: resolvedSource.sourceRealPath,
          revision: sourceRevision.revision,
          patchPath: artifacts.patchPath,
        }),
        baseCommit: reviewedOutputAggregate.baseCommit,
        changedPaths: reviewedOutputAggregate.changedFiles,
      };
    } catch (error) {
      await removeReviewedOutputAggregateArtifacts(
        aggregateArtifactCreatedPaths,
      );
      throw error;
    }
  }
  const producerInputPatch =
    aggregateInputPatch ??
    rejectedReviewedOutput?.inputPatch ??
    (producerHandoff
      ? {
          path: producerHandoff.patchPath,
          sha256: producerHandoff.patchSha256,
          stagedSha256: await stagedPatchSha256ForRevision({
            workspacePath: resolvedSource.sourceRealPath,
            revision: sourceRevision.revision,
            patchPath: producerHandoff.patchPath,
          }),
          baseCommit: producerHandoff.baseCommit,
          changedPaths: producerHandoff.changedPaths,
        }
      : undefined);
  const createWorktreeInput: CodexGoalProjectCreateWorktreeInput = {
    jobId: requested.jobId,
    ...worktreeAccessInput,
    expectedRevision: sourceRevision.revision,
    ...(sourceRevision.pinned ? { sourceRevisionPinned: true } : {}),
    expectedSourceRealPath: resolvedSource.sourceRealPath,
    ...(producerInputPatch ? { inputPatch: producerInputPatch } : {}),
  };
  const worktreeBroker = deps.codexProjectControlBroker({
    registryRootDir: controller.registryRootDir,
    controller: controller.controller,
    scope: controller.scope,
    createWorktreeInput,
  });
  let worktreeCreated = false;
  let promptWritten = false;
  let admissionCreatedPaths: readonly string[] = [];
  let worktree: ProjectControlOperationResult;
  let createJob: ProjectControlOperationResult;
  let manifest: CodexGoalJobManifest;
  let expectedCanonicalWorkspacePath: string;
  let prompt: { readonly promptPath: string; readonly bytes: number };
  let dependencyPreflight: DependencyPreflightResult | undefined;
  let rebindTransaction:
    | Awaited<ReturnType<typeof replaceProjectRefillLaunchArtifacts>>
    | undefined;
  let recoveredMergeAlreadyBound = false;
  let mergeBoundRetryStartRequired = false;
  try {
    const worktreeResult = await createOrReuseProjectWorktree({
      broker: worktreeBroker,
      scope: controller.scope,
      createWorktreeInput,
    });
    worktree = worktreeResult.result;
    worktreeCreated = worktreeResult.created;

    if (mergeRebindExisting) {
      if (!preStartAdmission) {
        throw new Error("project_control_merge_rebind_admission_required");
      }
      const expectedCanonicalWorkspacePath =
        await projectControlCanonicalWorkspacePath(
          createManifest.workspacePath,
          controller.scope,
        );
      await withValidatedProjectWorkspaceLock({
        locks: projectControlWorkspaceLocks(controller.registryRootDir),
        scope: controller.scope,
        requestedWorkspacePath: createManifest.workspacePath,
        expectedCanonicalWorkspacePath,
        owner:
          `project-merge-rebind:${controller.controller.jobId}:` +
          createManifest.jobId,
        effect: async () => {
          await reconcileProjectRefillLaunchArtifactTransaction({
            manifest: mergeRebindExisting,
            scope: controller.scope,
          });
          if (
            await readExistingProjectMergeBinding(createManifest.jobRootDir)
          ) {
            recoveredMergeAlreadyBound = true;
            return;
          }
          const lockedExisting = await readCodexGoalJob({
            registryRootDir: controller.registryRootDir,
            jobId: createManifest.jobId,
          });
          const lockedMismatches = projectRefillJobMismatches(
            lockedExisting,
            createManifest,
          );
          if (lockedMismatches.length > 0) {
            throw new Error(
              `project_control_merge_rebind_existing_job_mismatch:${lockedMismatches.join(",")}`,
            );
          }
          if (!newBranch || !merge) {
            throw new Error("project_control_merge_rebind_branch_required");
          }
          const [lockedBranch, lockedHead] = await Promise.all([
            execGitStdout([
              "-C",
              createManifest.workspacePath,
              "symbolic-ref",
              "--short",
              "HEAD",
            ]),
            execGitStdout([
              "-C",
              createManifest.workspacePath,
              "rev-parse",
              "--verify",
              "HEAD^{commit}",
            ]),
          ]);
          if (lockedBranch.trim() !== newBranch) {
            throw new Error("project_control_merge_rebind_branch_mismatch");
          }
          if (lockedHead.trim() !== merge.expectedTargetCommit) {
            throw new Error("project_control_merge_rebind_head_mismatch");
          }
          await assertTerminalCleanProjectMergeRebind({
            manifest: lockedExisting,
            scope: controller.scope,
          });
          rebindTransaction = await replaceProjectRefillLaunchArtifacts({
            existing: lockedExisting,
            expected: createManifest,
            expectedExistingPromptBody: unboundPromptBody,
            promptBody,
            admission: preStartAdmission,
            scope: controller.scope,
            ...(producerInputPatch
              ? {
                  verifiedInputPatchArtifactSha256: producerInputPatch.sha256,
                  verifiedInputPatchStagedSha256:
                    producerInputPatch.stagedSha256,
                }
              : {}),
          });
        },
      });
    } else if (!mergeAlreadyBound) {
      const existingPrompt = await readTextFileIfExists(
        createManifest.promptPath,
      );
      if (existingPrompt !== null && existingPrompt !== promptBody) {
        throw new Error("project_control_existing_prompt_mismatch");
      }
      if (existingPrompt === null) {
        await mkdir(dirname(createManifest.promptPath), {
          recursive: true,
          mode: 0o700,
        });
        await writeFile(createManifest.promptPath, promptBody, {
          encoding: "utf8",
          mode: 0o600,
        });
        promptWritten = true;
      }
      if (preStartAdmission) {
        const prepared = await prepareProjectPreStartAdmission({
          plan: preStartAdmission,
          manifest: createManifest,
          scope: controller.scope,
          ...(producerInputPatch
            ? {
                verifiedInputPatchArtifactSha256: producerInputPatch.sha256,
                verifiedInputPatchStagedSha256: producerInputPatch.stagedSha256,
              }
            : {}),
        });
        admissionCreatedPaths = prepared.createdPaths;
      }
    }
    prompt = await assertReadablePrompt({
      promptPath: createManifest.promptPath,
      expectedBody: promptBody,
    });

    const createBroker = deps.codexProjectControlBroker({
      registryRootDir: controller.registryRootDir,
      controller: controller.controller,
      scope: controller.scope,
      createManifest,
      createOverwrite: booleanValue(args.overwrite) ?? false,
      ...(producerInputPatch
        ? {
            admittedInputPatchTarget: {
              jobId: createManifest.jobId,
              workspacePath: createManifest.workspacePath,
            },
          }
        : {}),
    });
    const createResult = await createOrReuseProjectJob({
      broker: createBroker,
      registryRootDir: controller.registryRootDir,
      scope: controller.scope,
      manifest: createManifest,
      promptBody,
      workerRole: role,
    });
    createJob = createResult.result;
    manifest = createResult.manifest;
    expectedCanonicalWorkspacePath = await projectControlCanonicalWorkspacePath(
      manifest.workspacePath,
      controller.scope,
    );
    if (mergeAlreadyBound || recoveredMergeAlreadyBound) {
      await assertProjectPreStartAdmissionLaunchBinding({
        manifest,
        scope: controller.scope,
        workspaceMode: "clean_explicit_continuation",
      });
      mergeBoundRetryStartRequired =
        await projectMergeBoundRetryStartRequired(manifest);
    } else {
      await validateProjectRefillPreStartAdmission({
        registryRootDir: controller.registryRootDir,
        controllerJobId: controller.controller.jobId,
        scope: controller.scope,
        manifest,
        expectedCanonicalWorkspacePath,
        admittedInputPatch: Boolean(producerInputPatch),
      });
    }
    await rebindTransaction?.commit();
  } catch (error) {
    const cleanupErrors: unknown[] = [];
    try {
      await rebindTransaction?.rollback();
    } catch (cleanupError) {
      cleanupErrors.push(cleanupError);
    }
    try {
      await removeProjectPreStartAdmissionPaths(admissionCreatedPaths);
    } catch (cleanupError) {
      cleanupErrors.push(cleanupError);
    }
    try {
      await removeReviewedOutputAggregateArtifacts(
        aggregateArtifactCreatedPaths,
      );
    } catch (cleanupError) {
      cleanupErrors.push(cleanupError);
    }
    let rolledBack: readonly string[] = [];
    try {
      rolledBack = await rollbackProjectRefillPartial({
        expectedSourceRealPath: createWorktreeInput.expectedSourceRealPath,
        workspacePath: createManifest.workspacePath,
        promptPath: createManifest.promptPath,
        registryRootDir: controller.registryRootDir,
        jobId: createManifest.jobId,
        worktreeCreated,
        promptWritten,
      });
    } catch (cleanupError) {
      cleanupErrors.push(cleanupError);
    }
    if (error instanceof Error && rolledBack.length > 0) {
      error.message = `${error.message}; rollback=${rolledBack.join(",")}`;
    }
    if (cleanupErrors.length > 0) {
      throw new AggregateError(
        [error, ...cleanupErrors],
        "project_control_refill_and_rollback_failed",
      );
    }
    throw error;
  }

  const accountCapacityFacts = await codexGoalAccountCapacityFacts({
    manifest,
    loadLaunch: async (jobManifest) =>
      goalLaunchInput(codexGoalJobToArgs(jobManifest)),
  });
  let start: ProjectControlOperationResult | undefined;
  let accountReservation: CodexProjectAccountReservation | undefined;
  if (
    booleanValue(args.startWorker) !== false &&
    (!(mergeAlreadyBound || recoveredMergeAlreadyBound) ||
      mergeBoundRetryStartRequired)
  ) {
    await assertReadablePrompt({ promptPath: manifest.promptPath });
    const launch = await goalLaunchInput(codexGoalJobToArgs(manifest));
    const started = await withValidatedProjectWorkspaceLock({
      locks: projectControlWorkspaceLocks(controller.registryRootDir),
      scope: controller.scope,
      requestedWorkspacePath: manifest.workspacePath,
      expectedCanonicalWorkspacePath,
      owner: `project-refill-start:${controller.controller.jobId}:${manifest.jobId}`,
      effect: async (workspace) => {
        if (
          (mergeAlreadyBound || recoveredMergeAlreadyBound) &&
          (!(await projectMergeBoundRetryStartRequired(manifest)) ||
            (await projectMergeBoundRetryRunnerAlive(manifest)))
        ) {
          return undefined;
        }
        dependencyPreflight = await runDependencyBootstrap({
          workspacePath: workspace.canonicalWorkspacePath,
          jobRootDir: manifest.jobRootDir,
          cacheNamespace: controller.scope.projectId,
          mode: projectControlDependencyBootstrapMode(args.dependencyBootstrap),
          confirmInstall:
            booleanValue(args.confirmDependencyBootstrap) === true,
        });
        assertProjectControlDependencyBootstrapReady(dependencyPreflight);
        await validateStoredProjectPreStartAdmission({
          manifest,
          scope: controller.scope,
        });
        const canonicalLaunch = {
          ...launch,
          config: {
            ...launch.config,
            workspacePath: workspace.canonicalWorkspacePath,
          },
        };
        const reservedAccount = await reserveCodexProjectAccount({
          manifest,
          launch: canonicalLaunch,
        });
        const reservedLaunch = reservedAccount.launch;
        try {
          const startBroker = deps.codexProjectControlBroker({
            registryRootDir: controller.registryRootDir,
            controller: controller.controller,
            scope: controller.scope,
            startLaunch: reservedLaunch,
            startManifest: manifest,
            ...(mergeRebindExisting ||
            mergeAlreadyBound ||
            recoveredMergeAlreadyBound
              ? {
                  startAdmissionWorkspaceMode:
                    "clean_explicit_continuation" as const,
                }
              : producerInputPatch
                ? {
                    startAdmissionWorkspaceMode:
                      "admitted_input_patch" as const,
                  }
                : {}),
            startWorkspaceLease: workspace,
            startSkipDoctor: booleanValue(args.skipDoctor) ?? false,
          });
          const startResult = await startBroker.startWorker({
            jobId: manifest.jobId,
            registryRoot: controller.registryRootDir,
            workspacePath: manifest.workspacePath,
            ...(reservedLaunch.tmuxSession
              ? { tmuxSession: reservedLaunch.tmuxSession }
              : {}),
            accounts: [reservedAccount.accountId],
            workerRole: role,
            ...(manifest.tags ? { tags: manifest.tags } : {}),
          });
          return {
            start: startResult,
            accountReservation: reservedAccount,
          };
        } catch (error) {
          await releaseCodexProjectAccount({
            manifest,
            launch: reservedLaunch,
            reason: "worker_start_failed",
          });
          throw error;
        }
      },
    });
    start = started?.start;
    accountReservation = started?.accountReservation;
  } else {
    dependencyPreflight = await withValidatedProjectWorkspaceLock({
      locks: projectControlWorkspaceLocks(controller.registryRootDir),
      scope: controller.scope,
      requestedWorkspacePath: manifest.workspacePath,
      expectedCanonicalWorkspacePath,
      owner: `project-refill-bootstrap:${controller.controller.jobId}:${manifest.jobId}`,
      effect: async (workspace) =>
        await runDependencyBootstrap({
          workspacePath: workspace.canonicalWorkspacePath,
          jobRootDir: manifest.jobRootDir,
          cacheNamespace: controller.scope.projectId,
          mode: projectControlDependencyBootstrapMode(args.dependencyBootstrap),
          confirmInstall:
            booleanValue(args.confirmDependencyBootstrap) === true,
        }),
    });
    assertProjectControlDependencyBootstrapReady(dependencyPreflight);
  }

  return {
    ok: true,
    mode: "project_control_refill_worker",
    controllerJobId: controller.controller.jobId,
    registryRootDir: controller.registryRootDir,
    auditPath: projectControlAuditPath(controller.controller),
    workerRole: role,
    targetJobId: manifest.jobId,
    baseBranch,
    ...(sourceRevision.remoteHead
      ? { canonicalRemoteHead: sourceRevision.remoteHead }
      : {}),
    ...(producerHandoff ? { producerHandoff } : {}),
    ...(reviewedOutputAggregate
      ? {
          reviewedOutputAggregate: reviewedOutputAggregateView(
            reviewedOutputAggregate,
          ),
        }
      : {}),
    ...(rejectedReviewedOutput
      ? {
          rejectedReviewedOutput: rejectedReviewedOutputRemediationView(
            rejectedReviewedOutput.snapshot,
          ),
        }
      : {}),
    prompt,
    accountCapacityFacts,
    ...(accountReservation
      ? {
          accountReservation: {
            mode: accountReservation.mode,
            accountId: accountReservation.accountId,
            ...(accountReservation.mode === "exclusive"
              ? {
                  fencingToken: accountReservation.fencingToken,
                  expiresAt: accountReservation.expiresAt,
                }
              : {}),
          },
        }
      : {}),
    dependencyPreflight: dependencyPreflight as unknown as JsonObject,
    jobId: manifest.jobId,
    worktree: worktree as unknown as JsonObject,
    createJob: createJob as unknown as JsonObject,
    ...(start
      ? { start: start as unknown as JsonObject }
      : { startSkipped: true }),
    manifest,
    summary: summarizeCodexGoalJob(manifest, controller.registryRootDir),
  };
}

export async function projectControlPrepareVerifierView(
  args: ProjectControlMcpArgs,
  deps: CodexGoalMcpProjectControlJobsDeps,
): Promise<JsonObject> {
  const producerJobId = stringValue(args.producerJobId);
  const reviewedOutputIds = reviewedOutputIdValues(args.reviewedOutputIds);
  assertVerifierInputSource({
    operationToolName: "codex_goal_project_prepare_verifier",
    producerJobId,
    reviewedOutputIds,
  });
  if (reviewedOutputIds && booleanValue(args.confirmRefill) !== true) {
    const controller = await deps.loadProjectControlController(args);
    const aggregate = await resolveLocalReviewedOutputAggregate({
      registryRootDir: controller.registryRootDir,
      projectId: controller.scope.projectId,
      reviewedOutputIds,
    });
    return {
      ok: false,
      reason: "confirm_refill_required",
      mode: "project_control_prepare_verifier_preview",
      controllerJobId: controller.controller.jobId,
      targetJobId: stringValue(args.jobId),
      requiredInputPatchHash: aggregate.patchSha256,
      reviewedOutputAggregate: reviewedOutputAggregateView(aggregate),
      requiredConfirmation: "confirmRefill",
    };
  }
  if (args.preStartAdmission === undefined) {
    throw new Error("project_control_verifier_pre_start_admission_required");
  }
  const requestedRole = stringValue(args.workerRole) ?? "reviewer";
  if (requestedRole !== "reviewer" && requestedRole !== "fastgate") {
    throw new Error("project_control_verifier_role_required");
  }
  const result = await projectControlRefillWorkerView(
    {
      ...args,
      workerRole: requestedRole,
      requireCanonicalRemoteHead: true,
    },
    deps,
    "codex_goal_project_prepare_verifier",
  );
  return {
    ...result,
    mode: "project_control_prepare_verifier",
  };
}

function reviewedOutputIdValues(value: unknown): readonly string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error("reviewed_output_aggregate_ids_invalid");
  }
  return value;
}

function assertVerifierInputSource(input: {
  readonly operationToolName: ProjectControlOperationToolName;
  readonly producerJobId: string | undefined;
  readonly reviewedOutputIds: readonly string[] | undefined;
}): void {
  if (input.operationToolName !== "codex_goal_project_prepare_verifier") {
    if (input.reviewedOutputIds) {
      throw new Error(
        "project_control_reviewed_output_aggregate_verifier_only",
      );
    }
    return;
  }
  if (input.producerJobId && input.reviewedOutputIds) {
    throw new Error("project_control_verifier_input_source_conflict");
  }
  if (!input.producerJobId && !input.reviewedOutputIds) {
    throw new Error("project_control_verifier_input_source_required");
  }
}

async function resolveLocalReviewedOutputAggregate(input: {
  readonly registryRootDir: string;
  readonly projectId: string;
  readonly reviewedOutputIds: readonly string[];
  readonly expectedBaseCommit?: string;
}): Promise<ReviewedOutputAggregate> {
  const store = new LocalReviewedWorkerOutputStore({
    rootDir: reviewedWorkerOutputRoot(input.registryRootDir),
  });
  return await resolveReviewedOutputAggregate(
    {
      store,
      readPatch: async (snapshot) => await store.readPatch(snapshot),
    },
    {
      projectId: input.projectId,
      reviewedOutputIds: input.reviewedOutputIds,
      ...(input.expectedBaseCommit
        ? { expectedBaseCommit: input.expectedBaseCommit }
        : {}),
    },
  );
}

async function materializeReviewedOutputAggregateArtifacts(input: {
  readonly jobRootDir: string;
  readonly aggregate: ReviewedOutputAggregate;
}): Promise<{
  readonly patchPath: string;
  readonly provenancePath: string;
  readonly createdPaths: readonly string[];
}> {
  const requestedJobRootParent = dirname(input.jobRootDir);
  const jobRootParentItem = await lstat(requestedJobRootParent);
  if (jobRootParentItem.isSymbolicLink() || !jobRootParentItem.isDirectory()) {
    throw new Error("reviewed_output_aggregate_artifact_root_unsafe");
  }
  const canonicalJobRootParent = await realpath(requestedJobRootParent);
  const requestedJobRoot = join(
    canonicalJobRootParent,
    basename(input.jobRootDir),
  );
  await mkdir(requestedJobRoot, { recursive: true, mode: 0o700 });
  const jobRootItem = await lstat(requestedJobRoot);
  if (jobRootItem.isSymbolicLink() || !jobRootItem.isDirectory()) {
    throw new Error("reviewed_output_aggregate_artifact_root_unsafe");
  }
  const canonicalJobRoot = await realpath(requestedJobRoot);
  if (dirname(canonicalJobRoot) !== canonicalJobRootParent) {
    throw new Error("reviewed_output_aggregate_artifact_root_unsafe");
  }
  const root = join(canonicalJobRoot, "reviewed-output-aggregate");
  await mkdir(root, { recursive: true, mode: 0o700 });
  const rootItem = await lstat(root);
  if (rootItem.isSymbolicLink() || !rootItem.isDirectory()) {
    throw new Error("reviewed_output_aggregate_artifact_root_unsafe");
  }
  const canonicalRoot = await realpath(root);
  if (dirname(canonicalRoot) !== canonicalJobRoot) {
    throw new Error("reviewed_output_aggregate_artifact_root_unsafe");
  }
  const patchPath = join(canonicalRoot, "input.patch");
  const provenancePath = join(canonicalRoot, "provenance.json");
  const createdPaths: string[] = [];
  try {
    const patchArtifact = await publishImmutableTextArtifact({
      path: patchPath,
      content: input.aggregate.patch,
      existingPathUnsafeError: "reviewed_output_aggregate_artifact_unsafe",
      contentMismatchError: "reviewed_output_aggregate_immutable_conflict",
    });
    if (patchArtifact.created) {
      createdPaths.push(patchPath);
    }
    const provenance = `${JSON.stringify(
      reviewedOutputAggregateView(input.aggregate),
      null,
      2,
    )}\n`;
    const provenanceArtifact = await publishImmutableTextArtifact({
      path: provenancePath,
      content: provenance,
      existingPathUnsafeError: "reviewed_output_aggregate_artifact_unsafe",
      contentMismatchError: "reviewed_output_aggregate_immutable_conflict",
    });
    if (provenanceArtifact.created) {
      createdPaths.push(provenancePath);
    }
    return { patchPath, provenancePath, createdPaths };
  } catch (error) {
    await removeReviewedOutputAggregateArtifacts(createdPaths);
    throw error;
  }
}

async function removeReviewedOutputAggregateArtifacts(
  paths: readonly string[],
): Promise<void> {
  for (const path of [...paths].reverse()) await rm(path, { force: true });
  const root = paths[0] ? dirname(paths[0]) : undefined;
  if (root) await rmdir(root).catch(() => undefined);
}

async function projectMergeRebindExistingJob(input: {
  readonly registryRootDir: string;
  readonly expected: CodexGoalJobManifestInput;
}): Promise<CodexGoalJobManifest | undefined> {
  let existing: CodexGoalJobManifest;
  try {
    existing = await readCodexGoalJob({
      registryRootDir: input.registryRootDir,
      jobId: input.expected.jobId,
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return undefined;
    }
    throw error;
  }
  if (await readExistingProjectMergeBinding(existing.jobRootDir)) {
    if (
      !(await projectRefillLaunchArtifactTransactionPending(
        existing.jobRootDir,
      ))
    ) {
      return undefined;
    }
  }
  const mismatches = projectRefillJobMismatches(existing, input.expected);
  if (mismatches.length > 0) {
    throw new Error(
      `project_control_merge_rebind_existing_job_mismatch:${mismatches.join(",")}`,
    );
  }
  return existing;
}

async function projectExactExistingMergeBoundJob(input: {
  readonly registryRootDir: string;
  readonly expected: CodexGoalJobManifestInput;
}): Promise<CodexGoalJobManifest | undefined> {
  let existing: CodexGoalJobManifest;
  try {
    existing = await readCodexGoalJob({
      registryRootDir: input.registryRootDir,
      jobId: input.expected.jobId,
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return undefined;
    }
    throw error;
  }
  if (!(await readExistingProjectMergeBinding(existing.jobRootDir))) {
    return undefined;
  }
  const mismatches = projectRefillJobMismatches(existing, input.expected);
  if (mismatches.length > 0) {
    throw new Error(
      `project_control_merge_rebind_existing_job_mismatch:${mismatches.join(",")}`,
    );
  }
  return existing;
}

export async function projectMergeBoundRetryStartRequired(
  manifest: CodexGoalJobManifest,
): Promise<boolean> {
  const receiptPath = manifest.projectPreStartAdmission?.receiptPath;
  if (!receiptPath) {
    throw new Error("project_control_merge_rebind_existing_admission_required");
  }
  let receipt: unknown;
  try {
    const body = await readFile(receiptPath);
    if (body.byteLength > 64 * 1024) throw new Error("size_limit_exceeded");
    receipt = JSON.parse(body.toString("utf8"));
  } catch {
    throw new Error("project_control_pre_start_receipt_invalid");
  }
  if (
    typeof receipt !== "object" ||
    receipt === null ||
    Array.isArray(receipt)
  ) {
    throw new Error("project_control_pre_start_receipt_invalid");
  }
  const status = (receipt as Readonly<Record<string, unknown>>).status;
  if (status === "validated_not_launched") return true;
  if (status === "launch_authorized") return false;
  throw new Error("project_control_pre_start_receipt_invalid");
}

async function projectMergeBoundRetryRunnerAlive(
  manifest: CodexGoalJobManifest,
): Promise<boolean> {
  const launch = await goalLaunchInput(codexGoalJobToArgs(manifest));
  const status = await collectCodexGoalStatus(
    codexGoalStatusInputFromLaunch(launch),
  );
  const progressStale =
    status.progressHeartbeatAgeMs !== undefined &&
    status.progressHeartbeatAgeMs > 10 * 60_000;
  return (
    status.tmuxAlive === true ||
    status.progressProcessAlive === true ||
    resolveCodexGoalWorkerLiveness({ status, progressStale }).alive
  );
}

const terminalMergeRebindResultStatuses = new Set([
  "done",
  "blocked",
  "failed",
  "partial",
]);

async function assertTerminalCleanProjectMergeRebind(input: {
  readonly manifest: CodexGoalJobManifest;
  readonly scope: ProjectAccessScope;
}): Promise<void> {
  const launch = await goalLaunchInput(codexGoalJobToArgs(input.manifest));
  const status = await collectCodexGoalStatus(
    codexGoalStatusInputFromLaunch(launch),
  );
  const progressStale =
    status.progressHeartbeatAgeMs !== undefined &&
    status.progressHeartbeatAgeMs > 10 * 60_000;
  const strictTerminalResult = status.resultPath
    ? await isStrictTerminalMergeRebindResult(status.resultPath)
    : false;
  assertProjectMergeRebindRuntimeState({
    status,
    progressStale,
    strictTerminalResult,
  });
  await assertProjectPreStartAdmissionLaunchBinding({
    manifest: input.manifest,
    scope: input.scope,
    workspaceMode: "clean_explicit_continuation",
  });
}

export function assertProjectMergeRebindRuntimeState(input: {
  readonly status: CodexGoalStatus;
  readonly progressStale: boolean;
  readonly strictTerminalResult: boolean;
}): void {
  if (
    input.status.tmuxAlive === true ||
    input.status.progressProcessAlive === true ||
    resolveCodexGoalWorkerLiveness({
      status: input.status,
      progressStale: input.progressStale,
    }).alive
  ) {
    throw new Error("project_control_merge_rebind_worker_still_running");
  }
  if (!input.strictTerminalResult) {
    throw new Error("project_control_merge_rebind_terminal_result_required");
  }
  if (input.status.workspaceDirty !== false) {
    throw new Error("project_control_merge_rebind_clean_workspace_required");
  }
}

async function isStrictTerminalMergeRebindResult(
  path: string,
): Promise<boolean> {
  let value: unknown;
  try {
    value = JSON.parse(await readFile(path, "utf8"));
  } catch {
    return false;
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const result = value as Readonly<Record<string, unknown>>;
  return (
    terminalMergeRebindResultStatuses.has(
      typeof result.status === "string" ? result.status : "",
    ) &&
    stringArray(result.changedFiles) &&
    stringArray(result.evidence) &&
    stringArray(result.blockers) &&
    new Set([
      "wait",
      "wait_with_limit",
      "continue",
      "recover",
      "stop",
      "preserve_patch",
      "switch_account",
      "ask_user",
      "launch_next_slice",
      "review_completed",
    ]).has(typeof result.nextAction === "string" ? result.nextAction : "")
  );
}

function stringArray(value: unknown): value is readonly string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

async function resolveProducerHandoffForVerifier(input: {
  readonly registryRootDir: string;
  readonly producerJobId: string;
  readonly expectedInputPatchHash: unknown;
  readonly allowProviderOutputInvalid: boolean;
}): Promise<VerifiedProducerHandoff> {
  const producer = await readCodexGoalJob({
    registryRootDir: input.registryRootDir,
    jobId: input.producerJobId,
  });
  const launch = await goalLaunchInput(codexGoalJobToArgs(producer));
  const initialStatus = await collectCodexGoalStatus(
    codexGoalStatusInputFromLaunch(launch),
  );
  const status = await ensureTerminalCodexGoalHandoffArtifacts({
    launch,
    status: initialStatus,
  });
  if (resolveCodexGoalWorkerLiveness({ status }).alive) {
    throw new Error("project_control_verifier_producer_still_running");
  }
  const handoff = input.allowProviderOutputInvalid
    ? await readVerifiableProducerHandoff({ producer })
    : await readVerifiedProducerHandoff({ producer });
  if (
    typeof input.expectedInputPatchHash !== "string" ||
    input.expectedInputPatchHash.toLowerCase() !== handoff.patchSha256
  ) {
    throw new Error("project_control_verifier_admission_patch_hash_mismatch");
  }
  return handoff;
}

async function projectControlRefillWorkerBoundedView(
  args: ProjectControlMcpArgs,
  deps: CodexGoalMcpProjectControlJobsDeps,
  operationToolName: ProjectControlOperationToolName,
): Promise<JsonObject> {
  const controller = await deps.loadProjectControlController(args);
  if (args.projectAccessScope !== undefined) {
    throw new Error("project_control_child_scope_is_controller_owned");
  }
  if (args.allowDangerFullAccess === true) {
    throw new Error("project_control_child_danger_full_access_denied");
  }
  if (!args.confirmRefill) {
    return {
      ok: false,
      reason: "confirm_refill_required",
      mode: "project_control_refill_worker_operation_preview",
      executionMode: "bounded",
      controllerJobId: controller.controller.jobId,
      auditPath: projectControlAuditPath(controller.controller),
      requiredConfirmation: "confirmRefill",
    };
  }
  requiredRawString(args.promptBody, "promptBody");
  const sourceWorkspacePath = projectControlPathArg(
    args,
    args.sourceWorkspacePath,
    "sourceWorkspacePath",
  );
  const requested = projectControlChildManifestInput({
    args: args as JobCreateMcpArgs,
    scope: controller.scope,
    registryRootDir: controller.registryRootDir,
  });
  if (
    requested.accessBoundary === AccessBoundary.ProjectScopedControl ||
    requested.accessBoundary === AccessBoundary.DangerFullAccess
  ) {
    throw new Error("project_control_child_boundary_denied");
  }
  const createManifest: CodexGoalJobManifestInput = {
    ...requested,
    accessBoundary:
      requested.accessBoundary ?? AccessBoundary.IsolatedWorkspaceWrite,
    projectAccessScope: projectControlChildScope(
      controller.scope,
      requested.workspacePath,
    ),
    allowDangerFullAccess: false,
    networkAccess: requested.networkAccess ?? NetworkAccessMode.Restricted,
  };
  const mergeBinding = parseProjectMergeBindingRequest({
    value: args.mergeBinding,
    admission: args.preStartAdmission,
    requireCanonicalRemoteHead:
      booleanValue(args.requireCanonicalRemoteHead) === true,
    expectedSourceCommit: args.expectedSourceCommit,
  });
  // Dynamic merge revisions are resolved by the immutable sync operation. The
  // bounded wrapper cannot materialize that contract before it has pinned both
  // remote heads, so it validates only the request shape here.
  const preStartAdmission = mergeBinding
    ? undefined
    : planProjectPreStartAdmission({
        value: args.preStartAdmission,
        confirmed: booleanValue(args.confirmPreStartAdmission) === true,
        scope: controller.scope,
        manifest: createManifest,
      });
  if (
    operationToolName === "codex_goal_project_refill_worker" &&
    !mergeBinding
  ) {
    assertProjectRefillInputPatchSource({
      contract: preStartAdmission?.contract,
      producerJobId: stringValue(args.producerJobId),
      reviewedOutputId: stringValue(args.reviewedOutputId),
      workerRole: projectControlWorkerRole(args.workerRole),
    });
  }
  assertProjectControlCreateManifestPaths({
    scope: controller.scope,
    registryRootDir: controller.registryRootDir,
    manifest: createManifest,
  });
  if (preStartAdmission) {
    const baseBranch = stringValue(args.baseBranch) ?? "origin/main";
    assertSafeGitRefName(baseBranch, "baseBranch");
    const sourceRef = stringValue(args.sourceRef);
    if (sourceRef) assertSafeGitRefName(sourceRef, "sourceRef");
    const expectedSourceCommit = stringValue(args.expectedSourceCommit);
    const newBranch = stringValue(args.newBranch);
    if (newBranch) assertSafeGitRefName(newBranch, "newBranch");
    const realSourceWorkspacePath =
      await projectControlRealPathOutsideWorkspaceScope(
        sourceWorkspacePath,
        controller.scope,
      );
    const realPath = await projectControlRealPathOutsideWorkspaceScope(
      requested.workspacePath,
      controller.scope,
    );
    const resolverBroker = deps.codexProjectControlBroker({
      registryRootDir: controller.registryRootDir,
      controller: controller.controller,
      scope: controller.scope,
    });
    const canonicalSourceWorkspacePath =
      booleanValue(args.requireCanonicalRemoteHead) === true
        ? await projectControlCanonicalWorkspacePath(
            sourceWorkspacePath,
            controller.scope,
          )
        : undefined;
    const requestedWorktreeAccessInput = {
      sourceWorkspacePath,
      ...(realSourceWorkspacePath ? { realSourceWorkspacePath } : {}),
      path: requested.workspacePath,
      ...(realPath ? { realPath } : {}),
      baseBranch,
      ...(sourceRef ? { sourceRef } : {}),
      ...(newBranch ? { newBranch } : {}),
    };
    const sourceReference = resolveProjectSourceReference({
      requestedRef: canonicalSourceWorkspacePath
        ? baseBranch
        : (sourceRef ?? baseBranch),
      scope: controller.scope,
      remoteVerificationRequired:
        canonicalSourceWorkspacePath !== undefined ||
        expectedSourceCommit !== undefined,
    });
    const worktreeAccessInput = sourceReference.remoteVerified
      ? {
          ...requestedWorktreeAccessInput,
          sourceRef: sourceReference.worktreeSourceRef,
        }
      : requestedWorktreeAccessInput;
    const resolvedSource =
      await resolverBroker.resolveWorktreeRevision(worktreeAccessInput);
    const sourceRevision = await resolveProjectSourceRevision({
      resolvedSource,
      remoteTrackingRef: sourceReference.remoteTrackingRef,
      scope: controller.scope,
      ...(expectedSourceCommit ? { expectedSourceCommit } : {}),
      requireRemoteHead: canonicalSourceWorkspacePath !== undefined,
    });
    assertProjectPreStartAdmissionSourceRevision({
      plan: preStartAdmission,
      sourceRevision: sourceRevision.revision,
    });
  }
  const operationArgs = {
    ...jsonRecordFromProjectControlArgs(args),
    executionMode: "sync",
    confirmRefill: true,
  } satisfies ProjectControlOperationJsonRecord;
  const operationsRootDir = projectControlOperationsRoot(
    controller.controller.jobRootDir,
  );
  const creation = await createOrReuseProjectControlOperation({
    operationsRootDir,
    controllerJobId: controller.controller.jobId,
    toolName: operationToolName,
    args: operationArgs,
    targetJobId: createManifest.jobId,
  });
  if (!creation.created) {
    const existing = creation.operation;
    return {
      ok: true,
      mode: "project_control_refill_worker_operation_started",
      executionMode: "bounded",
      controllerJobId: controller.controller.jobId,
      registryRootDir: controller.registryRootDir,
      auditPath: projectControlAuditPath(controller.controller),
      operationId: existing.operationId,
      operationStatusTool: "codex_goal_project_operation_status",
      operationStatusArgs: {
        registryRootDir: controller.registryRootDir,
        controllerJobId: controller.controller.jobId,
        operationId: existing.operationId,
      },
      targetJobId: createManifest.jobId,
      ...(existing.runner ? { runnerPid: existing.runner.pid } : {}),
      operation: projectControlOperationView({ operation: existing }),
    };
  }
  const operation = creation.operation;
  const runner = await startProjectControlOperationRunner({
    operationFilePath: operation.operationFilePath,
    cwd: controller.controller.workspacePath,
  });
  const updated = await updateProjectControlOperation({
    operationFilePath: operation.operationFilePath,
    update: (current) =>
      current.status === ProjectControlOperationStatus.Queued &&
      current.runner === undefined
        ? {
            runner: {
              hostname: hostname(),
              pid: runner.pid,
              command: runner.command,
              startedAt: new Date().toISOString(),
            },
          }
        : {},
  });
  return {
    ok: true,
    mode: "project_control_refill_worker_operation_started",
    executionMode: "bounded",
    controllerJobId: controller.controller.jobId,
    registryRootDir: controller.registryRootDir,
    auditPath: projectControlAuditPath(controller.controller),
    operationId: updated.operationId,
    operationStatusTool: "codex_goal_project_operation_status",
    operationStatusArgs: {
      registryRootDir: controller.registryRootDir,
      controllerJobId: controller.controller.jobId,
      operationId: updated.operationId,
    },
    targetJobId: createManifest.jobId,
    runnerPid: runner.pid,
    operation: projectControlOperationView({ operation: updated }),
  };
}

export async function projectControlOperationStatusView(
  args: ProjectControlMcpArgs,
  deps: CodexGoalMcpProjectControlJobsDeps,
): Promise<JsonObject> {
  const controller = await deps.loadProjectControlController(args);
  const operationId = requiredRawString(args.operationId, "operationId");
  const operation = await readProjectControlOperationById({
    operationsRootDir: projectControlOperationsRoot(
      controller.controller.jobRootDir,
    ),
    operationId,
  });
  return {
    ok: true,
    mode: "project_control_operation_status",
    controllerJobId: controller.controller.jobId,
    registryRootDir: controller.registryRootDir,
    operation: projectControlOperationView({
      operation,
      includeResult: booleanValue(args.includeResult) === true,
    }),
  };
}

export async function projectControlRecoverOperationsView(
  args: ProjectControlMcpArgs,
  deps: CodexGoalMcpProjectControlJobsDeps,
): Promise<JsonObject> {
  const controller = await deps.loadProjectControlController(args);
  if (booleanValue(args.confirmRecoverOperations) !== true) {
    return {
      ok: false,
      reason: "confirm_recover_operations_required",
      mode: "project_control_recover_operations",
      controllerJobId: controller.controller.jobId,
      registryRootDir: controller.registryRootDir,
    };
  }
  const summary = await recoverProjectControlOperations({
    operationsRootDir: projectControlOperationsRoot(
      controller.controller.jobRootDir,
    ),
    invokeTool: async (toolName, operationArgs) => {
      if (toolName === "codex_goal_project_prepare_verifier") {
        return projectControlPrepareVerifierView(
          operationArgs as ProjectControlMcpArgs,
          deps,
        );
      }
      if (toolName === "codex_goal_project_refill_worker") {
        return projectControlRefillWorkerView(
          operationArgs as ProjectControlMcpArgs,
          deps,
        );
      }
      throw new Error("project_control_operation_tool_invalid");
    },
  });
  return {
    ok: summary.failed === 0 && summary.invalid === 0,
    mode: "project_control_recover_operations",
    controllerJobId: controller.controller.jobId,
    registryRootDir: controller.registryRootDir,
    scanned: summary.scanned,
    attempted: summary.attempted,
    recovered: summary.recovered,
    reconciled: summary.reconciled,
    alreadyRunning: summary.alreadyRunning,
    terminal: summary.terminal,
    failed: summary.failed,
    invalid: summary.invalid,
    operations: summary.results.map((result) => ({
      ok: result.ok,
      disposition: result.disposition,
      operation: projectControlOperationView({ operation: result.operation }),
    })),
  };
}

function jsonRecordFromProjectControlArgs(
  args: ProjectControlMcpArgs,
): ProjectControlOperationJsonRecord {
  return JSON.parse(JSON.stringify(args)) as ProjectControlOperationJsonRecord;
}

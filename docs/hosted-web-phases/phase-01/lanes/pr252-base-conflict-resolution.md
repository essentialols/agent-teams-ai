# PR #252 semantic five-path conflict remediation lane

## Authority and provenance

- Phase/node: `phase-01` / `PR252-semantic-conflict-remediation`
- Lane ID: `pr252-semantic-conflict-remediation`
- Packet revision: `phase-01-pr252-semantic-conflict-remediation-router-r2`
- Durable controller: `controller-v17`; replacement or restart is not authorized
- Worker admission/integration owner: `ProjectScopedControl`
- Producer start: `codex_goal_project_refill_worker` with `workerRole: producer`
- Reviewer start: `codex_goal_project_prepare_verifier` with `workerRole: reviewer` and strict
  contract `reviewKind: review`
- Fixed `baseSha`: `7c502f45df32b58bbc161b26dcc28df8a17107c9`
- Merge source:
  `origin/refactor/team-provisioning-round2-reapply@7afc908ce92f14b4b0ebd06cc4aa3a4cf33807d0`
- Capacity after router acceptance/integration/push: exactly one producer followed by exactly one
  fresh independent reviewer
- Producer and reviewer: reasoning effort `xhigh`, service tier `default`, Fast forbidden
- Terminal state for this docs router and for the future producer: `HOLD`

The r2 packet is a clean correction. Semantic router r1 patch
`95dcdae236fdadbd63bfb3022441accc4354cffdc5ca6db7447e7a01e9d53221` was rejected because its
future launch contract was invalid. The rejection was consumed by
`pr252-semantic-router-r1-contract-reject-consume-v1`. Never integrate, reuse, continue, inspect, or
derive implementation input from that job.

The earlier byte-copy producer patch
`a0fade213fd86c52022f944c9d3a9f169175f1fd5a54f6c19652173ae5307304` and its independent review
also remain `REJECT`. Preserve their provenance, but never reuse their bytes, materialization, review,
or job. The first authorized semantic implementation is clean:
`inputPatchHash=null`, `revision=0`, `retryCount=0`, and `supersedes=null`.

P1.1D's accepted/pushed commit `e7e7e734c82c49105682e7a19bbedafa1f5ddbad` remains immutable
historical provenance. It is not the current target and is not work to rerun.

## Post-push target resolution

No product worker may start until this exact seven-path router has independent `ACCEPT`, has been
integrated, and has been pushed. Only then does `ProjectScopedControl` resolve the accepted pushed
router commit exactly once and store the resulting full 40-character SHA.

That stored SHA is the only legal value for producer `canonicalSha` and `phaseStartSha`, outer
`sourceRef` and `baseBranch`, producer worktree `HEAD`, reviewer target/materialization,
`mark_reviewed` target, integration target, and the true merge's first parent. `baseSha` stays
`7c502f45df32b58bbc161b26dcc28df8a17107c9`. A placeholder, binding object in a rendered request,
second resolution, unequal field, stale worktree, or canonical drift fails closed.

Merge source and plan/materialization metadata remain outside the strict worker contract. The
controller packet's one launch template is the sole renderer authority. It must render one fully
concrete request and reject missing, extra, symbolic, or drifting values.

The rendered `requiredChecks` value is exactly the seven strict `{id,cwd,command}` references, not
the separate human-readable gate list. Every object has no fourth key, uses `cwd="src"`, and prefixes
its command with `cd .. && `. Rendered `executionPolicy` has exactly `mode`, a fully concrete
isolated `sandboxRoot`, and the fixed nonempty `forbiddenRealProjects` list. Extended network,
runtime, Fast, writer, and Git safety flags are enforced outside the strict contract. A string check,
extra policy key, or unresolved binding/copy directive fails closed.

## Exact mandatory reads

Read only these documents, in order, before reading the five owned paths at the stored target and
pinned source commits. Directory reads, globs, implicit siblings, recursive documentation/research
reads, and rejected-job reads are not authorized:

1. `AGENTS.md`
2. `docs/hosted-web-phases/START_HERE.md`
3. `docs/hosted-web-phases/EVIDENCE_LIFECYCLE.md`
4. `docs/hosted-web-phases/README.md`
5. `docs/hosted-web-phases/EXECUTION_INDEX.json`
6. `docs/hosted-web-phases/phase-01/controller-packet.md`
7. `docs/hosted-web-phases/phase-01/lanes/pr252-base-conflict-resolution.md`
8. `CLAUDE.md`
9. `AGENT_CRITICAL_GUARDRAILS.md`
10. `docs/hosted-web-phases/PACKET_STANDARD.md`

All mandatory documents and both Git identities are read-only to the producer. The producer must not
fetch, advance a branch, or substitute a remote-tracking ref if a pinned object is unavailable.

## Exact exclusive producer scope

The following ordered list is the complete `ownedPaths` collection and the complete legal merge
conflict set:

1. `src/features/task-board-commands/core/application/TaskBoardCommandFacade.ts`
2. `src/main/services/team/TeamDataService.ts`
3. `src/renderer/components/team/TeamDetailView.tsx`
4. `test/features/task-board-commands/TaskBoardCommands.e2e.test.ts`
5. `test/main/services/team/TeamDataService.test.ts`

Every other tracked or untracked path is read-only. There is no handoff, evidence, research,
configuration, package, lockfile, runtime, orchestration, or generated path in the writer set. The
runtime captures the exact five-path diff as the immutable producer output.

## Semantic resolution contract

The producer must reconcile the stored target and pinned source intent path by path. It may edit
conflicting hunks and the minimum coherent surrounding code; it must never replace a complete file
with the pinned source blob or reproduce the rejected byte-copy patch.

The result must satisfy all of these invariants:

1. Preserve the target task-board public/API shape and target behavior that is not directly in
   conflict.
2. Make the facade destination's `reconcile` method optional. When the capability exists, use it;
   otherwise use `findById` plus validation. A present task with mismatched provenance is a terminal
   conflict. A failed create whose outcome cannot be established remains unknown and must never be
   returned or recorded as success.
3. In `TeamDataService`, capability-detect `reconcileTaskCreation` with a narrow runtime guard and
   include the facade destination port only when the guarded function exists. Absence of that
   controller capability must not disable an otherwise available durable facade/get-by-id path.
4. Keep derived `projectPath` outside the hashed durable command payload, add it only at destination
   creation, and filter, sort, and dedupe `blockedBy` and `related` before hashing.
5. Implement one dual-signature async `TeamDetailView` adapter compatible both before and after the
   true merge: accept the target positional `CreateTaskDialog` arguments and the source
   request-object Promise callback. Preserve stable command identity across retries of an unchanged
   positional request, and preserve an incoming request object's `request.command` exactly.
6. Retain the target TaskBoard E2E suite's four cases and port the pinned source's five cases for
   exactly nine total. The test adapter must not make an unguarded call to a real controller's
   `reconcileTaskCreation`; capability absence must exercise the facade's fallback safely.
7. Preserve recovery after partial creation, relationship-backlink reconciliation when capability is
   present, stable payload construction, edited-task reconciliation, and terminal scope/provenance
   conflicts.
8. Leave no conflict marker, duplicate branch implementation, unreachable compatibility shim,
   widened writer scope, or source-only API mismatch.

Choosing one side wholesale, byte-copying a complete blob, deleting target-only behavior, omitting
the capability-aware reconciliation path, requiring a source-only controller method, inventing
success for an unknown outcome, or implementing only one callback signature is an automatic
rejection.

## Producer procedure and immutable output

The producer must:

1. receive the one fully concrete rendered request defined by the controller packet;
2. prove `canonicalSha`, `phaseStartSha`, outer `sourceRef`, outer `baseBranch`, and worktree `HEAD`
   all equal the stored accepted pushed router target, while `baseSha` equals the fixed base;
3. prove the first-attempt metadata is exactly `inputPatchHash=null`, `revision=0`, `retryCount=0`,
   and `supersedes=null`;
4. prove the merge source commit is exactly the pinned identity without fetching or moving a ref;
5. resolve all five paths semantically under the invariants above;
6. prove the worktree diff contains exactly the five owned paths and the Git index is empty;
7. run every required check below;
8. perform a complete self-review with explicit P0/P1/P2 counts; and
9. return one runtime-owned immutable output with `nextAction: "integration-review"` and terminal
   state `HOLD`.

The output binds the stored target SHA, fixed `baseSha`, pinned source identity, clean-attempt
metadata, ordered ownership, exact diff, semantic-invariant evidence, check results, typecheck
classification, safety classifications, and proof of no stage/merge/commit/push. The producer does
not launch its reviewer or authorize its own integration.

## Required checks

Run each command independently from the producer worktree and rerun it from the independent review
worktree after the runtime materializes the immutable output:

```bash
git diff --cached --quiet
pnpm exec vitest run test/features/task-board-commands/TaskBoardCommands.e2e.test.ts
pnpm exec vitest run test/main/services/team/TeamDataService.test.ts
pnpm typecheck
pnpm lint:fast:files -- src/features/task-board-commands/core/application/TaskBoardCommandFacade.ts src/main/services/team/TeamDataService.ts src/renderer/components/team/TeamDetailView.tsx test/features/task-board-commands/TaskBoardCommands.e2e.test.ts test/main/services/team/TeamDataService.test.ts
pnpm exec prettier --check src/features/task-board-commands/core/application/TaskBoardCommandFacade.ts src/main/services/team/TeamDataService.ts src/renderer/components/team/TeamDetailView.tsx test/features/task-board-commands/TaskBoardCommands.e2e.test.ts test/main/services/team/TeamDataService.test.ts
git diff --check
```

The two focused suites, including exactly nine TaskBoard E2E cases (four retained target plus five
ported source), empty-index check, lint, Prettier, and diff check must be green. The
typecheck-classification gate is green only when `pnpm typecheck` reports exactly these inherited
seven Phase 0 diagnostics and nothing else:

- `test/architecture/hosted-web/phase-0/auth-artifacts/auth-artifacts-spike.test.ts`: TS7016 at
  25:8; TS7031 at 66:31; TS18046 at 117:68; TS7031 at 413:48; TS7031 at 733:10;
- `test/architecture/hosted-web/phase-0/host-primitives/evidence-scanner.test.ts`: TS7016 at 12:8;
  and
- `test/architecture/hosted-web/phase-0/provider-runtime/scan-runtime-surfaces.test.ts`: TS2352 at
  162:44.

Any added, removed, moved, or changed diagnostic, or any diagnostic in an owned path, fails the
lane. The producer and reviewer must additionally run and pass these exact-scope gates:

- exact five-path diff and ownership proof, with no sixth tracked or untracked changed path;
- semantic diff review proving no complete source blob was byte-copied;
- conflict-marker scan over exactly the five owned paths;
- credential/secret/auth/provider-value and private/user/real-project-path scan over exactly the
  five paths, with every match classified and no unsafe value;
- textual/non-binary scan over exactly the five paths; and
- proof that the index remains empty and no fetch, app/runtime/team launch, real-project access,
  stage, merge, commit, or push occurred.

Fast remains forbidden; the required command named `lint:fast:files` is the repository's exact
bounded lint command and does not authorize Fast worker mode.

The source-added non-conflict path
`test/renderer/utils/createTaskCommandIdentity.test.ts` is not a producer-owned path and is not
available in the pre-merge producer/reviewer materialization. After `ProjectScopedControl`
materializes the pinned source's non-conflict paths for the true merge, final-merge validation must
additionally run exactly:

```bash
pnpm exec vitest run test/renderer/utils/createTaskCommandIdentity.test.ts
```

The command must pass without adding that path to producer ownership or accepting any producer edit
to it.

## Independent architecture/integration review

After the producer returns `HOLD`, `ProjectScopedControl` may invoke
`codex_goal_project_prepare_verifier` exactly once for a fresh independent reviewer. The launch uses
`workerRole: reviewer`, reasoning effort `xhigh`, service tier `default`, and Fast forbidden. Its
strict contract has exactly the controller packet's 18 keys, uses `reviewKind: review`, binds
`inputPatchHash` to the SHA-256 of the single immutable producer output, and copies the no-write
reviewer execution policy. The verifier request must be fully concrete and fail closed on a binding
object, placeholder, missing or extra key, or drift. Architecture/integration describes reviewer
purpose only, not the runtime `reviewKind`.

The reviewer must be independent of the router author, semantic producer, rejected semantic router
r1 job, rejected byte-copy producer/reviewer, and every P1.1D producer/reviewer.

The reviewer has no repository writer, repair, refill, stage, merge, commit, or push authority and
may not re-resolve the target. It materializes the immutable output against the stored accepted
router target, proves all target fields and worktree `HEAD` still equal that SHA and current
canonical, reruns every required check and scan, and returns exactly one `ACCEPT` or `REJECT` with
complete P0/P1/P2 findings. `ACCEPT` is legal only with P0/P1/P2 `0/0/0` and complete green evidence.

## Reviewed integration

Only after reviewer `ACCEPT`, `ProjectScopedControl` may bind the immutable reviewed output to:

- the stored accepted pushed router target as reviewer, `mark_reviewed`, integration target, and
  first parent;
- `origin/refactor/team-provisioning-round2-reapply` at pinned commit
  `7afc908ce92f14b4b0ebd06cc4aa3a4cf33807d0` as merge source and second parent; and
- the exact five-path semantic resolution and check evidence.

It must create a true merge with ordered parents `[stored accepted router target,
7afc908ce92f14b4b0ebd06cc4aa3a4cf33807d0]`, prove the complete conflict set is exactly the five
owned paths, materialize the pinned source's non-conflict paths, apply only the accepted semantic
output to the five conflicts, rerun all producer/reviewer gates on that final shape, run the
additional command-identity test, create a conventional commit, and push it. A squash, patch-only or
one-parent commit, reversed parents, moving source, canonical drift, placeholder, extra conflict,
byte-copy result, missing final-only test, or gate failure is rejected and not pushed.

## Stop conditions and HOLD

Stop on router not accepted/integrated/pushed, wrong or multiply resolved target, rejected-job access
or reuse, non-clean first attempt, unavailable pinned source, controller drift, second
producer/reviewer, Fast mode, non-default tier, non-xhigh reasoning, extra/missing path, staged file,
whole-source-blob replacement, semantic invariant failure, conflict marker, unsafe value, binary,
typecheck-baseline drift, required-check failure, writer mutation, non-independent review, nonzero
finding, wrong verifier operation/role/`reviewKind`, unguarded real-controller reconcile, callback
incompatibility, invented unknown success, or invalid merge identity.

P1.R2, P1.I, P1.F, and Phase 2+ remain blocked until the validated true merge is pushed. This docs
router launches no producer, reviewer, controller, or integration attempt and performs no fetch,
stage, commit, merge, or push. End `HOLD`.

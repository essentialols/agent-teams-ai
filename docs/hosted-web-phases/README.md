# Hosted Web execution router

> Current authority: correct the rejected PR #252 future launch contract with semantic router r2.
> After router `ACCEPT`, integration, and push, admit one serial semantic five-path producer and then
> one fresh independent reviewer. Both use `xhigh` reasoning and the `default` service tier; Fast is
> forbidden. This docs author launches nothing and ends `HOLD`.

Always begin with [`START_HERE.md`](START_HERE.md). This router selects bounded execution authority;
it does not redefine product architecture, grant raw Git authority, or turn rejected output into an
input.

## Fixed route

1. Read the mandatory documents in the exact order in [`START_HERE.md`](START_HERE.md).
2. Confirm the sole node, provenance, launch renderer, and post-push binding in
   [`EXECUTION_INDEX.json`](EXECUTION_INDEX.json).
3. Follow the current [`Phase 1 controller packet`](phase-01/controller-packet.md).
4. Follow the single assigned
   [`PR #252 semantic conflict packet`](phase-01/lanes/pr252-base-conflict-resolution.md).
5. Read only that packet's five owned paths at the stored target and pinned source commits.

Stop on stale or mixed identity, unexpected scope, missing pinned object, staged content, hash or
packet drift, placeholder launch values, an extra strict-contract field, Fast mode, canonical
re-resolution, rejected-job reuse, unsafe content, or any failed required check.

## Terminal rejected provenance

Revision `phase-01-pr252-semantic-conflict-remediation-router-r2` is a clean correction. Semantic
router r1 patch `95dcdae236fdadbd63bfb3022441accc4354cffdc5ca6db7447e7a01e9d53221` was rejected for an
invalid future launch contract, and
`pr252-semantic-router-r1-contract-reject-consume-v1` consumed that decision. The r1 job is not an
implementation input and may never be integrated, reused, retried, or continued.

The earlier byte-copy producer patch
`a0fade213fd86c52022f944c9d3a9f169175f1fd5a54f6c19652173ae5307304` and its independent review
remain `REJECT`. Their jobs are terminal provenance only. The new producer must begin clean with
`inputPatchHash=null`, `revision=0`, `retryCount=0`, and `supersedes=null`.

## Current execution contract

`PR252-semantic-conflict-remediation` is the only executable node. Its fixed `baseSha` is
`7c502f45df32b58bbc161b26dcc28df8a17107c9`. Product-worker capacity remains zero until this exact
seven-path docs router receives independent `ACCEPT`, is integrated, and is pushed.

After the push, `ProjectScopedControl` resolves the accepted pushed router commit once. That stored
full SHA is used without recomputation for `canonicalSha`, `phaseStartSha`, `sourceRef`,
`baseBranch`, producer worktree `HEAD`, reviewer materialization, `mark_reviewed`, integration, and
the true merge's first parent. `baseSha` does not move.

The controller packet publishes one orchestration launch template. The strict future contract has
only the fields enumerated there. Merge source and plan/materialization metadata remain outside it.
The controller may render exactly one request only after the stored SHA exists, and every value in
the rendered request must be concrete. Any placeholder, binding object, missing field, extra field,
or drift rejects admission.

Within that contract, `requiredChecks` is exactly seven `{id,cwd,command}` objects copied from the
strict command references, with `cwd="src"` and every command prefixed `cd .. && `; the separate
human-readable gate list is not a contract source. `executionPolicy` has exactly `mode`,
`sandboxRoot`, and nonempty `forbiddenRealProjects`. Its sandbox root is the fully concrete isolated
producer or reviewer workspace. The extended network, runtime, Fast, writer, and Git controls remain
outer orchestration enforcement. String checks, extra policy keys, or unresolved binding/copy
objects reject rendering.

The merge source identity is unchanged:
`origin/refactor/team-provisioning-round2-reapply@7afc908ce92f14b4b0ebd06cc4aa3a4cf33807d0`.

## Semantic implementation and review

Exactly one producer may edit the five lane-owned paths. The producer semantically combines the
stored target and pinned source intent; it never replaces a complete file with a source blob. The
facade destination's `reconcile` method is optional: use it when available, otherwise reconcile with
`findById` plus validation. Present mismatched provenance is terminal, and unknown outcomes never
become success. `TeamDataService` capability-detects `reconcileTaskCreation` with a narrow runtime
guard and omits that port when absent; it also keeps `projectPath` outside the hashed payload and
sorts/dedupes relation IDs.

`TeamDetailView` uses one dual-signature async adapter compatible with both the target positional
dialog callback and the source request-object Promise callback. It keeps positional retry identity
stable and passes through `request.command`. The TaskBoard E2E suite must retain the four target
cases and port the five source cases for exactly nine, with no unguarded real-controller reconcile.
The supported final task-board API must retain its coherent `reconcileTaskCreation` path; a narrow
capability guard may support target mocks or older boundaries but may not omit that path when the
capability exists.
The producer runs all gates, self-reviews, emits one immutable output, and ends `HOLD` without
staging, merging, committing, pushing, or launching a reviewer.

`ProjectScopedControl` then starts exactly one fresh independent reviewer through
`codex_goal_project_prepare_verifier` with `workerRole: reviewer`, `xhigh`/`default`, Fast forbidden,
and strict runtime `reviewKind: review`; architecture/integration is purpose prose, not the enum. Its
fully concrete verifier request uses the exact strict shape and no-write execution policy. The
reviewer reruns the focused suites, exact inherited seven-diagnostic typecheck classification, exact
`lint:fast:files`, Prettier, index-empty, diff/ownership, conflict-marker, secret/private-path, and
binary gates. It owns no paths and returns `ACCEPT` or `REJECT`; `ACCEPT` requires P0/P1/P2 `0/0/0`.

Only after that acceptance may `ProjectScopedControl` create and validate the true ordered
two-parent merge `[stored accepted router target,
7afc908ce92f14b4b0ebd06cc4aa3a4cf33807d0]`, make a conventional commit, and push it. Once the
pinned source's non-conflict paths are materialized, final-merge validation additionally runs
`pnpm exec vitest run test/renderer/utils/createTaskCommandIdentity.test.ts`.

## Blocked successors and HOLD

P1.R2, P1.I, P1.F, and Phase 2+ remain blocked until the validated merge is pushed. This exact
seven-path docs transition launches no job and performs no fetch, stage, commit, merge, push, or
integration attempt. End `HOLD`.

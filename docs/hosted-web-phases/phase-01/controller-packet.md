# Phase 1 controller packet: PR #252 provenance-fallback router r2

## Status and authority

- Root role: orchestrator only
- Durable controller: `controller-v17`, exactly `live=true`; no replacement or restart
- Admission/integration owner: `ProjectScopedControl`
- Producer continuation: the exact existing r3 job only
- Reviewer start: one fresh `codex_goal_project_prepare_verifier`, `workerRole: reviewer`, strict
  `reviewKind: review`
- Current node: `PR252-provenance-fallback-remediation`
- Revision: `phase-01-pr252-provenance-fallback-router-r2`
- Router authoring base: `c0ade7cb040c9dea97a38ee58e667f56c0e39b8e`
- Continued workspace base and intentional `HEAD`:
  `3256ee3b5b8e81b144aa0a14eac1bca080c9b779`
- Held workspace patch SHA-256:
  `9f5016c669ab777a80d1395352ee7e51d945e2409a3d43efa4735dea8d23b2a0`
- Immutable source parent: `e9ffa30cc016ad3cb833fcc0a138fa4f026eb850`
- Pinned merge source: `3b48f9391b4bff1d82bc85ef01a2d5e0e5b50e95`
- Conditional capacity: one same-job held r3 continuation, then one fresh independent reviewer
- Every future job: `gpt-5.6-sol`, `xhigh`, `serviceTier: "default"`; omit `fastMode`
- This docs job launches none and ends `HOLD`

Product-worker capacity is zero until this exact seven-document router receives independent
`ACCEPT`, is integrated, and is pushed. P1.R2, P1.I, P1.F, and Phase 2+ remain blocked until the
validated ordered merge is pushed.

## Rejected routers and held workspace identity

The following outputs are immutable rejected provenance only:

| Record                           | SHA-256                                                            | Sole reason/current use                         |
| -------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------- |
| Test-only correction router      | `daa462aba1b21cdf41a05575d3967d8314d5c9a734e76f4cda5678a136ba7902` | omitted the required facade correction; none    |
| Prior seven-doc tier declaration | `c5f33adf53ef93ab69789a0d1f2b2041ffb2e2694f852b32e8cb189edddc8660` | non-default tier authorization; provenance only |

Both are terminal for direct integration, reuse, replay, or implementation input. The current
router recreates the prior seven-doc output's non-tier contract on `c0ade7cb...` and changes the
future-job tier to `default` everywhere.

The producer continuation remains exactly:

| Field               | Required value                                                                                  |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| Worker job and task | `agent-teams-hosted-web-refactor-pr252-semantic-conflict-resolution-v17-r3`                     |
| Workspace           | `/var/data/agent-teams-hosted-web-refactor/worktrees/pr252-semantic-conflict-resolution-v17-r3` |
| Base and HEAD       | `3256ee3b5b8e81b144aa0a14eac1bca080c9b779`                                                      |
| Raw patch           | `9f5016c669ab777a80d1395352ee7e51d945e2409a3d43efa4735dea8d23b2a0`                              |
| Index/untracked     | empty / none                                                                                    |
| Changed paths       | the exact ordered five-path list below                                                          |

This is a held, reviewed-dirty same-job continuation. The patch already exists in that exact
workspace; it is preserved in place rather than replayed or materialized elsewhere.

## Source and conflict authority

The recorded source parent is
`e9ffa30cc016ad3cb833fcc0a138fa4f026eb850`. The active pinned merge source and required second
parent is `3b48f9391b4bff1d82bc85ef01a2d5e0e5b50e95` from
`origin/refactor/team-provisioning-round2-reapply`.

The route requires the exact five conflicts listed below. It does not reinterpret the held output as
a standalone patch push. The final broker creates a true two-parent merge, materializes pinned-source
non-conflicts, applies the accepted five-path output, reruns the full final shape, then commits and
pushes.

Immediately before integration, direct `git ls-remote` must still return exactly the pinned merge
source. Source drift ends `HOLD` and requires a new router; fetching a substitute or silently
rebinding is forbidden.

## Stored router authority without moving r3 HEAD

After current-router acceptance/integration/push, `ProjectScopedControl` resolves that pushed full
SHA exactly once as `storedRouterCommit`. It binds the continuation directive, fresh reviewer,
`mark_reviewed`, integration target, and true merge's first parent. It is never re-resolved.

`storedRouterCommit` is not the continued workspace base or `HEAD`. The r3 workspace intentionally
stays at `3256ee3b...` so the exact dirty patch remains intact. The continued worker obtains current
authority only with `git show <storedRouterCommit>:<path>` for every mandatory authority path. It may
not fetch, checkout, reset, rebase, or otherwise move `HEAD`.

## Exact same-job continuation admission

Immediately before continuation, `ProjectScopedControl` proves all of the following in one snapshot:

1. This r2 router is independently accepted, integrated, pushed, and resolved once as
   `storedRouterCommit`.
2. The named r3 job and task already exist, point at the exact workspace, are stopped, and have no
   continuation in flight.
3. The r3 profile is exactly `gpt-5.6-sol`, `xhigh`, `serviceTier: "default"`.
4. Workspace base/`HEAD` are `3256ee3b...`, the index is empty, and no untracked path exists.
5. Exactly the five ordered tracked paths are dirty and raw patch SHA-256 is `9f5016c6...`.
6. Source parent, pinned merge source, and exact five-conflict authority are unchanged.

Any mismatch ends `HOLD` without a start. If all checks pass, continue exactly the named r3 job once
with `forceStart=true`, `confirmStart=true`, and `dependencyBootstrap=install`. This is not a refill.
A new job, task, prompt-owned workspace, worktree, duplicate start, parallel producer, or altered
profile is not authorized. An already-running/duplicate result fails closed.

## Exact seven-document router ownership

1. `docs/hosted-web-phases/START_HERE.md`
2. `docs/hosted-web-phases/README.md`
3. `docs/hosted-web-phases/EXECUTION_INDEX.json`
4. `docs/hosted-web-phases/phase-01/README.md`
5. `docs/hosted-web-phases/phase-01/controller-packet.md`
6. `docs/hosted-web-phases/phase-01/execution-dag.md`
7. `docs/hosted-web-phases/phase-01/lanes/pr252-base-conflict-resolution.md`

Every product, test, runtime, orchestration implementation, research/evidence, configuration,
package, lockfile, handoff, ledger, and integration path is read-only to this docs author. An eighth
changed path or any untracked path rejects the router.

## Exact five-path held workspace

1. `src/features/task-board-commands/core/application/TaskBoardCommandFacade.ts`
2. `src/main/services/team/TeamDataService.ts`
3. `src/renderer/components/team/TeamDetailView.tsx`
4. `test/features/task-board-commands/TaskBoardCommands.e2e.test.ts`
5. `test/main/services/team/TeamDataService.test.ts`

The existing patch in all five paths is preserved. New bytes are authorized only in paths 1 and 4:
the classified-conflict known-task guard and exactly two E2E expectation corrections. Paths 2, 3,
and 5 remain byte-identical to their `9f5016c6...` patch sections. Existing unrelated hunks in paths
1 and 4 also remain intact. There is no compile-coherence exception and no sixth path.

## Facade semantic acceptance

1. Preserve the existing error classifier and existing `assertMatchingTask`. Do not duplicate or
   replace either.
2. In the classified `TaskBoardCreateDestinationConflictError` path, when a known task exists, call
   existing `assertMatchingTask` for that task, the exact requested task ID, and the requested
   payload. Its requested string subject is compared after trimming.
3. Return the known task only after the matcher succeeds. A same ID without a matching trimmed
   subject is never sufficient.
4. Preserve the existing terminal and no-known-task paths. No known task means no fallback success.
5. Preserve mismatch behavior. ID or trimmed-subject mismatch throws
   `TaskBoardCreateDestinationConflictError`, is `Terminal`, and never becomes a success outcome.
6. Preserve every other-error path; a non-classified error is not reconciled or converted to
   success.
7. Do not require or compare `creationCommand`, `payloadHash`, `createdBy`, or relations.
8. Do not weaken, bypass, widen, or replace `taskStore`, its validations, writer authority,
   persistence, or error behavior.

## Exact E2E acceptance

The suite remains exactly ten cases. Do not add an eleventh case or delete, merge, or skip one.
Correct exactly two existing cases:

1. the direct known-task fallback reports `outcome: "Executed"`;
2. the destination reconciliation reports `outcome: "Reconciled"`.

Both cases require `createdInAttempt: false`, returned status `Completed`, `attemptCount: 1`, and
exactly one task. No other case's semantics change. The `UNRELATED SUBJECT` case remains terminal,
returns no success outcome, and never creates or exposes a false matching task.

## Continued-worker and reviewer gates

Run independently after continuation and in the fresh review materialization:

```bash
git diff --cached --quiet
test -z "$(git ls-files --others --exclude-standard)"
pnpm exec vitest run test/features/task-board-commands/TaskBoardCommands.e2e.test.ts
pnpm exec vitest run test/main/services/team/TeamDataService.test.ts
node scripts/hosted-web/phase-0/final-gate/normalize-typescript-diagnostics.mjs --mode milestone
pnpm lint:fast:files -- src/features/task-board-commands/core/application/TaskBoardCommandFacade.ts src/main/services/team/TeamDataService.ts src/renderer/components/team/TeamDetailView.tsx test/features/task-board-commands/TaskBoardCommands.e2e.test.ts test/main/services/team/TeamDataService.test.ts
pnpm exec prettier --check src/features/task-board-commands/core/application/TaskBoardCommandFacade.ts src/main/services/team/TeamDataService.ts src/renderer/components/team/TeamDetailView.tsx test/features/task-board-commands/TaskBoardCommands.e2e.test.ts test/main/services/team/TeamDataService.test.ts
git diff --check
```

The exact focused results are TaskBoardCommands `10/10` and TeamDataService `127/127`. Native
TypeScript classification is green only at `7 inherited / 0 owned / 0 unexpected`:

- `auth-artifacts-spike.test.ts`: TS7016 at 25:8; TS7031 at 66:31; TS18046 at 117:68; TS7031 at
  413:48; TS7031 at 733:10;
- `evidence-scanner.test.ts`: TS7016 at 12:8; and
- `scan-runtime-surfaces.test.ts`: TS2352 at 162:44.

Any added, removed, moved, or changed diagnostic fails.

Also prove exact job/workspace/base/patch bindings, five-path ownership, preserved patch sections,
new-byte restriction, exact ten-case and two-correction counts, classified-conflict flow, existing
matcher use, terminal `UNRELATED SUBJECT`, no provenance comparison, no task-store weakening, and
classified conflict-marker, secret/auth/provider, private/user/real-project-path, and textual/non-
binary scans. Every match must be classified.

The continued worker self-reviews with explicit P0/P1/P2 counts, emits one immutable runtime-owned
output with `nextAction: "integration-review"`, and returns `HOLD`. It does not start the reviewer or
authorize integration.

## Independent default-tier review

After r3 `HOLD`, `ProjectScopedControl` invokes `codex_goal_project_prepare_verifier` exactly once.
The reviewer is fresh and independent of the router author, continued r3, rejected test-only router,
rejected non-default-tier output, earlier PR252 workers/reviewers, and prior accepted workers.

The reviewer uses `gpt-5.6-sol`, `xhigh`, `serviceTier: "default"`, no machine `fastMode`, and a
no-write policy. It binds stored router authority, base `3256ee3b...`, merge source `3b48f939...`, and
the SHA-256 of the sole immutable continued output. It cannot repair, refill, re-resolve, stage,
merge, commit, or push. It reruns every gate and returns explicit `ACCEPT` or `REJECT`; only `ACCEPT`
with P0/P1/P2 `0/0/0` may integrate.

## Reviewed ordered integration

Immediately before integration, `ProjectScopedControl` runs exactly:

```bash
git ls-remote origin refs/heads/refactor/team-provisioning-round2-reapply
```

The single returned head must remain
`3b48f9391b4bff1d82bc85ef01a2d5e0e5b50e95`. If it moved, stop at `HOLD`; do not fetch a
replacement or silently rebind.

Only with unchanged source and fresh reviewer `ACCEPT` may the broker create a true merge with
ordered parents
`[storedRouterCommit, 3b48f9391b4bff1d82bc85ef01a2d5e0e5b50e95]`. It proves exactly five
conflicts, materializes pinned-source non-conflicts, applies only the accepted five-path output,
reruns all producer/reviewer gates and scans on the final shape, runs the inherited final source-only
command-identity test, creates a conventional merge commit, and pushes.

A one-parent, squash, patch-only, reversed-parent, moving-source, extra-conflict, clean-rewrite,
rejected-output replay, whole-blob-copy, non-default-tier, provenance comparison, task-store
weakening, or gate-failing result is rejected and not pushed.

## Exact docs-router checks

Run from the repository root with `PATH=/usr/local/bin:/usr/bin:/bin:$PATH`:

The router patch may be wholly unstaged in the author workspace or wholly cached by atomic verifier
preparation. Compute the expected full `HEAD` patch and both channel hashes, require exactly one
channel to contain that complete patch and the opposite channel to be empty, then use the active
channel for exact-path and whitespace checks. A split patch, duplicate patch, or empty patch fails.

```bash
node <<'NODE'
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')

const authoringBase = 'c0ade7cb040c9dea97a38ee58e667f56c0e39b8e'
const workspaceBase = '3256ee3b5b8e81b144aa0a14eac1bca080c9b779'
const heldPatch = '9f5016c669ab777a80d1395352ee7e51d945e2409a3d43efa4735dea8d23b2a0'
const testOnly = 'daa462aba1b21cdf41a05575d3967d8314d5c9a734e76f4cda5678a136ba7902'
const tierRejected = 'c5f33adf53ef93ab69789a0d1f2b2041ffb2e2694f852b32e8cb189edddc8660'
const sourceParent = 'e9ffa30cc016ad3cb833fcc0a138fa4f026eb850'
const mergeSource = '3b48f9391b4bff1d82bc85ef01a2d5e0e5b50e95'
const revision = 'phase-01-pr252-provenance-fallback-router-r2'
const job = 'agent-teams-hosted-web-refactor-pr252-semantic-conflict-resolution-v17-r3'
const routerPaths = [
  'docs/hosted-web-phases/START_HERE.md',
  'docs/hosted-web-phases/README.md',
  'docs/hosted-web-phases/EXECUTION_INDEX.json',
  'docs/hosted-web-phases/phase-01/README.md',
  'docs/hosted-web-phases/phase-01/controller-packet.md',
  'docs/hosted-web-phases/phase-01/execution-dag.md',
  'docs/hosted-web-phases/phase-01/lanes/pr252-base-conflict-resolution.md',
]
const ownedPaths = [
  'src/features/task-board-commands/core/application/TaskBoardCommandFacade.ts',
  'src/main/services/team/TeamDataService.ts',
  'src/renderer/components/team/TeamDetailView.tsx',
  'test/features/task-board-commands/TaskBoardCommands.e2e.test.ts',
  'test/main/services/team/TeamDataService.test.ts',
]
const exact = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const index = JSON.parse(fs.readFileSync(routerPaths[2], 'utf8'))
const hasKey = (value, key) => {
  if (!value || typeof value !== 'object') return false
  if (Object.prototype.hasOwnProperty.call(value, key)) return true
  return Object.values(value).some((child) => hasKey(child, key))
}
const collectKey = (value, key, result = []) => {
  if (!value || typeof value !== 'object') return result
  if (Object.prototype.hasOwnProperty.call(value, key)) result.push(value[key])
  for (const child of Object.values(value)) collectKey(child, key, result)
  return result
}

assert.equal(index.currentRouterRevision, revision)
assert.equal(index.currentRouterTerminalState, 'HOLD')
assert.equal(index.routerAuthoringBaseSha, authoringBase)
assert(!hasKey(index, 'fastMode'), 'unsupported fastMode key present')
assert(collectKey(index, 'serviceTier').length >= 3)
assert(collectKey(index, 'serviceTier').every((value) => value === 'default'))
assert(exact(index.futureJobProfile, {
  model: 'gpt-5.6-sol',
  reasoningEffort: 'xhigh',
  serviceTier: 'default',
  machineFastModeFieldAllowed: false,
}))

assert.equal(index.continuedWorkspaceSnapshot.baseSha, workspaceBase)
assert.equal(index.continuedWorkspaceSnapshot.headSha, workspaceBase)
assert.equal(index.continuedWorkspaceSnapshot.patchSha256, heldPatch)
assert(index.continuedWorkspaceSnapshot.indexEmpty)
assert(exact(index.continuedWorkspaceSnapshot.untrackedPaths, []))
assert(exact(index.continuedWorkspaceSnapshot.changedPaths, ownedPaths))
assert.equal(index.rejectedRouterOutputs.testOnly.sha256, testOnly)
assert.equal(index.rejectedRouterOutputs.nonDefaultTier.sha256, tierRejected)
assert(index.rejectedRouterOutputs.testOnly.terminal)
assert(index.rejectedRouterOutputs.nonDefaultTier.terminal)
assert(!index.rejectedRouterOutputs.testOnly.reuseAuthorized)
assert(!index.rejectedRouterOutputs.nonDefaultTier.reuseAuthorized)

assert.equal(index.sourceAuthority.sourceParentSha, sourceParent)
assert.equal(index.sourceAuthority.mergeSourceSha, mergeSource)
assert.equal(index.reviewedIntegrationProtocol.preIntegrationRemoteHeadVerification.expectedCommit, mergeSource)
assert(exact(index.reviewedIntegrationProtocol.requiredParentOrder, [
  { binding: 'storedRouterCommit' },
  mergeSource,
]))

assert(exact(index.producerOwnedPaths, ownedPaths))
assert(exact(index.continuationEditPolicy.onlyNewBytePaths, [ownedPaths[0], ownedPaths[3]]))
assert(exact(index.continuationEditPolicy.unchangedPatchPaths, [ownedPaths[1], ownedPaths[2], ownedPaths[4]]))
assert.equal(index.continuationEditPolicy.correctedExistingE2ECases, 2)
assert(!index.continuationEditPolicy.newE2ECaseAuthorized)

const semantic = index.semanticAcceptance
assert.equal(semantic.classifiedError, 'TaskBoardCreateDestinationConflictError')
assert.equal(semantic.knownTaskPath.matcher, 'assertMatchingTask')
assert.equal(semantic.knownTaskPath.exactIdRequired, true)
assert.equal(semantic.knownTaskPath.subjectComparison, 'knownTask.subject===requestedPayload.subject.trim()')
assert.equal(semantic.knownTaskPath.returnOnlyAfterMatcherSuccess, true)
assert(semantic.preserveTerminalPath && semantic.preserveNoKnownTaskPath)
assert(semantic.preserveMismatchPath && semantic.preserveOtherErrorPath)
assert(exact(semantic.prohibitedProvenanceComparisons, [
  'creationCommand', 'payloadHash', 'createdBy', 'relations',
]))
assert.equal(semantic.taskStorePolicy, 'unchanged-not-weakened')
assert.equal(semantic.taskBoardE2E.requiredTotalCases, 10)
assert(exact(semantic.taskBoardE2E.correctedCases.map((item) => item.outcome), ['Executed', 'Reconciled']))
for (const item of semantic.taskBoardE2E.correctedCases) {
  assert.equal(item.createdInAttempt, false)
  assert.equal(item.taskStatus, 'Completed')
  assert.equal(item.attemptCount, 1)
  assert.equal(item.taskCount, 1)
}
assert.equal(semantic.taskBoardE2E.unrelatedSubject, 'UNRELATED SUBJECT')
assert(semantic.taskBoardE2E.unrelatedSubjectTerminal)

assert(exact(index.requiredExactResults, {
  taskBoardCommands: { passed: 10, total: 10 },
  teamDataService: { passed: 127, total: 127 },
  nativeTypeScript: { inherited: 7, owned: 0, unexpected: 0 },
}))
assert.equal(index.projectScopedContinuationAdmission.existingJobId, job)
assert.equal(index.projectScopedContinuationAdmission.sameJobRequired, true)
assert.equal(index.projectScopedContinuationAdmission.newJobAuthorized, false)
assert.equal(index.projectScopedContinuationAdmission.serviceTier, 'default')
assert.equal(index.integrationReviewAdmission.serviceTier, 'default')
assert(exact(index.integrationReviewAdmission.acceptFindingCounts, { P0: 0, P1: 0, P2: 0 }))

assert(exact(index.authorization.authorizedNow, []))
assert(exact(index.authorization.blockedUntilValidatedOrderedMergePushed, [
  'P1.R2', 'P1.I', 'P1.F', 'Phase 2+',
]))
assert(exact(index.routerExclusiveOwnership, routerPaths))

for (const packet of [index.packetHashes.controllerPacket, index.packetHashes.lanePacket]) {
  const actual = crypto.createHash('sha256').update(fs.readFileSync(packet.path)).digest('hex')
  assert.equal(actual, packet.sha256, `packet hash drift ${packet.path}`)
}
for (const routerPath of routerPaths.filter((value) => value.endsWith('.md'))) {
  const text = fs.readFileSync(routerPath, 'utf8')
  assert(text.includes(revision), `missing revision ${routerPath}`)
  for (const match of text.matchAll(/\]\(([^)]+)\)/g)) {
    const targetPath = match[1].replace(/^<|>$/g, '').split('#')[0]
    if (!targetPath || /^[a-z]+:/i.test(targetPath)) continue
    assert(fs.existsSync(path.resolve(path.dirname(routerPath), targetPath)), `broken link ${targetPath}`)
  }
}

console.log('pr252-provenance-fallback-router-r2: ok')
NODE
test "$(git rev-parse HEAD)" = c0ade7cb040c9dea97a38ee58e667f56c0e39b8e
test -z "$(git ls-files --others --exclude-standard)"
empty_patch_sha256=e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
expected_router_patch_sha256=$(git diff HEAD --binary | sha256sum | awk '{print $1}')
cached_router_patch_sha256=$(git diff --cached --binary | sha256sum | awk '{print $1}')
unstaged_router_patch_sha256=$(git diff --binary | sha256sum | awk '{print $1}')
test "$expected_router_patch_sha256" != "$empty_patch_sha256"
if test "$cached_router_patch_sha256" = "$expected_router_patch_sha256" && \
  test "$unstaged_router_patch_sha256" = "$empty_patch_sha256"; then
  active_diff_args=(--cached)
elif test "$unstaged_router_patch_sha256" = "$expected_router_patch_sha256" && \
  test "$cached_router_patch_sha256" = "$empty_patch_sha256"; then
  active_diff_args=()
else
  echo "router patch must exist wholly in exactly one of cached or unstaged state" >&2
  exit 1
fi
actual_paths=$(git diff "${active_diff_args[@]}" --name-only)
expected_paths=$(printf '%s\n' \
  docs/hosted-web-phases/EXECUTION_INDEX.json \
  docs/hosted-web-phases/README.md \
  docs/hosted-web-phases/START_HERE.md \
  docs/hosted-web-phases/phase-01/README.md \
  docs/hosted-web-phases/phase-01/controller-packet.md \
  docs/hosted-web-phases/phase-01/execution-dag.md \
  docs/hosted-web-phases/phase-01/lanes/pr252-base-conflict-resolution.md)
test "$actual_paths" = "$expected_paths"
pnpm exec prettier --check \
  docs/hosted-web-phases/START_HERE.md \
  docs/hosted-web-phases/README.md \
  docs/hosted-web-phases/EXECUTION_INDEX.json \
  docs/hosted-web-phases/phase-01/README.md \
  docs/hosted-web-phases/phase-01/controller-packet.md \
  docs/hosted-web-phases/phase-01/execution-dag.md \
  docs/hosted-web-phases/phase-01/lanes/pr252-base-conflict-resolution.md
git diff "${active_diff_args[@]}" --check
```

Also require the selected active channel to contain exactly all seven textual router paths and the
opposite channel to be empty. JSON must be valid where applicable; packet hashes and links must match;
conflict-marker scans must be empty; service-tier scans must find only `default` in machine/profile
authority; and exact-scope secret/provider/private-path scans must contain no unsafe or unclassified
value.

## Stop and HOLD

Stop on router authority, job/task/workspace, base/`HEAD`, patch, index, untracked path, source,
conflict-set, continuation request, duplicate activity, model/effort/tier, controller, facade
classifier/matcher flow, preserved error behavior, test count/result, native diagnostics, scan,
independence, review, or integration drift.

This docs author does not inspect the external r3 workspace, launch the continuation/reviewer/broker,
or perform fetch, lifecycle, stage, commit, merge, or push. End `HOLD`.

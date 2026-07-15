# Phase 1 controller packet: P1.R2 semantic review router

## Status and authority

- Phase/current node: `phase-01` / `P1.R2`
- Router revision: `phase-01-p1-r2-router-r1`
- Lane packet revision: `phase-01-p1-r2-review-r1`
- Router remediation `packetBaseSha`:
  `48d79e2b13e258fc82ad55723875f15d6e162872` (authoring base only)
- Formal-review `postIntegrationAuthoritySha`: intentionally unresolved until the broker returns and
  pushes the exact accepted policy-integration commit; never hardcode it to `packetBaseSha` or guess it
- Authority state required before reviewer start: resolved by root from that broker result, clean, and
  bound by immutable pre-start attestation to the sole result of
  `git ls-remote origin refs/heads/refactor/hosted-web-feature-boundaries`; upstream-tracking
  assumptions are not evidence
- Reviewed product snapshot for the unchanged exact 32 inputs:
  `666042037a9c91df572b1d8274bf6024f8d00f40`
- Reviewed product snapshot topology: true two-parent merge with ordered parents
  `[c3135d40c6e70e4b2ddc905dc815407397197634,
3b48f9391b4bff1d82bc85ef01a2d5e0e5b50e95]`
- Accepted predecessor gates: PR #252 conflict gate and P1.1D, both complete and accepted
- Root role: sole orchestrator
- Durable controller: `controller-v17`, `HOLD`, observation-only
- Reviewer capacity: exactly one fresh independent P1.R2 reviewer
- Reviewer profile: `gpt-5.6-sol`, `xhigh`, `serviceTier: "default"`; Fast is not authorized
- Dependency source: broker-materialized offline before admission; worker installation is forbidden
- Evidence ID: `P1.R2.SEMANTIC_REVIEW`
- This docs router launches none and ends `HOLD`

`controller-v17` cannot launch, admit, integrate, restart, replace itself, or create a successor.
Root may start the reviewer only after this exact seven-path router is independently accepted,
policy-integrated, and pushed. No successor controller is authorized.

## Outcome

Produce one independent formal `ACCEPT` or `REJECT` review of the unchanged shared hosted kernel and
team-lifecycle list semantics at reviewed product snapshot
`666042037a9c91df572b1d8274bf6024f8d00f40`, from reviewer worktree authority `HEAD` equal to the
resolved `postIntegrationAuthoritySha`, with explicit P0/P1/P2 counts and exact gate evidence.
`ACCEPT` is legal only at P0/P1/P2 `0/0/0`. Semantic, content, or review-gate findings produce
`REJECT`.

Admission, provider, environment, or no-strict-result failures are runtime incidents and end `HOLD`;
they must never be converted into a synthetic `REJECT`. A review completes only when root possesses
both the strict terminal result and broker-captured immutable output that binds the bytes and hashes
of both exact result paths. `changedFiles`, a heartbeat, PID, tmux state, or `providerObserved` state
cannot substitute for either proof.

On strict `ACCEPT` with P0/P1/P2 `0/0/0`, root mechanically verifies the terminal result, immutable
output, bound evidence bytes, commands, hashes, scope, and disposition; invokes `mark_reviewed`;
then directs the broker to integrate and push exactly `.codex-handoff/phase-01-p1-r2.json` and
`docs/research/hosted-web/phase-1/reviews/list-semantics.md`. Root and the reviewer never perform the
Git integration. P1.I, P1.F, Phase 2+, and product workers remain blocked after that push. Only a
later separately reviewed docs router may authorize P1.I, and it consumes but never integrates those
already integrated evidence paths.

## Immutable inputs and historical boundary

`packetBaseSha` `48d79e2b13e258fc82ad55723875f15d6e162872` proves only where this router
remediation is authored. After the accepted router is policy-integrated and pushed, root resolves
`postIntegrationAuthoritySha` from the exact commit returned and pushed by the broker. Reviewer
`expectedSourceCommit`, worktree `HEAD`, canonical, base, plan bundle, and phase start all bind that
resolved value. Before reviewer start, root must prove the resulting worktree clean and capture
immutable evidence of exact equality between that value and the sole result of
`git ls-remote origin refs/heads/refactor/hosted-web-feature-boundaries`. Neither an upstream-tracking
ref nor a guessed/future SHA may substitute for the broker result and explicit remote-ref query.

The review's exact 32 product inputs are separately bound to `reviewedProductSnapshotSha`
`666042037a9c91df572b1d8274bf6024f8d00f40`. Every one must be byte-identical at the authority
`HEAD` and the reviewed product snapshot. The snapshot's exact parent order is binding and must be
re-proved locally without rebinding.

The accepted PR #252 lane at
[`lanes/pr252-base-conflict-resolution.md`](lanes/pr252-base-conflict-resolution.md) remains
byte-for-byte historical with SHA-256
`f55c7d77f7cb54d90208fb6fe6f61e257fa75f0b063b5fd71e5677c83d148842`. It is not current
authority and must not change in this router.

The product review input is exactly the 32 paths in
[`lanes/p1-r2-review.md`](lanes/p1-r2-review.md): 12 accepted P1.1A kernel paths, 9 accepted P1.1D
paths, and 11 immutable semantic-corpus paths. No moving ref, prior rejected output, historical lane,
or sibling research path may replace or expand that input.

## Non-goals

This packet does not authorize a product producer, repair, refill, concurrent or second reviewer,
product edit, root/reviewer Git integration, P1.I, P1.F, Phase 2+, route/capability work,
IPC/HTTP/preload/renderer work, production auth, adapter/runtime/filesystem work,
app/team/server/provider launch, real-project access, arbitrary Git mutation, or successor
controller. The only post-review Git authority is the broker's exact two-path integration and push
after mechanically verified strict `ACCEPT` with P0/P1/P2 `0/0/0` and `mark_reviewed`.

## Definition of Ready

Root must prove in one pre-start snapshot:

1. this exact seven-path router was independently accepted, policy-integrated, and pushed;
2. the broker returned and pushed one exact commit and root resolved it as
   `postIntegrationAuthoritySha`, distinct in role from router `packetBaseSha`;
3. reviewer `expectedSourceCommit`, worktree `HEAD`, canonical, base, plan bundle, and phase start all
   bind that resolved authority SHA;
4. the authority worktree is clean, and root's immutable pre-start attestation records the exact
   broker result plus command, exit code, output, and equality proving the sole result of
   `git ls-remote origin refs/heads/refactor/hosted-web-feature-boundaries` binds that SHA;
5. `reviewedProductSnapshotSha` is
   `666042037a9c91df572b1d8274bf6024f8d00f40`, has exactly the two ordered parents above, and every
   one of the exact 32 inputs is byte-identical at the authority `HEAD` and that snapshot;
6. the PR #252 conflict gate and P1.1D remain accepted, with no reopened predecessor work;
7. root remains sole orchestrator and `controller-v17` remains `HOLD`, observation-only;
8. no P1.R2 reviewer exists or is active, and the fresh identity/job/worktree independence gate
   passes;
9. admission is exactly `codex_goal_project_refill_worker`, `workerRole: reviewer`, source
   `origin/refactor/hosted-web-feature-boundaries`, `reviewKind: review`, `inputPatchHash: null`, and
   never `prepare_verifier`;
10. the request is exactly `gpt-5.6-sol`, `xhigh`, and `serviceTier: "default"`, with no Fast mode;
11. the broker has materialized dependencies offline and the assignment forbids the worker from
    installing, fetching, or updating them;
12. the exact 32 inputs exist and both output paths are absent; and
13. no product worker, P1.I, P1.F, Phase 2+, integration, or successor-controller activity exists.

Any admission mismatch ends `HOLD` without launch. There is no replacement, fallback, refill, or
profile substitution authority. One exact corrected attempt is the sole exception: root may
authorize it only for an admission, provider, environment, or no-strict-result runtime incident,
only after proving the affected attempt terminal or proving no runner exists, and never while
another attempt is active. No corrected attempt follows a semantic, content, or gate `REJECT`.

Root performs the exact ProjectScopedControl launch defined in the lane packet:
`codex_goal_project_refill_worker`, `workerRole: reviewer`, `sourceRemote: origin`,
`sourceBranch: refactor/hosted-web-feature-boundaries`, and `expectedSourceCommit` equal to the
resolved `postIntegrationAuthoritySha`; serial built-in contract `canonicalSha`, `baseSha`, and
`phaseStartSha` equal to that same authority; `inputPatchHash: null`; and `reviewKind: review`.
`prepare_verifier` is forbidden. The reviewer performs no network or remote query.

## DAG, lane registry, and capacity

The serial DAG is:

```text
accepted product snapshot 66604203... with exact 32 unchanged inputs
  -> seven-path router authored at packetBaseSha 48d79e2b...
    -> current router ACCEPT + policy integration + push
    -> broker returns/pushes exact postIntegrationAuthoritySha
    -> root resolves + immutably attests exact remote-ref equality
    -> codex_goal_project_refill_worker starts exactly one independent P1.R2 reviewer
      -> exact focused command + semantic/auth/error/cursor/kernel-size review
        -> typecheck + Prettier/diff + two-path scope + classified scans
          -> strict terminal result + broker-captured immutable output binding both exact paths
            -> semantic/content/gate finding -> REJECT -> HOLD
            -> authority-attestation/admission/environment runtime incident -> HOLD
               at most one serialized exact corrected attempt
            -> ACCEPT 0/0/0 -> root mechanical verification -> mark_reviewed
              -> broker integrates and pushes exact two outputs -> HOLD
                -X-> later docs router alone may authorize P1.I; it never reintegrates evidence
```

| Lane  | Packet                           | Dependency                 | Evidence                | Capacity |
| ----- | -------------------------------- | -------------------------- | ----------------------- | -------- |
| P1.R2 | `phase-01/lanes/p1-r2-review.md` | accepted integrated router | `P1.R2.SEMANTIC_REVIEW` | one      |

There is one reviewer slot and no concurrent duplicate. The reviewer may not launch a worker,
reviewer, controller, or successor. Missing or failed output is a runtime incident, not completion.
After terminal/no-runner proof, root may use at most one exact corrected attempt for the four runtime
incident classes; rejected evidence never creates retry or refill authority.

## Ownership

The docs-router author owns exactly:

1. `docs/hosted-web-phases/EXECUTION_INDEX.json`
2. `docs/hosted-web-phases/README.md`
3. `docs/hosted-web-phases/START_HERE.md`
4. `docs/hosted-web-phases/phase-01/README.md`
5. `docs/hosted-web-phases/phase-01/controller-packet.md`
6. `docs/hosted-web-phases/phase-01/execution-dag.md`
7. `docs/hosted-web-phases/phase-01/lanes/p1-r2-review.md`

The P1.R2 reviewer owns exactly:

1. `.codex-handoff/phase-01-p1-r2.json`
2. `docs/research/hosted-web/phase-1/reviews/list-semantics.md`

All product, tests, fixtures, prior handoffs, historical lanes, research, evidence, scripts,
configuration, packages, lockfiles, runtime, orchestration implementation, and integration paths are
read-only. There is no compile-coherence or generated-file exception.

## Review gates

The exact focused command is:

```bash
pnpm exec vitest run test/architecture/hosted-web/phase-1/contracts test/features/team-lifecycle
```

It must pass exactly 5 files and 14/14 tests. The reviewer must independently prove every
semantic/auth/error/cursor/kernel-size requirement and both negative diagnostics frozen in the lane
packet.

`pnpm typecheck` must match the exact current accepted baseline: seven inherited Phase 0 diagnostics,
zero diagnostics in the reviewed product inputs or two reviewer outputs, and zero unexpected diagnostics.
The exact seven file/code/location records are frozen in the lane packet; any drift fails.

The lane's local post-integration-authority-`HEAD`, reviewed-product-snapshot topology and
byte-equality checks, exact
Prettier command, `git diff --check`, `git diff --cached --quiet`, clean tracked diff, and exact
two-untracked-path status must pass. Root's pre-start snapshot must record the exact `git ls-remote`
command, exit code, output, equality result, broker-returned pushed commit, and clean state. The
reviewer validates that immutable attestation and local `HEAD` without GitHub or network access. The
secret, provider, and private-path scans must cover all 32 inputs
and both outputs, record exit codes, and classify every lexical match. Any unsafe or unclassified
value fails.

The reviewer result and handoff must agree on provenance, independence, commands, observed counts,
scope, disposition, findings, unverified claims, blocked successors, and terminal `HOLD`.
Completion additionally requires the broker-captured immutable output and strict terminal result to
agree on the bytes and hashes of both exact result paths. Runtime observations such as
`changedFiles`, heartbeat, PID, tmux, and `providerObserved` are not completion evidence.

## Monitoring and stop policy

Root observes only reviewer existence, identity/profile, output freshness, exact scope, command
completion, strict terminal state, and final disposition. `controller-v17` observes but cannot
intervene or start work. Changed-file notices, heartbeat, PID, tmux, and `providerObserved` signals
remain non-terminal observations even when all look healthy.

Classify stops without collapsing execution failures into review findings:

- A strict reviewer result establishing reviewed-product-snapshot, parent-order, accepted-predecessor,
  reviewed-input/output-scope drift,
  semantic/auth/error/cursor/kernel-size defects,
  test/typecheck/Prettier/diff/scan failure, unsafe content, incomplete evidence content, or any other
  review gate finding is `REJECT` and `HOLD`. It authorizes no repair or retry.
- Unresolved/mismatched authority, missing/invalid immutable authority attestation, authority checkout
  mismatch, admission failure or drift, provider failure, root remote-query/network failure,
  environment failure, or absence of a strict terminal result is a runtime incident and `HOLD`, never
  `REJECT`. It authorizes no concurrent duplicate.
  Root may authorize at most one exact corrected attempt only after terminal/no-runner proof.
- Any P1.I, P1.F, Phase 2+, product-worker, or successor-controller activity remains an immediate
  `HOLD` policy violation and creates no authority.

## Disposition and policy-integration boundary

The reviewer writes only `.codex-handoff/phase-01-p1-r2.json` and
`docs/research/hosted-web/phase-1/reviews/list-semantics.md`. The Markdown file carries the sole formal
`Disposition: ACCEPT | REJECT`; the handoff maps it to `P1.R2.SEMANTIC_REVIEW`.

Only `ACCEPT` with every gate green and P0/P1/P2 `0/0/0` may be considered acceptable evidence.
Root mechanically verifies the strict terminal result, broker-captured immutable output, and both
bound result-path byte/hash pairs. On exact agreement it invokes `mark_reviewed`; only then does the
broker integrate and push exactly those two paths. Neither root nor the reviewer stages, commits,
integrates, or pushes them, and no other path may enter that broker integration.

That integration adopts `P1.R2.SEMANTIC_REVIEW` but authorizes no later node. P1.I, P1.F, Phase 2+,
and product workers remain blocked. A later docs-only router must independently review the already
integrated accepted evidence before it may authorize P1.I; it must never integrate the P1.R2 handoff
or result again. No successor controller is implied or authorized.

## Definition of Done

P1.R2 review is complete only when root has both a strict terminal result and broker-captured
immutable output binding both exact result paths from the sole active attempt; the handoff is valid;
`P1.R2.SEMANTIC_REVIEW` is `target_verified`; every required check and scan is recorded; the
disposition is explicit; P0/P1/P2 counts are complete; authority and snapshot bindings are exact;
the 32 reviewed product inputs are unchanged; and the work ends `HOLD`. No observation-only signal
can satisfy this definition.

For `ACCEPT` 0/0/0, lifecycle completion additionally requires root mechanical verification of the
terminal result, immutable output, and bound evidence bytes; `mark_reviewed`; and broker integration
and push of exactly the two outputs. The broker's push does not unblock P1.I.

This controller packet is not Phase 1 completion. P1.I, P1.F, Phase 2+, and product workers remain
blocked until a later separately reviewed docs router authorizes P1.I from the already integrated
accepted P1.R2 evidence.

## Exact docs-router checks

Run from the repository root with `PATH=/usr/local/bin:/usr/bin:/bin:$PATH`:

```bash
node <<'NODE'
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')

const packetBase = '48d79e2b13e258fc82ad55723875f15d6e162872'
const authorityBinding = 'postIntegrationAuthoritySha'
const reviewedProductSnapshot = '666042037a9c91df572b1d8274bf6024f8d00f40'
const remoteName = 'origin'
const remoteBranch = 'refactor/hosted-web-feature-boundaries'
const remoteRef = 'refs/heads/refactor/hosted-web-feature-boundaries'
const remoteEqualityCommand = `git ls-remote ${remoteName} ${remoteRef}`
const upstreamTrackingSyntax = '@' + '{upstream}'
const parents = [
  'c3135d40c6e70e4b2ddc905dc815407397197634',
  '3b48f9391b4bff1d82bc85ef01a2d5e0e5b50e95',
]
const revision = 'phase-01-p1-r2-router-r1'
const focused =
  'pnpm exec vitest run test/architecture/hosted-web/phase-1/contracts test/features/team-lifecycle'
const outputs = [
  '.codex-handoff/phase-01-p1-r2.json',
  'docs/research/hosted-web/phase-1/reviews/list-semantics.md',
]
const routerPaths = [
  'docs/hosted-web-phases/EXECUTION_INDEX.json',
  'docs/hosted-web-phases/README.md',
  'docs/hosted-web-phases/START_HERE.md',
  'docs/hosted-web-phases/phase-01/README.md',
  'docs/hosted-web-phases/phase-01/controller-packet.md',
  'docs/hosted-web-phases/phase-01/execution-dag.md',
  'docs/hosted-web-phases/phase-01/lanes/p1-r2-review.md',
]
const historicalLane = 'docs/hosted-web-phases/phase-01/lanes/pr252-base-conflict-resolution.md'
const historicalLaneHash = 'f55c7d77f7cb54d90208fb6fe6f61e257fa75f0b063b5fd71e5677c83d148842'
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right)
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

const index = JSON.parse(fs.readFileSync(routerPaths[0], 'utf8'))
assert.equal(index.currentRouterRevision, revision)
assert.equal(index.currentRouterTerminalState, 'HOLD')
assert.equal(index.currentExecutablePhase, 'phase-01')
assert.equal(index.currentExecutableSubphase, 'P1.R2-semantic-review')
assert(exact(index.currentExecutableNodes, ['P1.R2']))
assert.equal(index.canonicalAuthority.packetBaseSha, packetBase)
assert.equal(index.canonicalAuthority.packetBaseRole, 'router-remediation-authoring-base-only')
assert.equal(index.canonicalAuthority.postIntegrationAuthoritySha, null)
assert.equal(
  index.canonicalAuthority.postIntegrationAuthorityShaState,
  'resolve-after-router-accept-policy-integration-push'
)
assert.equal(
  index.canonicalAuthority.postIntegrationAuthoritySource,
  'exact-broker-returned-and-pushed-commit'
)
assert.equal(index.canonicalAuthority.reviewAuthorityBinding, authorityBinding)
assert.equal(index.canonicalAuthority.remoteName, remoteName)
assert.equal(index.canonicalAuthority.remoteBranch, remoteBranch)
assert.equal(index.canonicalAuthority.remoteRef, remoteRef)
assert.equal(index.canonicalAuthority.remoteEqualityCommand, remoteEqualityCommand)
assert(index.canonicalAuthority.rootImmutableAuthorityAttestationRequired)
assert(index.canonicalAuthority.cleanPostIntegrationWorktreeRequired)
assert(index.canonicalAuthority.remoteEqualityToPostIntegrationAuthorityRequired)
assert(!index.canonicalAuthority.reviewerNetworkRecheckAuthorized)
assert(!index.canonicalAuthority.upstreamTrackingEvidenceAuthorized)
assert(index.canonicalAuthority.mustBeResolvedAndAttestedBeforeReviewerStart)
assert.equal(index.canonicalAuthority.missingOrMismatchedAttestationDisposition, 'HOLD')
assert.equal(index.reviewedProductSnapshotAuthority.reviewedProductSnapshotSha, reviewedProductSnapshot)
assert.equal(index.reviewedProductSnapshotAuthority.unchangedExactInputPathCount, 32)
assert(index.reviewedProductSnapshotAuthority.unchangedAtPostIntegrationAuthorityHeadRequired)
assert(index.reviewedProductSnapshotAuthority.trueTwoParentMerge)
assert(exact(index.reviewedProductSnapshotAuthority.orderedParents, parents))
assert(index.reviewedProductSnapshotAuthority.pr252ConflictGateAccepted)
assert(index.reviewedProductSnapshotAuthority.p11dAccepted)

assert.equal(index.orchestrationAuthority.rootRole, 'sole-orchestrator')
assert.equal(index.orchestrationAuthority.durableController, 'controller-v17')
assert.equal(index.orchestrationAuthority.controllerState, 'HOLD')
assert.equal(index.orchestrationAuthority.controllerMode, 'observation-only')
assert(!index.orchestrationAuthority.controllerLaunchAuthorized)
assert(!index.orchestrationAuthority.controllerIntegrationAuthorized)
assert(!index.orchestrationAuthority.successorControllerAuthorized)
assert.equal(index.orchestrationAuthority.acceptedResultMechanicalVerifier, 'root')
assert.equal(index.orchestrationAuthority.acceptedResultLifecycleAction, 'mark_reviewed')
assert.equal(index.orchestrationAuthority.acceptedResultIntegrator, 'broker')

assert(exact(index.reviewerProfile, {
  model: 'gpt-5.6-sol',
  reasoningEffort: 'xhigh',
  serviceTier: 'default',
}))
assert(!hasKey(index, 'fastMode'))
assert(collectKey(index, 'serviceTier').length > 0)
assert(collectKey(index, 'serviceTier').every((value) => value === 'default'))
assert(exact(index.currentRoute.dependencyPolicy, {
  materializedBy: 'broker',
  mode: 'offline',
  workerInstallAuthorized: false,
  workerFetchOrUpdateAuthorized: false,
}))
assert(index.currentRoute.launchGate.required.dependenciesBrokerMaterializedOffline)
assert(index.currentRoute.launchGate.required.workerDependencyInstallDisabled)
assert(index.currentRoute.launchGate.required.postIntegrationAuthorityResolvedFromBrokerReturn)
assert(index.currentRoute.launchGate.required.postIntegrationAuthorityPushed)
assert(index.currentRoute.launchGate.required.postIntegrationAuthorityAttestationImmutable)
assert(index.currentRoute.launchGate.required.postIntegrationWorktreeClean)
assert(index.currentRoute.launchGate.required.postIntegrationAuthorityRemoteEqual)
assert(index.currentRoute.launchGate.required.reviewerWorktreeHeadExact)
assert(index.currentRoute.launchGate.required.handoffAuthorityBindingsExact)
assert(index.currentRoute.launchGate.required.remoteEqualityUsesExactLsRemoteRef)
assert(index.currentRoute.launchGate.required.upstreamTrackingEvidenceForbidden)
assert(index.currentRoute.launchGate.required.reviewerNetworkRecheckForbidden)
assert(index.currentRoute.launchGate.required.reviewedProductSnapshotExact)
assert(index.currentRoute.launchGate.required.reviewedProductSnapshotInputsUnchanged)
assert(index.currentRoute.launchGate.required.reviewedProductSnapshotOrderedMergeParentsExact)
assert(exact(index.currentRoute.completionProof.required, [
  'strict-terminal-result',
  'immutable-output',
]))
assert(index.currentRoute.completionProof.immutableOutputBindsExactResultPaths)
assert(exact(index.currentRoute.completionProof.immutableOutputPaths, outputs))
assert(exact(index.currentRoute.completionProof.insufficientSignals, [
  'changedFiles',
  'heartbeat',
  'PID',
  'tmux',
  'providerObserved',
]))
assert(exact(index.currentRoute.resultClassification.reviewFindingClasses, [
  'semantic',
  'content',
  'gate',
]))
assert.equal(index.currentRoute.resultClassification.reviewFindingDisposition, 'REJECT')
assert(exact(index.currentRoute.resultClassification.runtimeIncidentClasses, [
  'admission',
  'provider',
  'environment',
  'no-strict-result',
]))
assert.equal(index.currentRoute.resultClassification.runtimeIncidentDisposition, 'HOLD')
assert.equal(
  index.currentRoute.resultClassification.missingAuthorityAttestationClassification,
  'runtime-admission-incident'
)
assert.equal(
  index.currentRoute.resultClassification.remoteQueryOrNetworkFailureClassification,
  'runtime-environment-incident'
)
assert(!index.currentRoute.resultClassification.syntheticRejectForRuntimeIncidentAuthorized)
assert.equal(index.currentRoute.attemptPolicy.maxConcurrentAttempts, 1)
assert.equal(index.currentRoute.attemptPolicy.maxCorrectedAttempts, 1)
assert(exact(index.currentRoute.attemptPolicy.correctedAttemptOnlyFor, [
  'admission',
  'provider',
  'environment',
  'no-strict-result',
]))
assert(index.currentRoute.attemptPolicy.priorAttemptTerminalOrNoRunnerProofRequired)
assert(index.currentRoute.attemptPolicy.exactAssignmentRequired)
assert(!index.currentRoute.attemptPolicy.correctedAttemptAfterRejectAuthorized)
assert.equal(index.currentRoute.acceptedResultLifecycle.requiredDisposition, 'ACCEPT')
assert(exact(index.currentRoute.acceptedResultLifecycle.requiredFindingCounts, {
  P0: 0,
  P1: 0,
  P2: 0,
}))
assert(index.currentRoute.acceptedResultLifecycle.rootMechanicalVerificationRequired)
assert.equal(index.currentRoute.acceptedResultLifecycle.markReviewedAction, 'mark_reviewed')
assert(index.currentRoute.acceptedResultLifecycle.markReviewedRequiredBeforeIntegration)
assert.equal(index.currentRoute.acceptedResultLifecycle.integrationActor, 'broker')
assert(exact(index.currentRoute.acceptedResultLifecycle.integrationPaths, outputs))
assert(index.currentRoute.acceptedResultLifecycle.pushRequired)
assert(!index.currentRoute.acceptedResultLifecycle.authorizesP1I)
assert.equal(
  index.currentRoute.acceptedResultLifecycle.p1iAuthorizationAuthority,
  'later-separately-reviewed-docs-router-only'
)
assert(!index.currentRoute.acceptedResultLifecycle.laterDocsRouterReintegratesEvidence)
const reviewInputs = index.reviewCanonicalInputs
assert.equal(reviewInputs.reviewedProductSnapshotSha, reviewedProductSnapshot)
assert.equal(reviewInputs.authorityShaBinding, authorityBinding)
assert(reviewInputs.allInputBytesUnchangedAtPostIntegrationAuthorityHeadRequired)
assert.equal(reviewInputs.requiredP11aPathCount, 12)
assert.equal(reviewInputs.requiredP11dPathCount, 9)
assert.equal(reviewInputs.requiredSemanticCorpusPathCount, 11)
assert.equal(reviewInputs.requiredTotalPathCount, 32)
const exactInputPaths = [
  ...reviewInputs.p11aPaths,
  ...reviewInputs.p11dPaths,
  ...reviewInputs.semanticCorpusPaths,
]
assert.equal(exactInputPaths.length, 32)
assert.equal(new Set(exactInputPaths).size, 32)
assert.equal(index.reviewAdmission.reviewerCount, 1)
assert(index.reviewAdmission.freshIndependentReviewerRequired)
assert.equal(index.reviewAdmission.projectScopedControlOperation, 'codex_goal_project_refill_worker')
assert.equal(index.reviewAdmission.workerRole, 'reviewer')
assert.equal(index.reviewAdmission.sourceRemote, remoteName)
assert.equal(index.reviewAdmission.sourceBranch, remoteBranch)
assert.equal(index.reviewAdmission.expectedSourceCommitBinding, authorityBinding)
assert.equal(index.reviewAdmission.worktreeHeadShaBinding, authorityBinding)
assert.equal(index.reviewAdmission.handoffAuthorityBindingSource, authorityBinding)
assert(exact(index.reviewAdmission.handoffAuthorityFields, [
  'baseSha',
  'canonicalSha',
  'planBundleCommit',
  'phaseStartSha',
  'headSha',
]))
assert.equal(index.reviewAdmission.preStartAdmission.mode, 'serial-builtin')
assert(exact(index.reviewAdmission.preStartAdmission.contract, {
  kind: 'worker-launch',
  format: 1,
  canonicalShaBinding: authorityBinding,
  baseShaBinding: authorityBinding,
  phaseStartShaBinding: authorityBinding,
  packetRevision: 'phase-01-p1-r2-review-r1',
  controllerPacket: 'docs/hosted-web-phases/phase-01/controller-packet.md',
  lanePacket: 'docs/hosted-web-phases/phase-01/lanes/p1-r2-review.md',
  phaseId: 'phase-01',
  laneId: 'p1-r2',
  inputPatchHash: null,
  reviewKind: 'review',
}))
assert(!index.reviewAdmission.prepareVerifierAuthorized)
assert(exact(index.reviewAdmission.forbiddenReviewerLaunchOperations, [
  'codex_goal_project_prepare_verifier',
  'prepare_verifier',
]))
assert.equal(index.reviewAdmission.reviewedProductSnapshotSha, reviewedProductSnapshot)
assert.equal(
  index.reviewAdmission.remoteEqualityAttestedBy,
  'root-pre-start-immutable-authority-attestation'
)
assert.equal(index.reviewAdmission.remoteEqualityCommand, remoteEqualityCommand)
assert(!index.reviewAdmission.reviewerRemoteEqualityRecheckAuthorized)
assert.equal(index.reviewAdmission.focusedCommand, focused)
assert(exact(index.reviewAdmission.writablePaths, outputs))
assert.equal(index.reviewAdmission.evidenceId, 'P1.R2.SEMANTIC_REVIEW')
assert.equal(index.reviewAdmission.dependenciesMaterializedBy, 'broker')
assert.equal(index.reviewAdmission.dependencyMaterializationMode, 'offline')
assert(!index.reviewAdmission.workerDependencyInstallAuthorized)
assert(!index.reviewAdmission.reviewerSelfRetryOrRefillAuthority)
assert.equal(
  index.reviewAdmission.rootCorrectedAttemptAuthority,
  'at-most-one-under-runtime-incident-policy'
)
assert(!index.reviewAdmission.reviewerIntegrationAuthority)
const packetBaseCheck = index.requiredChecks.find((check) => check.id === 'packet-authoring-base-head')
assert.equal(packetBaseCheck.actor, 'router-author')
assert(packetBaseCheck.command.includes(packetBase))
const rootRemoteCheck = index.requiredChecks.find(
  (check) => check.id === 'post-integration-authority-explicit-remote-ref-equality'
)
assert.equal(rootRemoteCheck.actor, 'root-pre-start')
assert.equal(rootRemoteCheck.command, remoteEqualityCommand)
assert.equal(rootRemoteCheck.requiredShaBinding, authorityBinding)
const reviewerHeadCheck = index.requiredChecks.find(
  (check) => check.id === 'reviewer-local-authority-head'
)
assert.equal(reviewerHeadCheck.actor, 'reviewer')
assert.equal(reviewerHeadCheck.expectedSourceCommitBinding, authorityBinding)
assert(!reviewerHeadCheck.command.includes(packetBase))
assert(exact(index.requiredExactResults.focused, { testFiles: 5, passed: 14, total: 14 }))
assert(exact(index.requiredExactResults.nativeTypeScript, {
  inherited: 7,
  owned: 0,
  unexpected: 0,
}))
assert(exact(index.acceptance.acceptFindingCounts, { P0: 0, P1: 0, P2: 0 }))
assert.equal(index.acceptance.reviewFindingDisposition, 'REJECT')
assert.equal(index.acceptance.runtimeIncidentDisposition, 'HOLD')
assert(!index.reviewerExecutionPolicy.network)
assert(!index.reviewerExecutionPolicy.githubAccess)
assert(!index.reviewerExecutionPolicy.remoteQuery)
assert(!index.reviewerExecutionPolicy.fetch)
assert(!index.reviewerExecutionPolicy.dependencyInstall)
assert(!index.reviewerExecutionPolicy.stage)
assert(!index.reviewerExecutionPolicy.commit)
assert(!index.reviewerExecutionPolicy.merge)
assert(!index.reviewerExecutionPolicy.push)
assert(!index.reviewerExecutionPolicy.reviewIntegration)
assert(exact(index.authorization.authorizedNow, []))
assert(!index.authorization.reviewerIntegrationAuthorized)
assert(!index.authorization.rootGitIntegrationAuthorized)
assert(index.authorization.brokerAcceptedEvidenceIntegrationAuthorized)
assert(index.authorization.brokerAcceptedEvidencePushAuthorized)
assert(exact(
  index.authorization.conditionallyAuthorizedAfterStrictAcceptMechanicalVerificationAndMarkReviewed,
  ['broker-integrate-and-push-exact-p1-r2-evidence-paths']
))
assert(exact(index.authorization.brokerAcceptedEvidenceIntegrationPaths, outputs))
assert(index.authorization.brokerIntegrationRequiresRootMechanicalVerification)
assert(index.authorization.brokerIntegrationRequiresMarkReviewed)
assert(!index.authorization.p1iAuthorized)
assert(!index.authorization.p1fAuthorized)
assert(!index.authorization.phase2PlusAuthorized)
assert.equal(index.authorization.p1iAuthorizationAuthority, 'later-separately-reviewed-docs-router-only')
assert(!index.authorization.laterDocsRouterReintegratesP1R2Evidence)
assert(exact(index.authorization.blockedUntilLaterDocsRouterAuthorization, [
  'P1.I',
  'P1.F',
  'Phase 2+',
  'product workers',
]))
assert(exact(index.routerExclusiveOwnership, routerPaths))

assert.equal(
  crypto.createHash('sha256').update(fs.readFileSync(historicalLane)).digest('hex'),
  historicalLaneHash
)
for (const packet of [index.packetHashes.controllerPacket, index.packetHashes.lanePacket]) {
  const actual = crypto.createHash('sha256').update(fs.readFileSync(packet.path)).digest('hex')
  assert.equal(actual, packet.sha256, `packet hash drift ${packet.path}`)
}
for (const routerPath of routerPaths) {
  const text = fs.readFileSync(routerPath, 'utf8')
  assert(!text.includes(upstreamTrackingSyntax), `upstream-tracking assumption ${routerPath}`)
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

console.log('phase-01-p1-r2-router-r1: ok')
NODE
test "$(git rev-parse HEAD)" = 48d79e2b13e258fc82ad55723875f15d6e162872
test "$(git rev-list --parents -n 1 HEAD)" = \
  "48d79e2b13e258fc82ad55723875f15d6e162872 666042037a9c91df572b1d8274bf6024f8d00f40"
test "$(git rev-list --parents -n 1 666042037a9c91df572b1d8274bf6024f8d00f40)" = \
  "666042037a9c91df572b1d8274bf6024f8d00f40 c3135d40c6e70e4b2ddc905dc815407397197634 3b48f9391b4bff1d82bc85ef01a2d5e0e5b50e95"
mapfile -t review_input_paths < <(node -e \
  "const i=require('./docs/hosted-web-phases/EXECUTION_INDEX.json').reviewCanonicalInputs; console.log([...i.p11aPaths,...i.p11dPaths,...i.semanticCorpusPaths].join('\\n'))")
test "${#review_input_paths[@]}" -eq 32
git diff --exit-code \
  666042037a9c91df572b1d8274bf6024f8d00f40 \
  48d79e2b13e258fc82ad55723875f15d6e162872 \
  -- "${review_input_paths[@]}"
git diff --exit-code \
  48d79e2b13e258fc82ad55723875f15d6e162872 \
  -- "${review_input_paths[@]}"
git diff --cached --quiet
actual_paths=$(git status --short | sed 's/^...//')
expected_paths=$(printf '%s\n' \
  docs/hosted-web-phases/EXECUTION_INDEX.json \
  docs/hosted-web-phases/README.md \
  docs/hosted-web-phases/START_HERE.md \
  docs/hosted-web-phases/phase-01/README.md \
  docs/hosted-web-phases/phase-01/controller-packet.md \
  docs/hosted-web-phases/phase-01/execution-dag.md \
  docs/hosted-web-phases/phase-01/lanes/p1-r2-review.md)
test "$actual_paths" = "$expected_paths"
git diff --exit-code HEAD -- docs/hosted-web-phases/phase-01/lanes/pr252-base-conflict-resolution.md
pnpm exec prettier --check \
  docs/hosted-web-phases/EXECUTION_INDEX.json \
  docs/hosted-web-phases/README.md \
  docs/hosted-web-phases/START_HERE.md \
  docs/hosted-web-phases/phase-01/README.md \
  docs/hosted-web-phases/phase-01/controller-packet.md \
  docs/hosted-web-phases/phase-01/execution-dag.md \
  docs/hosted-web-phases/phase-01/lanes/p1-r2-review.md
git diff --check
```

The docs-router `HEAD`, parent, and 32-input diff checks above use `packetBaseSha` only to verify this
uncommitted seven-path authoring workspace. They do not resolve or attest formal-review authority.
This router author must not pre-run the future root launch gate or bind remote equality to
`packetBaseSha`; root performs that gate only after the broker returns and pushes
`postIntegrationAuthoritySha`.

Also scan exactly the seven router paths for secret values, auth/provider payloads, private user or
real-project paths, and non-default service-tier authority. Classify required model/profile metadata,
scan-pattern literals, and repository-relative paths explicitly. JSON must parse; every relative link
must resolve; only the exact seven paths may differ; the old PR #252 lane must retain its recorded
hash; every machine `serviceTier` value must be `default`; and no machine request may contain a
`fastMode` field.

## Router HOLD

The router author performs no fetch, dependency installation, stage, commit, merge, push, lifecycle,
runtime, team, provider, real-project, review, integration, or successor-controller action. After
validation and self-review, return the seven-path diff and end `HOLD`.

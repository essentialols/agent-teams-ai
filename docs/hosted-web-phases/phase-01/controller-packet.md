# Phase 1 controller packet: P1.R2 semantic review router

## Status and authority

- Phase/current node: `phase-01` / `P1.R2`
- Router revision: `phase-01-p1-r2-router-r1`
- Lane packet revision: `phase-01-p1-r2-review-r1`
- Canonical/base/phase start/`HEAD`:
  `666042037a9c91df572b1d8274bf6024f8d00f40`
- Canonical state: clean and remote-equal
- Accepted merge topology: true two-parent merge with ordered parents
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

Produce one independent formal `ACCEPT` or `REJECT` review of the canonical shared hosted kernel and
team-lifecycle list semantics, with explicit P0/P1/P2 counts and exact gate evidence. `ACCEPT` is
legal only at P0/P1/P2 `0/0/0`. Semantic, content, or review-gate findings produce `REJECT`.

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

Canonical `666042037a9c91df572b1d8274bf6024f8d00f40` is the sole review target, base, phase start,
and `HEAD`. It must remain clean and remote-equal before reviewer start. Its exact parent order is
binding and must be re-proved without fetch or rebinding.

The accepted PR #252 lane at
[`lanes/pr252-base-conflict-resolution.md`](lanes/pr252-base-conflict-resolution.md) remains
byte-for-byte historical with SHA-256
`f55c7d77f7cb54d90208fb6fe6f61e257fa75f0b063b5fd71e5677c83d148842`. It is not current
authority and must not change in this router.

The review input is exactly the 32 paths in
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
2. `HEAD`, canonical, base, and phase start are the exact stored
   `666042037a9c91df572b1d8274bf6024f8d00f40` review target;
3. the canonical target is clean and remote-equal and has exactly the two ordered parents above;
4. the PR #252 conflict gate and P1.1D remain accepted, with no reopened predecessor work;
5. root remains sole orchestrator and `controller-v17` remains `HOLD`, observation-only;
6. no P1.R2 reviewer exists or is active, and the fresh identity/job/worktree independence gate
   passes;
7. the request is exactly `gpt-5.6-sol`, `xhigh`, and `serviceTier: "default"`, with no Fast mode;
8. the broker has materialized dependencies offline and the assignment forbids the worker from
   installing, fetching, or updating them;
9. the exact 32 inputs exist at canonical and both output paths are absent; and
10. no product worker, P1.I, P1.F, Phase 2+, integration, or successor-controller activity exists.

Any admission mismatch ends `HOLD` without launch. There is no replacement, fallback, refill, or
profile substitution authority. One exact corrected attempt is the sole exception: root may
authorize it only for an admission, provider, environment, or no-strict-result runtime incident,
only after proving the affected attempt terminal or proving no runner exists, and never while
another attempt is active. No corrected attempt follows a semantic, content, or gate `REJECT`.

## DAG, lane registry, and capacity

The serial DAG is:

```text
accepted canonical 66604203...
  -> current seven-path router ACCEPT + policy integration + push
    -> exactly one independent P1.R2 reviewer
      -> exact focused command + semantic/auth/error/cursor/kernel-size review
        -> typecheck + Prettier/diff + two-path scope + classified scans
          -> strict terminal result + broker-captured immutable output binding both exact paths
            -> semantic/content/gate finding -> REJECT -> HOLD
            -> runtime incident -> HOLD; at most one serialized exact corrected attempt
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
zero diagnostics in the canonical P1 inputs or two reviewer outputs, and zero unexpected diagnostics.
The exact seven file/code/location records are frozen in the lane packet; any drift fails.

The lane's exact Prettier command, `git diff --check`, `git diff --cached --quiet`, clean tracked diff,
and exact two-untracked-path status must pass. The secret, provider, and private-path scans must cover
all 32 inputs and both outputs, record exit codes, and classify every lexical match. Any unsafe or
unclassified value fails.

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

- A strict reviewer result establishing stale or mixed SHA, parent-order or accepted-predecessor
  drift, canonical/input/output-scope drift, semantic/auth/error/cursor/kernel-size defects,
  test/typecheck/Prettier/diff/scan failure, unsafe content, incomplete evidence content, or any other
  review gate finding is `REJECT` and `HOLD`. It authorizes no repair or retry.
- Admission failure or drift, provider failure, environment failure, or absence of a strict terminal
  result is a runtime incident and `HOLD`, never `REJECT`. It authorizes no concurrent duplicate.
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
disposition is explicit; P0/P1/P2 counts are complete; the canonical input is unchanged; and the
work ends `HOLD`. No observation-only signal can satisfy this definition.

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

const canonical = '666042037a9c91df572b1d8274bf6024f8d00f40'
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
assert.equal(index.canonicalAuthority.canonicalSha, canonical)
assert.equal(index.canonicalAuthority.baseSha, canonical)
assert.equal(index.canonicalAuthority.phaseStartSha, canonical)
assert.equal(index.canonicalAuthority.headSha, canonical)
assert(index.canonicalAuthority.clean && index.canonicalAuthority.remoteEqual)
assert(index.canonicalAuthority.trueTwoParentMerge)
assert(exact(index.canonicalAuthority.orderedParents, parents))
assert(index.canonicalAuthority.pr252ConflictGateAccepted)
assert(index.canonicalAuthority.p11dAccepted)

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
assert.equal(index.reviewAdmission.reviewerCount, 1)
assert(index.reviewAdmission.freshIndependentReviewerRequired)
assert.equal(index.reviewAdmission.focusedCommand, focused)
assert(exact(index.reviewAdmission.writablePaths, outputs))
assert.equal(index.reviewAdmission.evidenceId, 'P1.R2.SEMANTIC_REVIEW')
assert.equal(index.reviewAdmission.dependenciesMaterializedBy, 'broker')
assert.equal(index.reviewAdmission.dependencyMaterializationMode, 'offline')
assert(!index.reviewAdmission.workerDependencyInstallAuthorized)
assert(!index.reviewAdmission.reviewerRetryOrRefillAuthority)
assert.equal(
  index.reviewAdmission.rootCorrectedAttemptAuthority,
  'at-most-one-under-runtime-incident-policy'
)
assert(!index.reviewAdmission.reviewerIntegrationAuthority)
assert(exact(index.requiredExactResults.focused, { testFiles: 5, passed: 14, total: 14 }))
assert(exact(index.requiredExactResults.nativeTypeScript, {
  inherited: 7,
  owned: 0,
  unexpected: 0,
}))
assert(exact(index.acceptance.acceptFindingCounts, { P0: 0, P1: 0, P2: 0 }))
assert.equal(index.acceptance.reviewFindingDisposition, 'REJECT')
assert.equal(index.acceptance.runtimeIncidentDisposition, 'HOLD')
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
test "$(git rev-parse HEAD)" = 666042037a9c91df572b1d8274bf6024f8d00f40
test "$(git rev-list --parents -n 1 HEAD)" = \
  "666042037a9c91df572b1d8274bf6024f8d00f40 c3135d40c6e70e4b2ddc905dc815407397197634 3b48f9391b4bff1d82bc85ef01a2d5e0e5b50e95"
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

# Phase 1 controller packet: P1.I integration-freeze router

## Status and authority

- Phase/current node: `phase-01` / `P1.I`
- Router revision: `phase-01-p1-i-router-r1`
- Lane packet revision: `phase-01-p1-i-integration-r1`
- Router `packetBaseSha`: `c5d842f75ca7a647a0773b0c30d303d7da21d1d6`
- Packet-base role: integrated P1.R2 `ACCEPT` evidence and this router's authoring base
- Accepted P1.R2 review authority SHA: `f6794b607609c57dc92def696d05946c9c96856a`
- Accepted P1.R2 reviewed-product snapshot SHA:
  `666042037a9c91df572b1d8274bf6024f8d00f40`
- Producer `postIntegrationAuthoritySha`: intentionally unresolved until independent router review,
  broker integration, and push
- Root role: sole orchestrator
- Durable controller: `controller-v17`, `HOLD`, observation-only
- Capacity: exactly one P1.I producer after the launch gate, then exactly one fresh independent P1.I
  milestone reviewer after producer termination and immutable output capture
- Producer and reviewer profile: `gpt-5.6-sol`, `xhigh`, `serviceTier: "default"`; Fast is prohibited
- Producer evidence: `P1.I.INTEGRATION` and `P1.I.ROLLBACK`
- Router terminal state: `HOLD`

The accepted P1.R2 handoff and result are integrated at `c5d842f75…`, have strict disposition
`ACCEPT`, and contain P0/P1/P2 `0/0/0`. Those two files are frozen inputs and cannot be edited or
reintegrated. The P1.R2 lane packet is accepted history, not current execution authority.

Root may start P1.I only after this exact seven-path router is independently accepted,
broker-integrated, and pushed. Root then resolves the exact broker-returned pushed commit as
`postIntegrationAuthoritySha`, proves a clean worktree, and captures immutable equality to the sole
result of `git ls-remote origin refs/heads/refactor/hosted-web-feature-boundaries`. A moving branch or
upstream-tracking assumption is not evidence. The producer performs no network or remote query.

`controller-v17` cannot launch, admit, integrate, restart, replace itself, or create a successor.
This packet authorizes no successor controller.

## Outcome

Authorize one evidence-only P1.I producer to adopt the already integrated Phase 1 bytes serially,
close the full Phase 1 gate matrix, prove exact scratch-only forward/reverse rollback, and write a
five-file freeze candidate. The producer performs no product implementation, raw Git integration,
registry mutation, runtime/agent-flow test, or real-project access.

The producer must return `HOLD` after writing and verifying the candidate. Its work is not independent
acceptance and is not integration authority. This router serially authorizes exactly one fresh
independent milestone reviewer after producer termination and immutable five-path output capture. The
reviewer is read-only over the 68 frozen inputs plus five outputs and returns explicit `ACCEPT` or
`REJECT`. On `ACCEPT`, root may call `mark_reviewed`, then the broker may integrate and push exactly
the five outputs. P1.F still requires a separate reviewed router transition.

## Immutable inputs

Machine authority is `EXECUTION_INDEX.json`:

- `acceptedP1R2` freezes the exact integration, review, snapshot, disposition, finding counts, paths,
  and content hashes;
- `phase1CanonicalInputs` freezes 68 distinct read-only Phase 1 paths at
  `c5d842f75ca7a647a0773b0c30d303d7da21d1d6`;
- `rollbackPayload` freezes 54 distinct product/test/fixture/scanner paths that were absent at P1.S0
  bootstrap SHA `5f30df49…` and are present at the accepted P1.R2 integration SHA;
- `inheritedNativeTypeScriptDiagnostics` freezes exactly seven inherited Phase 0 diagnostics; and
- `outputs.writablePaths` reproduces exactly the five P1.I paths frozen under `ownerId: "P1.I"` in
  `bootstrap/ownership-manifest.json`.

All 68 canonical inputs must be byte-identical between the accepted P1.R2 integration SHA and the
future producer authority `HEAD`. Missing, additional, overlapping, or modified input is a stop, not
repair authority.

## Non-goals

This packet does not authorize:

- edits to product, tests, fixtures, scripts, configuration, packages, lockfiles, router history,
  P1.R1/P1.R2 evidence, or any non-output path;
- replay or integration of a producer patch or commit;
- staging, committing, merging, pushing, raw Git integration, or repository-index mutation;
- network, GitHub, fetch, dependency installation/update, provider checks, app/server/runtime/team
  launch, agent-flow tests, registry writes, or real-project access;
- production route, IPC, preload, renderer, HTTP, authorization, cursor-integrity, filesystem, or
  runtime claims;
- a reviewer concurrent with the producer or another reviewer, reviewer writes, integration before
  explicit reviewer `ACCEPT`, P1.F, Phase 2+, product work, controller replacement, or a successor
  controller.

## Definition of Ready

Root must prove the lane packet's complete start gate. In particular:

1. the router is independently accepted, broker-integrated, and pushed;
2. the exact broker-returned pushed commit is resolved and immutably attested as the remote branch
   authority;
3. local producer `HEAD`, admission `expectedSourceCommit`, and all five handoff authority fields bind
   that same SHA;
4. integrated P1.R2 evidence is exact, accepted, zero-finding, hash-matched, and unchanged;
5. all 68 canonical inputs match `c5d842f75…` byte-for-byte;
6. the exact five P1.I outputs are absent;
7. no P1.I producer or blocked successor is active;
8. the exact default-only model/effort/tier profile is admitted; and
9. dependencies are broker-materialized offline and worker installation/fetch/update is disabled.

Any failure ends `HOLD` without launch. No replacement, fallback, retry, refill, alternate profile,
or profile-tier substitution is authorized.

## DAG and capacity

```text
P1.R1 ACCEPT
  -> P1.1D accepted implementation/remediation
    -> P1.R2 ACCEPT 0/0/0
      -> exact two-path P1.R2 evidence integrated at c5d842f75...
        -> seven-path P1.I router authored at c5d842f75...
          -> independent router review
            -> broker integrates + pushes router
              -> root resolves/attests postIntegrationAuthoritySha
                -> exactly one P1.I producer
                  -> 68-input adoption + complete gates + evidence freeze
                    -> full Vitest 13/59 + focused ratchet 1/3
                    -> typecheck 7/0/0 + full lint + Prettier
                    -> scope/scans + 54-path scratch rollback/apply proof
                    -> exact five JSON outputs + strict producer result
                      -> HOLD
                        -> exactly one fresh independent P1.I milestone reviewer
                          -> read-only 68 frozen inputs + 5 immutable outputs
                            -> ACCEPT -> root mark_reviewed
                              -> broker integrates + pushes exactly five outputs
                                -> HOLD
                            -> REJECT -> HOLD without integration
                                -X-> P1.F requires a later separate reviewed transition
```

Capacity is one producer followed by one reviewer, never concurrently. A heartbeat, PID, tmux pane,
`providerObserved`, or changed-file notice does not establish completion. Producer completion
requires the strict terminal result and broker-captured immutable output binding all five output
bytes and hashes. Reviewer completion requires its strict immutable `ACCEPT` or `REJECT` result.

## Ownership

The docs-router author owns exactly:

1. `docs/hosted-web-phases/EXECUTION_INDEX.json`
2. `docs/hosted-web-phases/README.md`
3. `docs/hosted-web-phases/START_HERE.md`
4. `docs/hosted-web-phases/phase-01/README.md`
5. `docs/hosted-web-phases/phase-01/controller-packet.md`
6. `docs/hosted-web-phases/phase-01/execution-dag.md`
7. `docs/hosted-web-phases/phase-01/lanes/p1-i-integration.md`

The P1.I producer owns exactly:

1. `.codex-handoff/phase-01-p1-i.json`
2. `docs/research/hosted-web/phase-1/decision-register.json`
3. `docs/research/hosted-web/phase-1/estimate-reconciliation.json`
4. `docs/research/hosted-web/phase-1/evidence-index.json`
5. `docs/research/hosted-web/phase-1/integration-report.json`

Everything else is read-only. The P1.R2 evidence paths and `lanes/p1-r2-review.md` are explicitly
frozen. There is no generated-file, formatting, compile-coherence, or cleanup exception.

## Required producer gates

The lane packet is authoritative for commands and schemas. The producer must pass all 14 machine gate
IDs from the execution index. The broad checks are:

```bash
pnpm exec vitest run test/features/team-lifecycle test/architecture/hosted-web/phase-1
pnpm exec vitest run test/architecture/hosted-web/phase-1/parity/parity-references.test.ts
pnpm typecheck
pnpm lint
pnpm exec prettier --check <exact 68 inputs plus exact five outputs>
git diff --check
git diff --cached --quiet
git diff --exit-code
git status --short
```

Exact acceptance is 13/13 Vitest files and 59/59 tests; the focused ratchet file is 1/1 and 3/3.
Typecheck is exactly seven inherited, zero owned, and zero unexpected diagnostics. Full lint exits
zero. Prettier covers exactly 73 paths. Status resolves exactly the five untracked output paths, with
no tracked or staged change.

`P1.NEG.RATCHET_REGRESSION` must freshly prove both over-count-after-rename and expired-quarantine
rejection with `phase1-ratchet-regression`, while the pinned current references/counts pass. This proof
is recorded in the decision register, evidence index, integration report, and handoff.

The rollback gate creates a binary patch over exactly 54 paths between P1.S0 and accepted P1.R2
integration, applies and reverses it only in a new external scratch tree, compares all forward bytes to
the accepted SHA, proves all 54 paths absent after reverse, removes scratch narrowly, and re-proves the
repository unchanged. An actual repository apply is forbidden.

Classified scans cover the same exact 68 inputs plus five outputs. A real credential, auth/provider
payload, private or real-project path, task-temporary path value, raw command/runtime body, binary
output, or unclassified lexical match fails.

## Freeze artifact policy

The five outputs form one candidate freeze:

- `decision-register.json` resolves all ten Phase 1 gaps, all negative controls, predecessor reviews,
  risks, deferrals, narrowings, unverified production boundaries, and blocked successors.
- `estimate-reconciliation.json` counts each unique bucket and path once, records exact actuals and
  variance, and does not remove evidence to fit a range.
- `evidence-index.json` follows `EVIDENCE_LIFECYCLE.md`, preserves accepted predecessor authority,
  records real supersession only, and keeps the new P1.I rows generated/pending until independent
  review.
- `integration-report.json` records every gate, command, count, version, hash, scope, scan,
  rollback/apply observation, and unverified claim.
- `.codex-handoff/phase-01-p1-i.json` binds the two P1.I evidence IDs to the report, exact authority
  roles, exact five-path scope, result hashes, next action `independent-verification`, and terminal
  `HOLD`.

The producer must not self-approve or call the candidate independently accepted, integrated, or Phase
1/P1.F authorized.

## Monitoring and stop policy

Root observes only admitted identity/profile, immutable authority, useful output progress, exact scope,
command completion, strict terminal state, and final candidate status. `controller-v17` observes only.

Stop `HOLD` on authority or hash drift, invalid P1.R2 acceptance, missing input, changed immutable
input, output overlap, product/non-output change, dependency/config need, test/lint/format failure,
typecheck drift, unsafe or unclassified scan match, rollback failure, decision or estimate omission,
evidence lifecycle invalidity, stale packet, or unsupported claim. Do not repair an input, retry a
producer, or continue on a smaller subset.

Any reviewer launch before producer termination, concurrent reviewer, integration before explicit
reviewer `ACCEPT`, or P1.F/Phase 2+/product/successor-controller activity is a policy violation and
creates no authority.

## Producer completion and integration boundary

The producer emits the lane packet's one-line `P1_I_PRODUCER_RESULT` and ends `HOLD`. `VERIFIED`
requires all gates and exact outputs, but remains only a producer result.

After the producer is terminal and the broker has immutably captured the exact five-path output, root
must prove no producer or reviewer is active and may start exactly one fresh independent P1.I
milestone reviewer. The reviewer uses `gpt-5.6-sol`, `xhigh`, and `serviceTier: "default"`; Fast is
prohibited. It has read-only access to the exact 68 frozen inputs and five candidate outputs, no
repository writer or repair authority, and no retry or replacement authority.

The reviewer returns one immutable strict result with explicit `ACCEPT` or `REJECT`. `ACCEPT`
requires zero P0/P1/P2 findings and complete evidence that the five outputs satisfy the lane packet;
`REJECT` identifies at least one semantic, content, or gate finding. Admission, provider, environment,
or missing-result incidents end `HOLD` and are not synthetic `REJECT` results.

On `ACCEPT`, root mechanically verifies the result and may call `mark_reviewed`. Only after that
lifecycle action may the broker integrate and push exactly the five P1.I output paths. Neither root,
the producer, nor the reviewer performs raw Git integration. On `REJECT`, root may not mark reviewed
and the broker may not integrate. The already integrated P1.R2 files are never part of the P1.I
integration set.

Even after P1.I output integration, P1.F remains blocked until a separate reviewed router transition.
No successor controller is implied.

## Definition of Done

The P1.I producer candidate is complete only when the same admitted attempt has:

1. exact post-integration authority and unchanged 68-path input provenance;
2. all 14 gates passed and recorded;
3. full Phase 1 Vitest 13/59 and focused ratchet 1/3;
4. typecheck 7/0/0, full lint, exact Prettier, diff, ownership, and safety gates;
5. exact 54-path scratch forward/reverse proof;
6. coherent decision, estimate, evidence, integration, and handoff JSON;
7. exactly five output paths and complete non-cyclic hashes;
8. strict terminal result plus immutable output for all five paths; and
9. next action `independent-verification` with terminal `HOLD`.

That producer completion is not Phase 1 freeze adoption. The one authorized milestone review and,
only on `ACCEPT`, root `mark_reviewed` plus exact five-path broker integration remain serial lifecycle
steps. P1.F, Phase 2+, product workers, and successor controllers remain blocked.

## Exact docs-router checks

Run from the repository root with `PATH=/usr/local/bin:/usr/bin:/bin:$PATH`:

```bash
node <<'NODE'
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')

const base = 'c5d842f75ca7a647a0773b0c30d303d7da21d1d6'
const parent = 'f6794b607609c57dc92def696d05946c9c96856a'
const reviewSnapshot = '666042037a9c91df572b1d8274bf6024f8d00f40'
const revision = 'phase-01-p1-i-router-r1'
const laneRevision = 'phase-01-p1-i-integration-r1'
const outputs = [
  '.codex-handoff/phase-01-p1-i.json',
  'docs/research/hosted-web/phase-1/decision-register.json',
  'docs/research/hosted-web/phase-1/estimate-reconciliation.json',
  'docs/research/hosted-web/phase-1/evidence-index.json',
  'docs/research/hosted-web/phase-1/integration-report.json',
]
const routerPaths = [
  'docs/hosted-web-phases/EXECUTION_INDEX.json',
  'docs/hosted-web-phases/README.md',
  'docs/hosted-web-phases/START_HERE.md',
  'docs/hosted-web-phases/phase-01/README.md',
  'docs/hosted-web-phases/phase-01/controller-packet.md',
  'docs/hosted-web-phases/phase-01/execution-dag.md',
  'docs/hosted-web-phases/phase-01/lanes/p1-i-integration.md',
]
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right)
const sha = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
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
assert.equal(index.currentExecutableSubphase, 'P1.I-integration-freeze')
assert(exact(index.currentExecutableNodes, ['P1.I']))
assert.equal(index.canonicalAuthority.packetBaseSha, base)
assert.equal(index.canonicalAuthority.packetBaseParentSha, parent)
assert.equal(index.canonicalAuthority.acceptedP1R2IntegrationSha, base)
assert.equal(index.canonicalAuthority.postIntegrationAuthoritySha, null)
assert.equal(index.canonicalAuthority.producerAuthorityBinding, 'postIntegrationAuthoritySha')
assert.equal(index.acceptedP1R2.integrationSha, base)
assert.equal(index.acceptedP1R2.reviewAuthoritySha, parent)
assert.equal(index.acceptedP1R2.reviewedProductSnapshotSha, reviewSnapshot)
assert.equal(index.acceptedP1R2.disposition, 'ACCEPT')
assert(exact(index.acceptedP1R2.findingCounts, { P0: 0, P1: 0, P2: 0 }))
assert(!index.acceptedP1R2.modificationAuthorized)
assert(!index.acceptedP1R2.reintegrationAuthorized)
assert.equal(index.orchestrationAuthority.rootRole, 'sole-orchestrator')
assert.equal(index.orchestrationAuthority.durableController, 'controller-v17')
assert.equal(index.orchestrationAuthority.controllerState, 'HOLD')
assert(!index.orchestrationAuthority.controllerLaunchAuthorized)
assert(!index.orchestrationAuthority.successorControllerAuthorized)
assert.equal(
  index.orchestrationAuthority.reviewerStartAuthority,
  'root-after-producer-terminal-and-broker-captured-immutable-output'
)
assert.equal(index.orchestrationAuthority.acceptedResultLifecycleAction, 'mark_reviewed')
assert.equal(index.orchestrationAuthority.acceptedResultIntegrator, 'broker')
assert(exact(index.producerProfile, {
  model: 'gpt-5.6-sol',
  reasoningEffort: 'xhigh',
  serviceTier: 'default',
  fastAuthorized: false,
}))
assert(exact(index.reviewerProfile, index.producerProfile))
assert(!hasKey(index, 'fastMode'))
assert(collectKey(index, 'serviceTier').every((value) => value === 'default'))
assert.equal(index.currentRoute.lanePackets.length, 1)
assert.equal(index.currentRoute.lanePackets[0].node, 'P1.I')
assert.equal(index.currentRoute.lanePackets[0].packetRevision, laneRevision)
assert(index.currentRoute.producerCompletionBoundary.independentVerificationAuthorizedByThisRouter)
assert.equal(index.currentRoute.producerCompletionBoundary.freshIndependentReviewerCount, 1)
assert(!index.currentRoute.producerCompletionBoundary.producerAndReviewerConcurrencyAuthorized)
assert.equal(index.currentRoute.producerCompletionBoundary.maximumActiveReviewerCount, 1)
assert(
  index.currentRoute.producerCompletionBoundary
    .brokerIntegrationAuthorizedByThisRouterAfterIndependentAccept
)
assert(index.currentRoute.producerCompletionBoundary.rootMarkReviewedRequiredBeforeBrokerIntegration)
assert(!index.currentRoute.producerCompletionBoundary.p1fAuthorized)
assert(index.currentRoute.producerCompletionBoundary.p1fTransitionMustBeSeparate)
assert(exact(index.currentRoute.independentReview.allowedDispositions, ['ACCEPT', 'REJECT']))
assert.equal(index.currentRoute.independentReview.readOnlyCanonicalInputPathCount, 68)
assert.equal(index.currentRoute.independentReview.readOnlyCandidateOutputPathCount, 5)
assert.equal(index.currentRoute.independentReview.readOnlyTotalPathCount, 73)
assert(!index.currentRoute.independentReview.repositoryWritesAuthorized)

const inputGroups = index.phase1CanonicalInputs
const inputs = [
  ...inputGroups.bootstrapPaths,
  ...inputGroups.p11aPaths,
  ...inputGroups.p11aRemediationProvenancePaths,
  ...inputGroups.p11bPaths,
  ...inputGroups.p11cPaths,
  ...inputGroups.p1r1Paths,
  ...inputGroups.p11dPaths,
  ...inputGroups.p1r2Paths,
]
assert.equal(inputs.length, 68)
assert.equal(new Set(inputs).size, 68)
assert(inputs.every((input) => fs.existsSync(input)))
assert.equal(inputGroups.snapshotSha, base)
assert.equal(inputGroups.requiredTotalPathCount, 68)
assert(inputGroups.allPathsReadOnly)
assert.equal(index.rollbackPayload.bootstrapSha, '5f30df49e052d1cc1d0e7efd03aa105673b5b614')
assert.equal(index.rollbackPayload.acceptedPayloadSha, base)
assert.equal(index.rollbackPayload.paths.length, 54)
assert.equal(new Set(index.rollbackPayload.paths).size, 54)
assert(index.rollbackPayload.paths.every((value) => inputs.includes(value)))
assert(!index.rollbackPayload.workspaceApplyAuthorized)
assert(index.rollbackPayload.scratchRoundTripRequired)

const ownership = JSON.parse(
  fs.readFileSync('docs/research/hosted-web/phase-1/bootstrap/ownership-manifest.json', 'utf8')
)
const p1iOwner = ownership.writers.find((writer) => writer.ownerId === 'P1.I')
assert(p1iOwner)
assert(exact(p1iOwner.writablePaths, outputs))
assert(exact(index.outputs.writablePaths, outputs))
assert(exact(index.currentRoute.completionProof.immutableOutputPaths, outputs))
assert(exact(index.routerExclusiveOwnership, routerPaths))
assert(exact(index.requiredExactResults.fullPhase1Vitest, {
  command: 'pnpm exec vitest run test/features/team-lifecycle test/architecture/hosted-web/phase-1',
  testFiles: 13,
  passed: 59,
  total: 59,
}))
assert.equal(index.requiredExactResults.ratchetRegressionFocused.evidenceId, 'P1.NEG.RATCHET_REGRESSION')
assert.equal(index.requiredExactResults.ratchetRegressionFocused.diagnostic, 'phase1-ratchet-regression')
assert(exact(index.requiredExactResults.nativeTypeScript, { inherited: 7, owned: 0, unexpected: 0 }))
assert.equal(index.requiredExactResults.fullLint.command, 'pnpm lint')
assert.equal(index.requiredGateIds.length, 14)
assert.equal(new Set(index.requiredGateIds).size, 14)
assert(index.authorization.p1iReviewerAuthorizedByThisRouter)
assert(!index.authorization.p1iReviewerConcurrentWithProducerAuthorized)
assert(!index.authorization.additionalConcurrentP1IReviewerAuthorized)
assert(index.authorization.p1iBrokerIntegrationAuthorizedAfterReviewerAcceptAndMarkReviewed)
assert(!index.authorization.p1iBrokerIntegrationBeforeReviewerAcceptAuthorized)
assert(!index.authorization.p1r2EvidenceReintegrationAuthorized)
assert(!index.authorization.p1fAuthorized)
assert(!index.authorization.phase2PlusAuthorized)
assert(!index.authorization.successorControllerAuthorized)
assert(!index.producerExecutionPolicy.network)
assert(!index.producerExecutionPolicy.dependencyInstall)
assert(!index.producerExecutionPolicy.productEdit)
assert(!index.producerExecutionPolicy.rawGitIntegration)
assert(!index.producerExecutionPolicy.registryWrite)
assert(!index.producerExecutionPolicy.agentFlowTest)
assert(!index.producerExecutionPolicy.stage)
assert(!index.producerExecutionPolicy.commit)
assert(!index.producerExecutionPolicy.push)
assert.equal(index.reviewerAdmission.reviewerCount, 1)
assert.equal(index.reviewerAdmission.workerRole, 'reviewer')
assert.equal(index.reviewerAdmission.reviewScope, 'P1.I-milestone')
assert.equal(index.reviewerAdmission.projectScopedControlOperation, 'codex_goal_project_prepare_verifier')
assert.equal(index.reviewerAdmission.requiredReadOnlyPathCount, 73)
assert(index.reviewerAdmission.freshReviewerRequired)
assert(index.reviewerAdmission.independenceRequired)
assert(!index.reviewerAdmission.producerAndReviewerConcurrencyAuthorized)
assert(!index.reviewerAdmission.additionalConcurrentReviewerAuthorized)
assert.equal(index.reviewerAdmission.repositoryWriterAuthority, 'none-read-only')
assert(!index.reviewerAdmission.reviewerIntegrationAuthority)

const p1r2Handoff = JSON.parse(fs.readFileSync(index.acceptedP1R2.handoffPath, 'utf8'))
assert.equal(p1r2Handoff.disposition, 'ACCEPT')
assert(exact(p1r2Handoff.findingCounts, { P0: 0, P1: 0, P2: 0 }))
assert.equal(p1r2Handoff.resultFileSha256, index.acceptedP1R2.resultSha256)
assert.equal(sha(index.acceptedP1R2.handoffPath), index.acceptedP1R2.handoffSha256)
assert.equal(sha(index.acceptedP1R2.resultPath), index.acceptedP1R2.resultSha256)
assert.equal(
  sha(index.historicalAuthority.p1R2LanePacket.path),
  index.historicalAuthority.p1R2LanePacket.sha256
)
for (const packet of [index.packetHashes.controllerPacket, index.packetHashes.lanePacket]) {
  assert.equal(sha(packet.path), packet.sha256, `packet hash drift ${packet.path}`)
}
for (const output of outputs) assert(!fs.existsSync(output), `premature P1.I output ${output}`)
for (const routerPath of routerPaths.filter((value) => value.endsWith('.md'))) {
  const text = fs.readFileSync(routerPath, 'utf8')
  assert(text.includes(revision), `missing revision ${routerPath}`)
  for (const match of text.matchAll(/\]\(([^)]+)\)/g)) {
    const targetPath = match[1].replace(/^<|>$/g, '').split('#')[0]
    if (!targetPath || /^[a-z]+:/i.test(targetPath)) continue
    assert(fs.existsSync(path.resolve(path.dirname(routerPath), targetPath)), `broken link ${targetPath}`)
  }
}
console.log('phase-01-p1-i-router-r1: ok')
NODE
test "$(git rev-parse HEAD)" = c5d842f75ca7a647a0773b0c30d303d7da21d1d6
test "$(git rev-list --parents -n 1 HEAD)" = \
  "c5d842f75ca7a647a0773b0c30d303d7da21d1d6 f6794b607609c57dc92def696d05946c9c96856a"
test "$(git diff-tree --no-commit-id --name-only -r HEAD)" = \
  "$(printf '%s\n' .codex-handoff/phase-01-p1-r2.json docs/research/hosted-web/phase-1/reviews/list-semantics.md)"
git diff --exit-code HEAD -- \
  .codex-handoff/phase-01-p1-r2.json \
  docs/research/hosted-web/phase-1/reviews/list-semantics.md \
  docs/hosted-web-phases/phase-01/lanes/p1-r2-review.md
mapfile -t phase1_input_paths < <(node -e \
  "const i=require('./docs/hosted-web-phases/EXECUTION_INDEX.json').phase1CanonicalInputs; console.log([...i.bootstrapPaths,...i.p11aPaths,...i.p11aRemediationProvenancePaths,...i.p11bPaths,...i.p11cPaths,...i.p1r1Paths,...i.p11dPaths,...i.p1r2Paths].join('\\n'))")
test "${#phase1_input_paths[@]}" -eq 68
git diff --exit-code \
  c5d842f75ca7a647a0773b0c30d303d7da21d1d6 \
  -- "${phase1_input_paths[@]}"
pnpm exec prettier --check \
  docs/hosted-web-phases/EXECUTION_INDEX.json \
  docs/hosted-web-phases/README.md \
  docs/hosted-web-phases/START_HERE.md \
  docs/hosted-web-phases/phase-01/README.md \
  docs/hosted-web-phases/phase-01/controller-packet.md \
  docs/hosted-web-phases/phase-01/execution-dag.md \
  docs/hosted-web-phases/phase-01/lanes/p1-i-integration.md
git diff --check
git diff --cached --quiet
actual_paths=$(git status --short | sed 's/^...//')
expected_paths=$(printf '%s\n' \
  docs/hosted-web-phases/EXECUTION_INDEX.json \
  docs/hosted-web-phases/README.md \
  docs/hosted-web-phases/START_HERE.md \
  docs/hosted-web-phases/phase-01/README.md \
  docs/hosted-web-phases/phase-01/controller-packet.md \
  docs/hosted-web-phases/phase-01/execution-dag.md \
  docs/hosted-web-phases/phase-01/lanes/p1-i-integration.md)
test "$actual_paths" = "$expected_paths"
mapfile -t router_paths < <(printf '%s\n' "$expected_paths")
test "${#router_paths[@]}" -eq 7
rg -n -i \
  '(api[_-]?key|access[_-]?token|refresh[_-]?token|client[_-]?secret|password|bearer|cookie|authorization)' \
  "${router_paths[@]}"
rg -n \
  '(/Users/|/home/|/root/|/tmp/|~/|[A-Za-z]:\\Users\\|real[-_ ]project)' \
  "${router_paths[@]}"
```

For this docs-only architecture correction, the declared router checks are limited to JSON parsing,
the exact-path link/provenance assertions above, exact seven-path Prettier, `git diff --check`, staged
and seven-path scope checks, and the exact seven-path secret/private-path scans. Do not rerun source
ESLint, Vitest, typecheck, or product checks for this correction. Record and classify every scan match;
required control terms and scan-pattern literals are not payload values.

The router author performs no fetch, dependency installation, lifecycle action, stage, commit, merge,
push, integration, registry write, runtime/team/provider action, agent-flow test, real-project access,
review launch, producer launch, P1.F transition, or successor-controller action. After validation and
self-review, return the exact seven-path diff and end `HOLD`.

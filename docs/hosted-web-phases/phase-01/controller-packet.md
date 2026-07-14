# Phase 1 controller packet: PR #252 semantic conflict router r2

## Status and authority

- Durable controller: `controller-v17`; replacement or restart is not authorized
- Required controller state: exactly `live=true`
- Worker admission and integration owner: `ProjectScopedControl`
- Producer start operation: `codex_goal_project_refill_worker`; `workerRole: producer`
- Reviewer start operation: `codex_goal_project_prepare_verifier`; `workerRole: reviewer`; strict
  contract `reviewKind: review`
- Current node: `PR252-semantic-conflict-remediation`
- Revision: `phase-01-pr252-semantic-conflict-remediation-router-r2`
- Fixed `baseSha`: `7c502f45df32b58bbc161b26dcc28df8a17107c9`
- Merge source:
  `origin/refactor/team-provisioning-round2-reapply@7afc908ce92f14b4b0ebd06cc4aa3a4cf33807d0`
- Conditional capacity: one serial `xhigh`/`default` producer, then one fresh independent
  `xhigh`/`default` reviewer; Fast forbidden for both
- This docs job launches none and ends `HOLD`

Product-worker capacity is zero until this exact seven-path router receives independent `ACCEPT`, is
integrated, and is pushed. This packet corrects the rejected future launch contract; it does not
claim that the post-push target already exists.

## Immutable accepted and rejected provenance

P1.1D remains independently accepted, integrated, and pushed:

| Field                        | Historical provenance value                                        |
| ---------------------------- | ------------------------------------------------------------------ |
| Reviewer                     | `agent-teams-hosted-web-refactor-p1-1d-shadowed-map-review-v17-r4` |
| Disposition                  | `FORMAL ACCEPT`; P0/P1/P2 `0/0/0`                                  |
| Strict result SHA-256        | `be0c9abd679f817c386d1d06d1b738c2a1505bb3c4718279129ab74842c98fa6` |
| Reviewed output ID           | `f3394026185348c84673d44a9b30a82667c3ff9435b5d4d7609c04785c274f41` |
| Accepted integration         | `p1-1d-shadowed-map-r4-accepted-integration-v3`                    |
| Accepted/pushed P1.1D commit | `e7e7e734c82c49105682e7a19bbedafa1f5ddbad`                         |

These values remain historical provenance, not current route targets.

The rejected PR #252 lineage is also immutable:

| Candidate                   | Patch / decision identity                                          | Disposition and boundary                                   |
| --------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------- |
| Whole-source-blob producer  | `a0fade213fd86c52022f944c9d3a9f169175f1fd5a54f6c19652173ae5307304` | producer/reviewer `REJECT`; never integrate/reuse/continue |
| Semantic router r1          | `95dcdae236fdadbd63bfb3022441accc4354cffdc5ca6db7447e7a01e9d53221` | `REJECT`; invalid future launch contract                   |
| Router r1 rejection consume | `pr252-semantic-router-r1-contract-reject-consume-v1`              | terminal consumption; no job continuation                  |

R2 is a clean correction. It does not inspect, resume, retry, supersede at the implementation level,
or reuse bytes from a rejected job. The future first implementation therefore has
`inputPatchHash=null`, `revision=0`, `retryCount=0`, and `supersedes=null`.

## Outcome

After r2 is accepted, integrated, and pushed, resolve its accepted pushed commit once. Render one
fully concrete producer request with the corrected strict contract. Produce one semantic five-path
resolution, self-review it, and stop at `HOLD`. Then obtain one fresh no-write independent review.
Only `ACCEPT` with P0/P1/P2 `0/0/0` permits `ProjectScopedControl` to create, validate, conventionally
commit, and push the ordered true merge.

## One post-push target resolution

After all three router gates complete, and immediately before producer admission,
`ProjectScopedControl` resolves the accepted pushed router commit exactly once to a full
40-character SHA and stores it as `storedAcceptedPushedRouterCommit`.

The stored value is bound without re-resolution to:

- `canonicalSha` and `phaseStartSha` in the future strict contract;
- outer plan metadata `sourceRef`, `baseBranch`, and `planBundleCommit`;
- outer materialization metadata for producer worktree `HEAD`;
- reviewer target and reviewer worktree `HEAD`;
- `mark_reviewed` and integration targets; and
- the true merge's first parent.

`baseSha` remains exactly `7c502f45df32b58bbc161b26dcc28df8a17107c9`; it is not rebound to the
accepted router commit. The pinned PR source is merge metadata outside the strict contract. A second
resolution, symbolic or short SHA, unequal target, stale worktree, or canonical drift fails closed.

## Sole producer orchestration launch template

The single authoritative producer template is
`projectScopedProducerAdmission.orchestrationLaunchTemplate` in
[`EXECUTION_INDEX.json`](../EXECUTION_INDEX.json). It is a post-push renderer specification, not a
launch request. No pre-push contract object is admissible.

The future rendered producer request envelope is serial and fixes:

- operation `codex_goal_project_refill_worker`;
- `workerRole: producer`;
- reasoning effort `xhigh`;
- service tier `default`; and
- `fastMode: false`.

The clean attempt metadata is outside the contract and fixes `revision=0`, `retryCount=0`, and
`supersedes=null`. The merge source is outside the contract and fixes remote `origin`, branch
`refactor/team-provisioning-round2-reapply`, and commit
`7afc908ce92f14b4b0ebd06cc4aa3a4cf33807d0`. Plan and materialization metadata are also outside the
contract and receive the stored accepted router target.

### Exact strict contract shape

The producer renderer, and later the verifier renderer, must each create a strict contract object
with exactly these keys, in this order, and no others:

1. `kind`
2. `format`
3. `canonicalSha`
4. `baseSha`
5. `phaseStartSha`
6. `packetRevision`
7. `controllerPacket`
8. `lanePacket`
9. `phaseId`
10. `laneId`
11. `inputPatchHash`
12. `reviewKind`
13. `ownedPaths`
14. `mandatoryDocs`
15. `mandatoryScripts`
16. `mandatoryFixtures`
17. `requiredChecks`
18. `executionPolicy`

No `sourceRef`, `baseBranch`, merge source, worktree path/`HEAD`, `planBundleCommit`,
`materializationHead`, `expectedTargetCommit`, revision/retry/supersession metadata, worker role,
effort/tier, or operation field may appear in the strict contract.

The producer renderer value sources are exact:

- `kind="worker-launch"`, `format=1`;
- `canonicalSha` and `phaseStartSha` equal the stored accepted pushed router full SHA;
- `baseSha="7c502f45df32b58bbc161b26dcc28df8a17107c9"`;
- `packetRevision="phase-01-pr252-semantic-conflict-remediation-router-r2"`;
- packet, phase, lane, and review values equal the index;
- `inputPatchHash=null`;
- `requiredChecks` is copied from `strictRequiredChecks`, never from the human-readable
  `producerRequiredChecks` list; and
- the remaining collection and policy values are copied exactly from their strict index sources.

The rendered `requiredChecks` value is exactly seven objects. Every object has only `id`, `cwd`, and
`command`; every `cwd` is `src`; and every command starts with `cd .. && `. The IDs, in order, are
`index-empty`, `task-board-commands-e2e`, `team-data-service-tests`, `typecheck`,
`lint-owned-paths`, `prettier-owned-paths`, and `diff-check`. A string entry, extra object key,
different working directory, missing command prefix, or copy of the prose check list rejects the
request.

The rendered producer `executionPolicy` has exactly three keys and values:

- `mode: "sandbox-only"`;
- `sandboxRoot` equal to
  `/var/data/agent-teams-hosted-web-refactor/worktrees/pr252-semantic-conflict-producer-v17-r1`;
  and
- `forbiddenRealProjects: ["/Users/belief/dev/projects/ai/claude-runtime"]`.

The reviewer uses the same three-key shape with sandbox root
`/var/data/agent-teams-hosted-web-refactor/worktrees/pr252-semantic-conflict-reviewer-v17-r1`.
The extended network/fetch/runtime/real-project/Fast/writer/Git safety flags remain outer
orchestration enforcement and must not be copied into the strict contract. An extra policy key,
empty forbidden list, non-concrete root, or unresolved binding/copy directive rejects rendering.

The producer renderer must first resolve and validate the stored SHA, then render exactly one
request in which every target and metadata field is a concrete string or value. Binding objects,
copy-source directives, explanatory text,
angle-bracket values, template tokens, missing keys, additional keys, and moving refs are invalid
runtime input. The renderer validates the fully concrete request against the stored target and fixed
base/source identities immediately before admission and fails closed on any drift.

## Exact seven-path router ownership

1. `docs/hosted-web-phases/START_HERE.md`
2. `docs/hosted-web-phases/README.md`
3. `docs/hosted-web-phases/EXECUTION_INDEX.json`
4. `docs/hosted-web-phases/phase-01/README.md`
5. `docs/hosted-web-phases/phase-01/controller-packet.md`
6. `docs/hosted-web-phases/phase-01/execution-dag.md`
7. `docs/hosted-web-phases/phase-01/lanes/pr252-base-conflict-resolution.md`

Every product, test, runtime, orchestration implementation, research/evidence, configuration,
package, lockfile, handoff, ledger, and integration path is read-only to this docs author. An eighth
changed path rejects the router.

## Producer admission and semantic scope

After the launch gate and concrete-request validation, admit exactly one producer for these paths:

1. `src/features/task-board-commands/core/application/TaskBoardCommandFacade.ts`
2. `src/main/services/team/TeamDataService.ts`
3. `src/renderer/components/team/TeamDetailView.tsx`
4. `test/features/task-board-commands/TaskBoardCommands.e2e.test.ts`
5. `test/main/services/team/TeamDataService.test.ts`

The producer must resolve the conflicts semantically; copying any complete source blob or replaying
the rejected patch is forbidden. The implementation must preserve target behavior and API outside
the actual conflicts. The facade destination `reconcile` port is optional: use it when available,
otherwise use `findById` plus validation. Present mismatched provenance is terminal, and unknown
outcome must never be invented as success. `TeamDataService` must use a narrow runtime guard for
`reconcileTaskCreation`, omit the port when absent, retain the durable facade/get-by-id path, keep
derived `projectPath` outside the hashed payload, and filter/sort/dedupe relations.

The supported final task-board API must retain the coherent `reconcileTaskCreation` path. The narrow
guard accommodates target-side mocks or older boundaries only; it does not authorize deleting or
bypassing the capability when present.

`TeamDetailView` must use one dual-signature async adapter that supports the target positional
`CreateTaskDialog` callback before merge and the source request-object Promise callback after source
materialization. It preserves stable command identity for an unchanged positional retry and passes
through an incoming `request.command`. The TaskBoard E2E file retains all four target cases and ports
all five source cases for exactly nine without an unguarded real-controller reconciliation call.

The producer edits no sixth path, keeps the index empty, runs all required checks, self-reviews with
explicit P0/P1/P2 counts, emits one immutable runtime output, and returns `HOLD` with
`nextAction: "integration-review"`. It may not fetch, launch an app/runtime/team, access a real
project, stage, merge, commit, push, or launch its reviewer.

## Required producer and reviewer gates

Run these exact commands independently in the producer materialization and again in the reviewer
materialization:

```bash
git diff --cached --quiet
pnpm exec vitest run test/features/task-board-commands/TaskBoardCommands.e2e.test.ts
pnpm exec vitest run test/main/services/team/TeamDataService.test.ts
pnpm typecheck
pnpm lint:fast:files -- src/features/task-board-commands/core/application/TaskBoardCommandFacade.ts src/main/services/team/TeamDataService.ts src/renderer/components/team/TeamDetailView.tsx test/features/task-board-commands/TaskBoardCommands.e2e.test.ts test/main/services/team/TeamDataService.test.ts
pnpm exec prettier --check src/features/task-board-commands/core/application/TaskBoardCommandFacade.ts src/main/services/team/TeamDataService.ts src/renderer/components/team/TeamDetailView.tsx test/features/task-board-commands/TaskBoardCommands.e2e.test.ts test/main/services/team/TeamDataService.test.ts
git diff --check
```

Both focused suites, including exactly nine TaskBoard E2E cases (four retained target plus five
ported source), empty index, lint, Prettier, and diff checks must be green. The typecheck
classification gate is green only with exactly the inherited seven Phase 0 diagnostics:

- `auth-artifacts-spike.test.ts`: TS7016 at 25:8; TS7031 at 66:31; TS18046 at 117:68; TS7031 at
  413:48; TS7031 at 733:10;
- `evidence-scanner.test.ts`: TS7016 at 12:8; and
- `scan-runtime-surfaces.test.ts`: TS2352 at 162:44.

Any added, removed, moved, or changed diagnostic fails. Also require exact five-path diff/ownership,
semantic no-whole-blob-copy proof, an empty index, conflict-marker scan, secret/auth/provider and
private/user/real-project-path scan, and textual/non-binary scan over exactly the five paths. Every
match must be classified; any unsafe value or unclassified match fails. The command name
`lint:fast:files` does not authorize Fast worker mode.

The source-added `test/renderer/utils/createTaskCommandIdentity.test.ts` is a non-conflict path, not
a producer-owned sixth path, and is unavailable before source materialization. After
`ProjectScopedControl` materializes non-conflict source paths for the true merge, final-merge
validation must additionally run
`pnpm exec vitest run test/renderer/utils/createTaskCommandIdentity.test.ts` and require it green.

## Independent architecture/integration review gate

After producer `HOLD`, `ProjectScopedControl` must invoke
`codex_goal_project_prepare_verifier` exactly once with `workerRole: reviewer`, `xhigh` reasoning,
`default` service tier, and Fast forbidden. Its strict contract uses the same exact 18-key shape,
sets `reviewKind: review`, binds `inputPatchHash` to the SHA-256 of the single immutable held
producer output, and uses the no-write reviewer execution policy. Architecture/integration remains
the reviewer's purpose only; it is not a runtime `reviewKind` enum. The verifier renderer must emit
a fully concrete request with no binding object, placeholder, missing key, extra key, or drift.

The reviewer is independent of the router author, current producer, rejected router r1, rejected
byte-copy producer/reviewer, and all P1.1D workers.

The reviewer has no writer, repair, refill, stage, merge, commit, or push authority. It may not
re-resolve the target. It materializes the immutable output against the stored accepted router SHA,
proves target and worktree equality, reruns every check and scan, and returns one explicit `ACCEPT`
or `REJECT`. Only complete `ACCEPT` with P0/P1/P2 `0/0/0` advances.

## Reviewed integration

Only after reviewer `ACCEPT`, `ProjectScopedControl` binds the immutable reviewed output to the
stored accepted router target and unchanged pinned merge source. It must create a true merge with
ordered parents `[stored accepted router target,
7afc908ce92f14b4b0ebd06cc4aa3a4cf33807d0]`, prove the conflict set is exactly the five paths,
materialize the pinned source's non-conflict paths, apply only the accepted semantic output to the
five conflicts, rerun every producer/reviewer gate on that final shape, run the additional
command-identity test, create a conventional commit, and push it.

A one-parent, squash, patch-only, reversed-parent, moving-source, canonical-drifted, extra-conflict,
whole-blob-copy, placeholder, or gate-failing result is rejected and not pushed. P1.R2, P1.I, P1.F,
and Phase 2+ remain blocked until the validated merge is pushed.

## Exact docs-router checks

Run each command independently from the repository root with
`PATH=/usr/local/bin:/usr/bin:/bin:$PATH`:

The inline verifier also materializes producer and reviewer shape-only contracts with deterministic,
non-authoritative digest values. Those objects are never launch inputs; they prove before router
acceptance that rendering produces the complete strict value shape, rejects string checks and extra
policy keys, and leaves no binding or copy-source directive unresolved. The future controller still
renders the only operational producer request exactly once after resolving the accepted pushed
router commit.

```bash
node <<'NODE'
const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')

const assert = (value, message) => {
  if (!value) throw new Error(message)
}
const same = (actual, expected) =>
  actual.length === expected.length && actual.every((value, index) => value === expected[index])

const base = '7c502f45df32b58bbc161b26dcc28df8a17107c9'
const source = '7afc908ce92f14b4b0ebd06cc4aa3a4cf33807d0'
const revision = 'phase-01-pr252-semantic-conflict-remediation-router-r2'
const node = 'PR252-semantic-conflict-remediation'
const bindingName = 'storedAcceptedPushedRouterCommit'
const producerPatchBindingName = 'immutableProducerOutputPatchHash'
const r1Patch = '95dcdae236fdadbd63bfb3022441accc4354cffdc5ca6db7447e7a01e9d53221'
const byteCopyPatch = 'a0fade213fd86c52022f944c9d3a9f169175f1fd5a54f6c19652173ae5307304'
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
const mandatoryDocs = [
  'AGENTS.md',
  'docs/hosted-web-phases/START_HERE.md',
  'docs/hosted-web-phases/EVIDENCE_LIFECYCLE.md',
  'docs/hosted-web-phases/README.md',
  'docs/hosted-web-phases/EXECUTION_INDEX.json',
  'docs/hosted-web-phases/phase-01/controller-packet.md',
  'docs/hosted-web-phases/phase-01/lanes/pr252-base-conflict-resolution.md',
  'CLAUDE.md',
  'AGENT_CRITICAL_GUARDRAILS.md',
  'docs/hosted-web-phases/PACKET_STANDARD.md',
]
const executableTypecheckBaselineCommand =
  'cd .. && node scripts/hosted-web/phase-0/final-gate/normalize-typescript-diagnostics.mjs --mode milestone'
const strictRequiredChecks = [
  {
    id: 'index-empty',
    cwd: 'src',
    command: 'cd .. && git diff --cached --quiet',
  },
  {
    id: 'task-board-commands-e2e',
    cwd: 'src',
    command:
      'cd .. && pnpm exec vitest run test/features/task-board-commands/TaskBoardCommands.e2e.test.ts',
  },
  {
    id: 'team-data-service-tests',
    cwd: 'src',
    command: 'cd .. && pnpm exec vitest run test/main/services/team/TeamDataService.test.ts',
  },
  {
    id: 'typecheck',
    cwd: 'src',
    command: executableTypecheckBaselineCommand,
  },
  {
    id: 'lint-owned-paths',
    cwd: 'src',
    command:
      'cd .. && pnpm lint:fast:files -- src/features/task-board-commands/core/application/TaskBoardCommandFacade.ts src/main/services/team/TeamDataService.ts src/renderer/components/team/TeamDetailView.tsx test/features/task-board-commands/TaskBoardCommands.e2e.test.ts test/main/services/team/TeamDataService.test.ts',
  },
  {
    id: 'prettier-owned-paths',
    cwd: 'src',
    command:
      'cd .. && pnpm exec prettier --check src/features/task-board-commands/core/application/TaskBoardCommandFacade.ts src/main/services/team/TeamDataService.ts src/renderer/components/team/TeamDetailView.tsx test/features/task-board-commands/TaskBoardCommands.e2e.test.ts test/main/services/team/TeamDataService.test.ts',
  },
  {
    id: 'diff-check',
    cwd: 'src',
    command: 'cd .. && git diff --check',
  },
]
const strictCheckKeys = ['id', 'cwd', 'command']
const strictExecutionPolicyKeys = ['mode', 'sandboxRoot', 'forbiddenRealProjects']
const producerSandboxRoot =
  '/var/data/agent-teams-hosted-web-refactor/worktrees/pr252-semantic-conflict-producer-v17-r1'
const reviewerSandboxRoot =
  '/var/data/agent-teams-hosted-web-refactor/worktrees/pr252-semantic-conflict-reviewer-v17-r1'
const forbiddenRealProjects = ['/Users/belief/dev/projects/ai/claude-runtime']
const producerStrictExecutionPolicy = {
  mode: 'sandbox-only',
  sandboxRoot: producerSandboxRoot,
  forbiddenRealProjects,
}
const reviewerStrictExecutionPolicy = {
  mode: 'sandbox-only',
  sandboxRoot: reviewerSandboxRoot,
  forbiddenRealProjects,
}
const contractKeys = [
  'kind',
  'format',
  'canonicalSha',
  'baseSha',
  'phaseStartSha',
  'packetRevision',
  'controllerPacket',
  'lanePacket',
  'phaseId',
  'laneId',
  'inputPatchHash',
  'reviewKind',
  'ownedPaths',
  'mandatoryDocs',
  'mandatoryScripts',
  'mandatoryFixtures',
  'requiredChecks',
  'executionPolicy',
]
const isNamedBinding = (value, name) =>
  value &&
  typeof value === 'object' &&
  Object.keys(value).length === 1 &&
  value.binding === name
const isBinding = (value) => isNamedBinding(value, bindingName)
const exact = (actual, expected) => JSON.stringify(actual) === JSON.stringify(expected)
const assertExactKeys = (value, keys, label) => {
  assert(value && typeof value === 'object' && !Array.isArray(value), `${label} is not an object`)
  assert(same(Object.keys(value), keys), `${label} key/shape drift`)
}
const hasUnresolvedDirective = (value) => {
  if (!value || typeof value !== 'object') return false
  if (Object.prototype.hasOwnProperty.call(value, 'binding')) return true
  if (Object.prototype.hasOwnProperty.call(value, 'copyExactFrom')) return true
  return Object.values(value).some(hasUnresolvedDirective)
}

const index = JSON.parse(fs.readFileSync(routerPaths[2], 'utf8'))
const resolveTemplateValue = (value, bindings) => {
  if (Array.isArray(value)) return value.map((child) => resolveTemplateValue(child, bindings))
  if (!value || typeof value !== 'object') return value
  if (Object.keys(value).length === 1 && typeof value.binding === 'string') {
    assert(Object.prototype.hasOwnProperty.call(bindings, value.binding), `unresolved binding ${value.binding}`)
    return bindings[value.binding]
  }
  if (Object.keys(value).length === 1 && typeof value.copyExactFrom === 'string') {
    assert(
      Object.prototype.hasOwnProperty.call(index, value.copyExactFrom),
      `unresolved copy source ${value.copyExactFrom}`
    )
    return JSON.parse(JSON.stringify(index[value.copyExactFrom]))
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, resolveTemplateValue(child, bindings)])
  )
}
const renderStrictContract = (renderer, bindings) =>
  Object.fromEntries(
    renderer.outputKeyOrder.map((key) => [
      key,
      resolveTemplateValue(renderer.valueSources[key], bindings),
    ])
  )
const validateStrictChecks = (checks, label) => {
  assert(Array.isArray(checks), `${label} requiredChecks is not an array`)
  assert(checks.every((check) => typeof check !== 'string'), `${label} contains a string check`)
  assert(exact(checks, strictRequiredChecks), `${label} requiredChecks drift`)
  for (const check of checks) {
    assertExactKeys(check, strictCheckKeys, `${label} check ${check.id}`)
    assert(check.cwd === 'src', `${label} check cwd drift: ${check.id}`)
    assert(check.command.startsWith('cd .. && '), `${label} command prefix drift: ${check.id}`)
  }
  const typecheck = checks.filter((check) => check.id === 'typecheck')
  assert(typecheck.length === 1, `${label} executable typecheck baseline cardinality drift`)
  assert(
    typecheck[0].command === executableTypecheckBaselineCommand,
    `${label} executable typecheck baseline command drift`
  )
}
const validateStrictExecutionPolicy = (policy, sandboxRoot, label) => {
  assertExactKeys(policy, strictExecutionPolicyKeys, `${label} executionPolicy`)
  assert(policy.mode === 'sandbox-only', `${label} execution mode drift`)
  assert(policy.sandboxRoot === sandboxRoot, `${label} sandbox root drift`)
  assert(
    exact(policy.forbiddenRealProjects, forbiddenRealProjects) &&
      policy.forbiddenRealProjects.length > 0,
    `${label} forbidden real-project paths drift`
  )
}
const validateRenderedStrictContract = (
  contract,
  { label, expectedTarget, expectedInputPatchHash, expectedReviewKind, expectedSandboxRoot }
) => {
  assertExactKeys(contract, contractKeys, `${label} contract`)
  assert(hasUnresolvedDirective(contract) === false, `${label} contains an unresolved directive`)
  assert(contract.kind === 'worker-launch', `${label} kind drift`)
  assert(contract.format === 1, `${label} format drift`)
  assert(/^[0-9a-f]{40}$/.test(contract.canonicalSha), `${label} canonical SHA shape drift`)
  assert(contract.canonicalSha === expectedTarget, `${label} canonical target drift`)
  assert(contract.baseSha === base, `${label} base drift`)
  assert(contract.phaseStartSha === expectedTarget, `${label} phase start drift`)
  assert(contract.packetRevision === revision, `${label} packet revision drift`)
  assert(contract.controllerPacket === routerPaths[4], `${label} controller packet drift`)
  assert(contract.lanePacket === routerPaths[6], `${label} lane packet drift`)
  assert(contract.phaseId === 'phase-01', `${label} phase drift`)
  assert(contract.laneId === 'pr252-semantic-conflict-remediation', `${label} lane drift`)
  assert(contract.inputPatchHash === expectedInputPatchHash, `${label} input patch drift`)
  assert(contract.reviewKind === expectedReviewKind, `${label} review kind drift`)
  assert(exact(contract.ownedPaths, ownedPaths), `${label} owned paths drift`)
  assert(exact(contract.mandatoryDocs, mandatoryDocs), `${label} mandatory docs drift`)
  assert(exact(contract.mandatoryScripts, []), `${label} mandatory scripts drift`)
  assert(exact(contract.mandatoryFixtures, []), `${label} mandatory fixtures drift`)
  validateStrictChecks(contract.requiredChecks, label)
  validateStrictExecutionPolicy(contract.executionPolicy, expectedSandboxRoot, label)
}

assert(index.currentExecutableSubphase === node, 'wrong current subphase')
assert(same(index.currentExecutableNodes, [node]), 'wrong executable node set')
assert(index.currentRouterRevision === revision, 'router revision drift')
assert(index.currentRouterTerminalState === 'HOLD', 'router is not HOLD')
assert(index.fixedRouterBaseSha === base, 'fixed base drift')
assert(index.durableController.identity === 'controller-v17', 'controller drift')
assert(index.durableController.requiredState === 'live=true', 'controller state drift')
assert(index.durableController.replacementAuthorized === false, 'controller replacement enabled')
assert(
  index.workerStartAuthority === 'ProjectScopedControl codex_goal_project_refill_worker',
  'producer start authority drift'
)
assert(
  index.verifierStartAuthority === 'ProjectScopedControl codex_goal_project_prepare_verifier',
  'verifier start authority drift'
)

const stored = index.storedAcceptedPushedRouterCommit
assert(stored.stateInThisDocsRouter === 'unresolved', 'docs router invented future SHA')
assert(stored.resolvedBy === 'ProjectScopedControl', 'wrong target resolver')
assert(stored.requiredResolutionCount === 1, 'target is not exactly-once')
assert(stored.downstreamReresolutionAuthorized === false, 'target re-resolution enabled')
assert(stored.baseShaDoesNotRebind === true, 'base rebinding enabled')
assert(index.currentRoute.baseSha === base, 'route base drift')
for (const key of ['canonicalSha', 'phaseStartSha', 'sourceRef', 'baseBranch', 'worktreeHead']) {
  assert(isBinding(index.currentRoute[key]), `route target binding drift: ${key}`)
}
assert(index.currentRoute.mergeSource.remote === 'origin', 'source remote drift')
assert(
  index.currentRoute.mergeSource.branch === 'refactor/team-provisioning-round2-reapply',
  'source branch drift'
)
assert(index.currentRoute.mergeSource.commit === source, 'source commit drift')
assert(index.currentRoute.launchGate.attestedByThisDocsTransition === false, 'docs attest future gate')
assert(index.currentRoute.lanePackets.length === 1, 'lane count drift')
assert(index.currentRoute.lanePackets[0].packetRevision === revision, 'lane revision drift')

const rejectedRouter = index.rejectedPr252SemanticRouterR1
assert(rejectedRouter.patchSha256 === r1Patch, 'r1 patch provenance drift')
assert(rejectedRouter.disposition === 'REJECT', 'r1 is not rejected')
assert(rejectedRouter.reason === 'invalid-future-launch-contract', 'r1 rejection reason drift')
assert(
  rejectedRouter.consumedBy === 'pr252-semantic-router-r1-contract-reject-consume-v1',
  'r1 consume drift'
)
assert(rejectedRouter.reuseAuthorized === false, 'r1 reuse enabled')
assert(rejectedRouter.continueAuthorized === false, 'r1 continuation enabled')
const byteCopy = index.rejectedPr252ByteCopyAttempt
assert(byteCopy.patchSha256 === byteCopyPatch, 'byte-copy patch provenance drift')
assert(byteCopy.producerDisposition === 'REJECT', 'byte-copy producer rejection drift')
assert(byteCopy.reviewerDisposition === 'REJECT', 'byte-copy reviewer rejection drift')
assert(byteCopy.implementationInputAuthorized === false, 'byte-copy input enabled')

assert(same(index.producerOwnedPaths, ownedPaths), 'producer ownership drift')
assert(same(index.workerMandatoryDocs, mandatoryDocs), 'mandatory docs order drift')
assert(same(index.workerMandatoryScripts, []), 'mandatory scripts drift')
assert(same(index.workerMandatoryFixtures, []), 'mandatory fixtures drift')
assert(index.producerRequiredChecks.length > 0, 'required checks empty')
assert(
  index.producerRequiredChecks.every((check) => typeof check === 'string'),
  'human-readable checks are not strings'
)
validateStrictChecks(index.strictRequiredChecks, 'index')
assert(index.workerExecutionPolicy.fastMode === false, 'Fast enabled')
assert(index.workerExecutionPolicy.writerScope === 'ownedPaths-only', 'writer scope drift')
for (const key of ['network', 'fetch', 'appRuntimeOrTeamLaunch', 'realProjectAccess', 'stage', 'merge', 'commit', 'push']) {
  assert(index.workerExecutionPolicy[key] === false, `execution policy enabled: ${key}`)
}
assert(index.reviewerExecutionPolicy.writerScope === 'none', 'reviewer writer scope drift')
assert(index.reviewerExecutionPolicy.fastMode === false, 'reviewer execution policy Fast enabled')
for (const key of ['network', 'fetch', 'appRuntimeOrTeamLaunch', 'realProjectAccess', 'stage', 'merge', 'commit', 'push']) {
  assert(index.reviewerExecutionPolicy[key] === false, `reviewer execution policy enabled: ${key}`)
}
assert(
  exact(index.producerStrictExecutionPolicy, producerStrictExecutionPolicy),
  'producer strict execution policy drift'
)
assert(
  exact(index.reviewerStrictExecutionPolicy, reviewerStrictExecutionPolicy),
  'reviewer strict execution policy drift'
)
validateStrictExecutionPolicy(index.producerStrictExecutionPolicy, producerSandboxRoot, 'producer index')
validateStrictExecutionPolicy(index.reviewerStrictExecutionPolicy, reviewerSandboxRoot, 'reviewer index')
assert(index.semanticAcceptance.wholeSourceBlobCopyAuthorized === false, 'byte copy enabled')
assert(index.semanticAcceptance.preserveTargetTaskBoardApi === true, 'target API not preserved')
assert(
  index.semanticAcceptance.supportedFinalApiRetainsReconcileTaskCreation === true,
  'reconcileTaskCreation omitted from supported final API'
)
const facadeReconcile = index.semanticAcceptance.facadeDestinationReconcile
assert(facadeReconcile.required === false, 'facade reconcile made mandatory')
assert(facadeReconcile.useWhenAvailable === true, 'facade reconcile capability ignored')
assert(
  facadeReconcile.fallbackWhenUnavailable === 'findById-plus-validation',
  'facade reconcile fallback drift'
)
assert(facadeReconcile.presentMismatchedProvenanceDisposition === 'terminal', 'provenance is not terminal')
assert(facadeReconcile.unknownOutcomeMayBeReportedAsSuccess === false, 'unknown outcome can succeed')
const serviceReconcile = index.semanticAcceptance.teamDataServiceReconcilePort
assert(serviceReconcile.capabilityGuard === 'narrow-runtime-function-guard', 'service guard drift')
assert(serviceReconcile.omitWhenUnavailable === true, 'absent service port not omitted')
assert(serviceReconcile.absenceDisablesDurableFacade === false, 'absence disables durable facade')
assert(index.semanticAcceptance.durableCommandPayload.projectPathIncluded === false, 'projectPath hashed')
assert(
  index.semanticAcceptance.durableCommandPayload.relationNormalization === 'filter-sort-dedupe',
  'relation normalization drift'
)
const callback = index.semanticAcceptance.teamDetailViewCreateTaskAdapter
assert(callback.async === true, 'callback adapter is not async')
assert(
  same(callback.acceptedSignatures, ['target-positional', 'source-request-object-promise']),
  'callback signature drift'
)
assert(callback.stablePositionalCommandIdentity === true, 'positional identity is unstable')
assert(callback.preserveRequestCommand === true, 'request command is not preserved')
const e2e = index.semanticAcceptance.taskBoardE2ECoverage
assert(e2e.retainedTargetCases === 4, 'target E2E count drift')
assert(e2e.portedSourceCases === 5, 'source E2E count drift')
assert(e2e.requiredTotalCases === 9, 'total E2E count drift')
assert(e2e.unguardedRealControllerReconcileAuthorized === false, 'unguarded reconcile enabled')

const producer = index.projectScopedProducerAdmission
assert(producer.operation === 'codex_goal_project_refill_worker', 'producer operation drift')
assert(producer.workerRole === 'producer', 'producer worker role drift')
assert(producer.producerCount === 1, 'producer count drift')
assert(producer.mode === 'serial-builtin', 'producer is not serial')
assert(producer.reasoningEffort === 'xhigh', 'producer effort drift')
assert(producer.serviceTier === 'default', 'producer tier drift')
assert(producer.fastMode === false, 'producer Fast enabled')
assert(producer.producerTerminalState === 'HOLD', 'producer terminal state drift')
assert(producer.producerSelfReviewRequired === true, 'producer self-review disabled')
assert(producer.producerLaunchesReviewer === false, 'producer reviewer launch enabled')
assert(producer.cleanImplementationAttempt.revision === 0, 'implementation revision drift')
assert(producer.cleanImplementationAttempt.retryCount === 0, 'retry count drift')
assert(producer.cleanImplementationAttempt.supersedes === null, 'supersedes drift')
assert(producer.cleanImplementationAttempt.inputPatchHash === null, 'input patch is not null')

const template = producer.orchestrationLaunchTemplate
assert(template.templateIsLaunchRequest === false, 'template mislabeled as request')
assert(template.renderCount === 1, 'render count drift')
assert(template.renderedRequestMustBeFullyConcrete === true, 'concrete request not required')
assert(template.placeholdersAuthorized === false, 'placeholders enabled')
assert(template.bindingObjectsInRenderedRequestAuthorized === false, 'binding objects enabled')
assert(template.requestEnvelope.operation === 'codex_goal_project_refill_worker', 'envelope operation drift')
assert(template.requestEnvelope.workerRole === 'producer', 'envelope worker role drift')
assert(template.requestEnvelope.fastMode === false, 'envelope Fast enabled')
assert(template.attemptMetadata.revision === 0, 'outer revision drift')
assert(template.attemptMetadata.retryCount === 0, 'outer retry drift')
assert(template.attemptMetadata.supersedes === null, 'outer supersedes drift')
assert(template.mergeSourceMetadata.commit === source, 'outer merge source drift')
for (const key of ['sourceRef', 'baseBranch', 'planBundleCommit']) {
  assert(isBinding(template.planMetadata[key]), `outer plan binding drift: ${key}`)
}
assert(isBinding(template.materializationMetadata.worktreeHead), 'worktree binding drift')
const renderer = template.contractRenderer
assert(renderer.outputAdditionalProperties === false, 'contract extras enabled')
assert(same(renderer.outputKeyOrder, contractKeys), 'strict contract key/order drift')
assert(same(Object.keys(renderer.valueSources), contractKeys), 'strict contract value-source drift')
assert(renderer.valueSources.kind === 'worker-launch', 'contract kind drift')
assert(renderer.valueSources.format === 1, 'contract format drift')
assert(isBinding(renderer.valueSources.canonicalSha), 'canonical source drift')
assert(renderer.valueSources.baseSha === base, 'contract base drift')
assert(isBinding(renderer.valueSources.phaseStartSha), 'phase start source drift')
assert(renderer.valueSources.packetRevision === revision, 'contract revision drift')
assert(renderer.valueSources.inputPatchHash === null, 'contract input patch drift')
assert(renderer.valueSources.ownedPaths.copyExactFrom === 'producerOwnedPaths', 'owned source drift')
assert(renderer.valueSources.mandatoryDocs.copyExactFrom === 'workerMandatoryDocs', 'docs source drift')
assert(
  renderer.valueSources.requiredChecks.copyExactFrom === 'strictRequiredChecks',
  'strict check source drift'
)
assert(
  renderer.valueSources.executionPolicy.copyExactFrom === 'producerStrictExecutionPolicy',
  'producer strict execution policy source drift'
)
assert(!contractKeys.includes('mergeSource'), 'merge source leaked into contract')
assert(!contractKeys.includes('planBundleCommit'), 'plan metadata leaked into contract')
assert(!contractKeys.includes('materializationHead'), 'materialization leaked into contract')
const shapeOnlyTarget = crypto
  .createHash('sha1')
  .update(`${revision}:non-authoritative-contract-shape`)
  .digest('hex')
const renderedProducerContract = renderStrictContract(renderer, {
  [bindingName]: shapeOnlyTarget,
})
validateRenderedStrictContract(renderedProducerContract, {
  label: 'rendered producer',
  expectedTarget: shapeOnlyTarget,
  expectedInputPatchHash: null,
  expectedReviewKind: 'implementation',
  expectedSandboxRoot: producerSandboxRoot,
})

const review = index.integrationReviewAdmission
assert(review.operation === 'codex_goal_project_prepare_verifier', 'verifier operation drift')
assert(review.workerRole === 'reviewer', 'verifier worker role drift')
assert(review.reviewKind === 'review', 'verifier reviewKind drift')
assert(
  review.reviewerPurpose === 'independent architecture/integration review',
  'reviewer purpose drift'
)
assert(review.reviewerCount === 1, 'reviewer count drift')
assert(review.freshIndependentReviewerRequired === true, 'fresh review disabled')
assert(review.reasoningEffort === 'xhigh', 'reviewer effort drift')
assert(review.serviceTier === 'default', 'reviewer tier drift')
assert(review.fastMode === false, 'reviewer Fast enabled')
assert(review.repositoryWriterAuthority === false, 'reviewer writer enabled')
assert(review.repairAuthority === false, 'reviewer repair enabled')
assert(review.canonicalReresolutionAuthorized === false, 'reviewer re-resolution enabled')
assert(isBinding(review.storedTarget), 'review target drift')
assert(isBinding(review.materialization.worktreeHead), 'review worktree drift')
assert(review.immutableProducerOutputPatchHash.requiredResolutionCount === 1, 'review patch resolution drift')
assert(review.immutableProducerOutputPatchHash.resolvedValueFormat === 'sha256', 'review patch format drift')
const reviewRenderer = review.strictContractRenderer
assert(reviewRenderer.renderOnlyAfterProducerHold === true, 'verifier can render before producer HOLD')
assert(reviewRenderer.renderedRequestMustBeFullyConcrete === true, 'concrete verifier request not required')
assert(reviewRenderer.placeholdersAuthorized === false, 'verifier placeholders enabled')
assert(
  reviewRenderer.bindingObjectsInRenderedRequestAuthorized === false,
  'verifier binding objects enabled'
)
assert(reviewRenderer.outputAdditionalProperties === false, 'verifier contract extras enabled')
assert(same(reviewRenderer.outputKeyOrder, contractKeys), 'verifier contract key/order drift')
assert(same(Object.keys(reviewRenderer.valueSources), contractKeys), 'verifier value-source drift')
assert(reviewRenderer.valueSources.kind === 'worker-launch', 'verifier contract kind drift')
assert(reviewRenderer.valueSources.format === 1, 'verifier contract format drift')
assert(isBinding(reviewRenderer.valueSources.canonicalSha), 'verifier canonical source drift')
assert(reviewRenderer.valueSources.baseSha === base, 'verifier contract base drift')
assert(isBinding(reviewRenderer.valueSources.phaseStartSha), 'verifier phase start source drift')
assert(reviewRenderer.valueSources.packetRevision === revision, 'verifier contract revision drift')
assert(
  isNamedBinding(reviewRenderer.valueSources.inputPatchHash, producerPatchBindingName),
  'verifier input patch source drift'
)
assert(reviewRenderer.valueSources.reviewKind === 'review', 'verifier contract reviewKind drift')
assert(
  reviewRenderer.valueSources.requiredChecks.copyExactFrom === 'strictRequiredChecks',
  'verifier strict check source drift'
)
assert(
  reviewRenderer.valueSources.executionPolicy.copyExactFrom === 'reviewerStrictExecutionPolicy',
  'verifier strict execution policy source drift'
)
assert(reviewRenderer.failClosedOnMissingExtraPlaceholderOrDrift === true, 'verifier drift is open')
assert(review.requiredChecksSource === 'strictRequiredChecks', 'verifier check source metadata drift')
assert(Object.values(review.acceptFindingCounts).every((value) => value === 0), 'accept counts drift')
const shapeOnlyProducerPatch = crypto
  .createHash('sha256')
  .update(`${revision}:non-authoritative-producer-output-shape`)
  .digest('hex')
const renderedReviewerContract = renderStrictContract(reviewRenderer, {
  [bindingName]: shapeOnlyTarget,
  [producerPatchBindingName]: shapeOnlyProducerPatch,
})
validateRenderedStrictContract(renderedReviewerContract, {
  label: 'rendered reviewer',
  expectedTarget: shapeOnlyTarget,
  expectedInputPatchHash: shapeOnlyProducerPatch,
  expectedReviewKind: 'review',
  expectedSandboxRoot: reviewerSandboxRoot,
})
const runtimeReviewKinds = []
const collectReviewKinds = (value) => {
  if (!value || typeof value !== 'object') return
  for (const [key, child] of Object.entries(value)) {
    if (key === 'reviewKind') runtimeReviewKinds.push(child)
    collectReviewKinds(child)
  }
}
collectReviewKinds(index)
assert(
  same(runtimeReviewKinds, ['implementation', 'review', 'review']),
  'runtime reviewKind set contains an invalid enum'
)

const protocol = index.reviewedIntegrationProtocol
assert(protocol.performedBy === 'ProjectScopedControl', 'integration owner drift')
assert(protocol.mergeSource.commit === source, 'integration source drift')
assert(isBinding(protocol.markReviewedTarget), 'mark_reviewed target drift')
assert(isBinding(protocol.integrationTarget), 'integration target drift')
assert(isBinding(protocol.requiredParentOrder[0]), 'first parent drift')
assert(protocol.requiredParentOrder[1] === source, 'second parent drift')
assert(protocol.runtimeCreatesTrueMerge === true, 'true merge disabled')
assert(
  protocol.sourceNonConflictMaterializationPrecedesFinalChecks === true,
  'final checks can precede source materialization'
)
assert(
  same(protocol.postSourceMaterializationRequiredChecks, [
    'pnpm exec vitest run test/renderer/utils/createTaskCommandIdentity.test.ts',
  ]),
  'final source-materialization check drift'
)
assert(protocol.conventionalCommitRequired === true, 'conventional commit disabled')
assert(protocol.pushRequiredBeforeAdvance === true, 'push gate disabled')
assert(protocol.failClosedOnDrift === true, 'drift is not fail-closed')

assert(same(index.authorization.authorizedNow, []), 'worker authorized during docs router')
assert(
  same(index.authorization.blockedUntilValidatedMergePushed, ['P1.R2', 'P1.I', 'P1.F', 'Phase 2+']),
  'blocked successors drift'
)
assert(same(index.routerExclusiveOwnership, routerPaths), 'router ownership drift')
for (const packet of [index.packetHashes.controllerPacket, index.packetHashes.lanePacket]) {
  const actual = crypto.createHash('sha256').update(fs.readFileSync(packet.path)).digest('hex')
  assert(actual === packet.sha256, `packet hash drift: ${packet.path}`)
}
for (const routerPath of routerPaths.filter((value) => value.endsWith('.md'))) {
  const sourceText = fs.readFileSync(routerPath, 'utf8')
  for (const match of sourceText.matchAll(/\]\(([^)]+)\)/g)) {
    const targetPath = match[1].replace(/^<|>$/g, '').split('#')[0]
    if (!targetPath || /^[a-z]+:/i.test(targetPath)) continue
    assert(fs.existsSync(path.resolve(path.dirname(routerPath), targetPath)), `broken link ${targetPath}`)
  }
}
console.log('semantic-router-r2-index-links-hashes: ok')
NODE
pnpm exec prettier --check docs/hosted-web-phases/START_HERE.md docs/hosted-web-phases/README.md docs/hosted-web-phases/EXECUTION_INDEX.json docs/hosted-web-phases/phase-01/README.md docs/hosted-web-phases/phase-01/controller-packet.md docs/hosted-web-phases/phase-01/execution-dag.md docs/hosted-web-phases/phase-01/lanes/pr252-base-conflict-resolution.md
git diff --check
git diff --cached --quiet
git status --short
```

Also prove `HEAD` is unchanged at `7c502f45df32b58bbc161b26dcc28df8a17107c9`; the complete diff
contains exactly the seven ordered router paths and no eighth path; all seven files are textual; every
relative link exists; the controller/lane SHA-256 values match the index; and exact seven-path scans
contain no credential/secret/auth/provider value, private/user/real-project path, binary content, or
conflict marker.

## Monitoring, stop, and HOLD

Stop on router not accepted/integrated/pushed, target resolved before push or more than once,
rejected-job access/reuse, wrong fixed base or source, placeholder or extra contract field, nonconcrete
request, controller replacement/non-live state, second worker, Fast mode, wrong effort/tier,
extra/staged path, semantic byte-copy, mandatory or unguarded reconciliation capability, invented
unknown success, nonterminal mismatched provenance, incoherent dual callback/API, wrong E2E case
count, unsafe/binary content, check failure, wrong verifier operation/role/`reviewKind`,
non-independent review, nonzero finding, missing
final-only command-identity test, invalid parent order, nonconventional integration commit, or push
failure.

This docs author does not launch a worker/controller/reviewer/integration attempt and does not fetch,
stage, commit, merge, or push. P1.R2, P1.I, P1.F, and Phase 2+ remain blocked until the validated true
merge is pushed. Terminal state: `HOLD`.

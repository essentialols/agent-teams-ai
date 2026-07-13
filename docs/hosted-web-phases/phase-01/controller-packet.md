# Phase 1 controller packet: P1.1D additive-response remediation

## Status and authority

- Current node: `P1.1D-additive-response-remediation`
- Canonical remediation base: `1b37afb02bec25a1f08432d733595b553101ecab`
- Accepted predecessor: formal P1.R1 `ACCEPT`, policy-integrated at
  `759a5d4f45c2142485a0acc13760f3de4d0ff6ea`
- Superseded worker-start packet: `phase-01-p1-1d-team-lifecycle-read-r1`
- Current packet: `phase-01-p1-1d-additive-response-remediation-r1`
- Capacity after admission: exactly one serial, one-shot remediation producer
- Producer handoff: `.codex-handoff/phase-01-p1-1d.json`
- Required disposition before any integration: independent `ACCEPT`
- Blocked: P1.R2, P1.I, P1.F, and Phase 2+

This transition replaces worker-start authority for the rejected P1.1D attempt. It does not alter
accepted P1.R1, revive or integrate r3, authorize a second producer, perform review or integration,
mount a transport, or advance a successor node.

## Exact rejected-candidate provenance

| Field               | Value                                                              |
| ------------------- | ------------------------------------------------------------------ |
| Producer job        | `agent-teams-hosted-web-refactor-p1-1d-producer-v17-r3`            |
| Candidate base      | `1b37afb02bec25a1f08432d733595b553101ecab`                         |
| Patch SHA-256       | `a7d5539e68e62b1c64e5cdf663bc784d92d4db03e74a0087e29d9bb3b2faa7ee` |
| Review disposition  | `REJECT`                                                           |
| Finding severity    | P1                                                                 |
| Integration status  | never integrated                                                   |
| Preservation status | immutable rejected evidence                                        |

The independent watchdog record states verbatim:

> FORMAL REJECT P1 by independent watchdog. Same-version response parsers exact-key reject additive
> fields for success, failure, inapplicable, and nested item values, contrary to phase-01 response
> compatibility policy. Requests remain strict. Preserve immutable output and rejected patch
> a7d5539e68e62b1c64e5cdf663bc784d92d4db03e74a0087e29d9bb3b2faa7ee; do not integrate or modify.
> Authorized next action is one docs-only remediation router from canonical
> 1b37afb02bec25a1f08432d733595b553101ecab.

The patch, rejected handoff, recorded hashes, worker workspace, and review record retain their exact
bytes and rejected disposition. They have no current authority. A future producer may read that
artifact and reproduce useful narrow work in a new isolated worktree, but may not edit it, apply it to
an integration branch, treat its green checks as current proof, or copy its handoff/hashes as the new
candidate's proof.

## Outcome

Produce a fresh nine-path P1.1D candidate that keeps every valid original deliverable and gate while
closing only the additive-response finding:

1. keep request objects strict at the top-level and nested query-context boundary;
2. for every same-version response variant, validate every declared known field before considering
   additive fields;
3. build and return a fresh known-field-only projection, never the input object or a spread retaining
   additive state;
4. discard additive own string and symbol fields from top-level success, failure, and inapplicable
   response objects and from nested list-item and safe-error response objects;
5. reject unsupported versions, missing or invalid known fields, and invalid semantic combinations
   even when additive fields are present;
6. rerun every original P1.1D semantic, negative, architecture, quality, provenance, ownership, hash,
   and safety gate; and
7. regenerate `.codex-handoff/phase-01-p1-1d.json`, every per-file SHA-256, and the deterministic
   patch SHA-256 from the new worktree.

The evidence IDs remain `P1.1D.TEAM_LIFECYCLE_READ_CONTRACT`,
`P1.1D.TEAM_LIFECYCLE_READ_USE_CASE`, and `P1.1D.TEAM_LIFECYCLE_SEMANTIC_PROOF`. The output is a
candidate only until a distinct reviewer returns `ACCEPT`.

## Immutable inputs and non-goals

Immutable inputs include the accepted P1.1A shared kernel, accepted P1.1B/P1.1C routes and
conformance, formal P1.R1, canonical router commit `1b37afb02bec25a1f08432d733595b553101ecab`, the
original P1.1D packet, the frozen synthetic fixture corpus, and the rejected r3 artifact and review
record. No input is repaired or rewritten.

No IPC/HTTP route, client, handler, or conformance adapter; preload/renderer surface; filesystem or
infrastructure adapter; route catalog; production composition/mount; fake browser; real app/runtime/
project/provider; package/config/lockfile; fixture; shared-kernel; research; evidence-catalog; or
orchestration change is in scope. This node makes no transport parity, production support, Phase 1
completion, or later-phase claim.

## Launch gate and exact worker identity

This packet is dormant until both conditions are true:

1. the exact seven-path docs-only router containing this controller packet and the one remediation
   lane is policy-integrated after `1b37afb02bec25a1f08432d733595b553101ecab`; and
2. the successor controller responsible for that integrated packet reports exactly `live=true`.

No controller is created or launched by this docs change. Before both conditions, producer capacity
is zero. After both, one `worker-start-v1` contract must bind:

- `projectId: agent-teams-hosted-web-refactor`;
- `phaseId: phase-01` and `laneId: p1-1d-additive-response-remediation`;
- `packetRevision: phase-01-p1-1d-additive-response-remediation-r1`;
- `baseSha: 1b37afb02bec25a1f08432d733595b553101ecab`;
- the integrated remediation-router commit as both `planBundleCommit` and `phaseStartSha`;
- this controller packet and
  `docs/hosted-web-phases/phase-01/lanes/p1-1d-additive-response-remediation.md`;
- the rejected r3 patch SHA-256 and formal `REJECT` record as immutable read-only salvage input;
- one new isolated source worktree and one producer; and
- the exact mandatory reads, nine writable paths, checks, evidence IDs, handoff, and stop conditions
  in the lane packet.

The integrated router commit must differ from `baseSha` on exactly the seven router paths below. Any
pre-integration start, `live!=true`, stale/mixed identity, second producer, reused rejected worktree,
extra writable path, integration contract, or later-node contract fails closed with `packet_stale` or
`packet_conflict`.

## Exact seven-path router ownership

1. `docs/hosted-web-phases/START_HERE.md`
2. `docs/hosted-web-phases/README.md`
3. `docs/hosted-web-phases/EXECUTION_INDEX.json`
4. `docs/hosted-web-phases/phase-01/README.md`
5. `docs/hosted-web-phases/phase-01/controller-packet.md`
6. `docs/hosted-web-phases/phase-01/execution-dag.md`
7. `docs/hosted-web-phases/phase-01/lanes/p1-1d-additive-response-remediation.md`

The original `lanes/p1-1d-team-lifecycle-read.md`, every product/test/handoff path, accepted review
evidence, and external r3 artifact are read-only for this router author. An eighth path rejects this
transition.

## Exact remediation-producer ownership

Product paths:

- `src/features/team-lifecycle/contracts/team-lifecycle-read.ts`
- `src/features/team-lifecycle/contracts/index.ts`
- `src/features/team-lifecycle/core/application/ListTeamLifecycle.ts`
- `src/features/team-lifecycle/core/application/index.ts`
- `src/features/team-lifecycle/index.ts`

Test paths:

- `test/features/team-lifecycle/core/ListTeamLifecycle.test.ts`
- `test/architecture/hosted-web/phase-1/team-lifecycle/team-lifecycle-read-contract.test.ts`
- `test/architecture/hosted-web/phase-1/team-lifecycle/team-lifecycle-read-boundaries.test.ts`

Handoff path:

- `.codex-handoff/phase-01-p1-1d.json`

The sets are exact and mutually disjoint: five product + three test + one handoff = nine paths. All
other repository paths are read-only.

## Contract correction invariant

Request and response policy is intentionally asymmetric:

- Requests validate every known field and reject every unknown own string or symbol field. This
  strictness applies to the request top level and nested query context. The remediation must not
  weaken `createQueryContext` or any accepted shared parser.
- Same-version responses first require and validate every known field. Only after validation may
  additive fields be ignored. Missing/invalid known fields, invalid discriminants/combinations,
  malformed IDs/revisions/cursors, and unsupported schema versions still fail safely.
- Successful parsing constructs fresh frozen values containing only declared known fields. It never
  returns an input object/array by reference, spreads unknown input state, or mutates the source.
- Additive own string and symbol fields are accepted then discarded at each response-object boundary:
  success, failure, and inapplicable top levels; every success `items[]` entry; and the nested safe
  `error` object in a failure.
- Tests must prove the returned projections lack the additive keys/symbols. Merely proving that the
  source object retains them is insufficient.
- Tests must combine an additive field with each missing or invalid known-field case and prove the
  known-field error still wins. Additive data is never a bypass or substitute for required data.

All other original contract, semantic-outcome, ordering, safe-error, path/secret exclusion,
feature-boundary, and public-entrypoint requirements remain unchanged.

## Definition of Ready

- [ ] This exact seven-path router is policy-integrated after
      `1b37afb02bec25a1f08432d733595b553101ecab`.
- [ ] The successor controller reports `live=true` and binds the integrated router SHA.
- [ ] The runtime verifies the rejected artifact hash and formal `REJECT` without changing either.
- [ ] Exactly one producer starts in a fresh isolated worktree with the current remediation revision.
- [ ] The nine producer paths match the canonical base before salvage; every other path is unchanged.
- [ ] No prior attempt consumed this one-shot packet revision and no other producer/reviewer exists.
- [ ] P1.R2, P1.I, P1.F, Phase 2+, transport, renderer, filesystem, runtime, integration, and launch
      work remain absent.

Failure of any item stops admission. This router author cannot repair product code, launch a worker or
reviewer, integrate, commit, or push.

## Producer completion gate

- [ ] Exactly the nine producer-owned paths changed and nothing is staged.
- [ ] All three evidence IDs are `target_verified` and map only to owned paths.
- [ ] Every original positive semantic scenario and all three original negative/positive-neighbor rows
      pass with their exact diagnostics.
- [ ] Additive fields are accepted and discarded at all five response-object categories after
      known-field validation; returned values are fresh known-field-only projections.
- [ ] Top-level and nested request unknown fields remain rejected, including symbol fields.
- [ ] Invalid/missing known response fields and unsupported versions still reject in the presence of
      additive fields.
- [ ] Every original focused/ratchet test, lint, inherited-typecheck classification, Prettier, diff,
      provenance, ownership, binary, and lexical safety gate passes.
- [ ] The handoff is regenerated with the current packet/base/start identity, rejected-r3 provenance,
      all commands/counts, a complete negative/additive matrix, new per-file hashes, and a new patch
      hash; it does not reuse r3 hashes.
- [ ] No adapter, transport, mount, real runtime/project, integration, commit, push, P1.R2, P1.I,
      P1.F, or Phase 2+ work exists.

Successful production returns only a candidate with `nextAction: "review"`.

## Independent review gate

The reviewer must be a new job and isolated worktree, distinct from this router author and all P1.1D
producers. The reviewer must independently inspect the complete nine-path diff, rerun every required
command, reproduce all observed counts, recompute all hashes, exercise the full additive/strictness
matrix, verify r3 remains immutable and unintegrated, and return an explicit `ACCEPT` or `REJECT` with
P0/P1/P2 findings.

Only `ACCEPT` makes the candidate eligible for a separately authorized integration. This router does
not authorize or perform that integration. `REJECT`, `blocked`, or missing evidence ends this one-shot
node; there is no retry/refill. Independent `ACCEPT` and even later remediation integration still do
not authorize P1.R2, P1.I, P1.F, or Phase 2+.

## Monitoring and stop conditions

The live successor controller checks useful progress, base/start/packet freshness, single-worker
cardinality, exact ownership, rejected-artifact immutability, request strictness, response projection,
and architecture boundaries at least every ten minutes. Stop on stale identity, a second worker,
unowned or staged changes, accepted/rejected input mutation, failed additive or known-field negative,
weakened strict request parsing, reused r3 handoff/hash, inherited-diagnostic drift, an adapter/mount/
runtime/config/research edit, sensitive or binary data, or later-node activity. Return the blocker
record from `PACKET_STANDARD.md`; do not retry, refill, widen, repair outside ownership, or salvage into
another worktree.

## Exact docs-router checks

Run each command independently from this worktree:

```bash
export PATH=/usr/local/bin:/usr/bin:/bin:$PATH
node <<'NODE'
const fs = require('node:fs')
const path = require('node:path')
const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}
const same = (actual, expected) =>
  actual.length === expected.length && actual.every((value, index) => value === expected[index])
const routerPaths = [
  'docs/hosted-web-phases/START_HERE.md',
  'docs/hosted-web-phases/README.md',
  'docs/hosted-web-phases/EXECUTION_INDEX.json',
  'docs/hosted-web-phases/phase-01/README.md',
  'docs/hosted-web-phases/phase-01/controller-packet.md',
  'docs/hosted-web-phases/phase-01/execution-dag.md',
  'docs/hosted-web-phases/phase-01/lanes/p1-1d-additive-response-remediation.md',
]
const productPaths = [
  'src/features/team-lifecycle/contracts/team-lifecycle-read.ts',
  'src/features/team-lifecycle/contracts/index.ts',
  'src/features/team-lifecycle/core/application/ListTeamLifecycle.ts',
  'src/features/team-lifecycle/core/application/index.ts',
  'src/features/team-lifecycle/index.ts',
]
const testPaths = [
  'test/features/team-lifecycle/core/ListTeamLifecycle.test.ts',
  'test/architecture/hosted-web/phase-1/team-lifecycle/team-lifecycle-read-contract.test.ts',
  'test/architecture/hosted-web/phase-1/team-lifecycle/team-lifecycle-read-boundaries.test.ts',
]
const handoffPaths = ['.codex-handoff/phase-01-p1-1d.json']
const index = JSON.parse(fs.readFileSync(routerPaths[2], 'utf8'))
const node = 'P1.1D-additive-response-remediation'
assert(index.currentExecutableSubphase === node, 'wrong current subphase')
assert(same(index.currentExecutableNodes, [node]), 'wrong executable nodes')
assert(index.currentRoute.baseSha === '1b37afb02bec25a1f08432d733595b553101ecab', 'wrong base')
assert(index.currentRoute.lanePackets.length === 1, 'lane count is not one')
assert(index.currentRoute.lanePackets[0].path === routerPaths[6], 'wrong lane path')
assert(
  index.currentRoute.lanePackets[0].packetRevision ===
    'phase-01-p1-1d-additive-response-remediation-r1',
  'wrong packet revision'
)
assert(index.rejectedP11dR3Candidate.disposition === 'REJECT', 'wrong r3 disposition')
assert(index.rejectedP11dR3Candidate.immutable === true, 'r3 is not immutable')
assert(index.rejectedP11dR3Candidate.integrated === false, 'r3 marked integrated')
assert(
  index.rejectedP11dR3Candidate.patchSha256 ===
    'a7d5539e68e62b1c64e5cdf663bc784d92d4db03e74a0087e29d9bb3b2faa7ee',
  'wrong r3 patch'
)
assert(same(index.authorization.authorizedNodes, [node]), 'wrong authorization')
assert(
  same(index.authorization.blocked, ['P1.R2', 'P1.I', 'P1.F', 'Phase 2+']),
  'wrong blocked set'
)
assert(index.authorization.independentReviewRequiredBeforeIntegration === true, 'review not required')
assert(index.authorization.integrationAuthorized === false, 'integration authorized')
const owned = index.p11dAdditiveResponseRemediationExclusiveOwnership
assert(same(owned.productPaths, productPaths), 'product ownership drift')
assert(same(owned.testPaths, testPaths), 'test ownership drift')
assert(same(owned.handoffPaths, handoffPaths), 'handoff ownership drift')
assert(new Set([...productPaths, ...testPaths, ...handoffPaths]).size === 9, 'ownership overlap')
for (const routerPath of routerPaths) assert(fs.existsSync(routerPath), `missing ${routerPath}`)
for (const routerPath of routerPaths.filter((value) => value.endsWith('.md'))) {
  const source = fs.readFileSync(routerPath, 'utf8')
  for (const match of source.matchAll(/\]\(([^)]+)\)/g)) {
    const target = match[1].replace(/^<|>$/g, '').split('#')[0]
    if (!target || /^[a-z]+:/i.test(target)) continue
    assert(fs.existsSync(path.resolve(path.dirname(routerPath), target)), `broken link ${target}`)
  }
}
console.log('router-json-links-provenance: ok')
NODE
cd .. && node -e "JSON.parse(require('node:fs').readFileSync('docs/hosted-web-phases/EXECUTION_INDEX.json','utf8'))"
cd .. && pnpm exec prettier --check docs/hosted-web-phases/START_HERE.md docs/hosted-web-phases/README.md docs/hosted-web-phases/EXECUTION_INDEX.json docs/hosted-web-phases/phase-01/README.md docs/hosted-web-phases/phase-01/controller-packet.md docs/hosted-web-phases/phase-01/execution-dag.md docs/hosted-web-phases/phase-01/lanes/p1-1d-additive-response-remediation.md
cd .. && git diff --check
cd .. && git status --short
```

The four `cd ..` commands are the exact subscription-runtime checks and run from `src`. Run the
embedded semantic verifier from the repository root. Also require:

```bash
git diff --exit-code HEAD -- docs/hosted-web-phases/phase-01/lanes/p1-1d-team-lifecycle-read.md
test "$(git status --short)" = "$(printf '%s\n' ' M docs/hosted-web-phases/EXECUTION_INDEX.json' ' M docs/hosted-web-phases/README.md' ' M docs/hosted-web-phases/START_HERE.md' ' M docs/hosted-web-phases/phase-01/README.md' ' M docs/hosted-web-phases/phase-01/controller-packet.md' ' M docs/hosted-web-phases/phase-01/execution-dag.md' '?? docs/hosted-web-phases/phase-01/lanes/p1-1d-additive-response-remediation.md')"
router_paths=(docs/hosted-web-phases/START_HERE.md docs/hosted-web-phases/README.md docs/hosted-web-phases/EXECUTION_INDEX.json docs/hosted-web-phases/phase-01/README.md docs/hosted-web-phases/phase-01/controller-packet.md docs/hosted-web-phases/phase-01/execution-dag.md docs/hosted-web-phases/phase-01/lanes/p1-1d-additive-response-remediation.md)
rg -n -i '(-----BEGIN [A-Z ]*PR[I]VATE KEY-----|\bBearer[[:space:]]+[A-Za-z0-9]|\b(?:sk|ghp)_[A-Za-z0-9]{12,}|/(?:U[s]ers|h[o]me|r[o]ot)/|[A-Za-z]:\\U[s]ers\\|claude[-]runtime|(?:api[_-]?key|access[_-]?token|refresh[_-]?token|password|cookie|authorization|auth[_-]?payload|provider[_-]?payload|raw[_-]?(?:command|runtime)[_-]?body)[[:space:]]*[:=][[:space:]]*[^[:space:]]+)' "${router_paths[@]}"
file --mime-type "${router_paths[@]}"
git diff --check
git status --short
```

The high-signal lexical scan must exit 1 with zero matches; every file must be textual; the status must
be exactly the seven router paths with nothing staged. These checks author a dormant packet only. End
on `HOLD`: no commit, push, integration, reviewer/controller/producer launch, or later-node work.

# Phase 1 controller packet: P1.1D transport-neutral team-lifecycle read

## Status and authority

- Current node: `P1.1D`
- Canonical product base: `759a5d4f45c2142485a0acc13760f3de4d0ff6ea`
- Accepted predecessor: formal P1.R1 `ACCEPT`, policy-integrated at the canonical base
- Current packet: `phase-01-p1-1d-team-lifecycle-read-r1`
- Capacity after admission: exactly one serial producer
- Producer handoff: `.codex-handoff/phase-01-p1-1d.json`
- Blocked: P1.R2, integration/P1.I, P1.F, and Phase 2+

This transition authorizes one bounded product node. It does not reopen P1.R1, authorize another
producer, review or integrate a handoff, mount a transport, or advance a successor.

## Accepted P1.R1 provenance

| Field                  | Accepted value                                                |
| ---------------------- | ------------------------------------------------------------- |
| Reviewer               | `agent-teams-hosted-web-refactor-p1-r1-review-v16-r1`         |
| Review evidence commit | `759a5d4f45c2142485a0acc13760f3de4d0ff6ea`                    |
| Disposition            | `ACCEPT`                                                      |
| Routes                 | 16/16                                                         |
| Conformance            | 13/13                                                         |
| P0 / P1 / P2 findings  | 0 / 0 / 0                                                     |
| Preserved result       | `docs/research/hosted-web/phase-1/reviews/routes-ratchets.md` |

The accepted result proves the P1.S2 route/catalog and conformance inputs reviewed there. It leaves
P1.1D semantics and their positive neighbors unverified, which is the exact work this packet now
owns. The result and every other research-evidence path remain immutable.

## Outcome

Produce the first feature-owned, transport-neutral team-lifecycle read/list proof:

1. a narrow versioned request/response contract and runtime parser using the accepted hosted shared
   kernel;
2. a pure application port and list use case with deterministic safe outcomes;
3. narrow browser-safe public entrypoints;
4. focused product and architecture tests that prove `P1.NEG.SEMANTIC_OUTCOME` and the remaining
   P1.1D positive neighbors for `P1.NEG.LEGACY_GOD_DTO` and
   `P1.NEG.NO_FILESYSTEM_ADAPTER_PHASE1`; and
5. one structured handoff carrying evidence IDs `P1.1D.TEAM_LIFECYCLE_READ_CONTRACT`,
   `P1.1D.TEAM_LIFECYCLE_READ_USE_CASE`, and `P1.1D.TEAM_LIFECYCLE_SEMANTIC_PROOF`.

This node proves contracts and application semantics only. It deliberately stops before a driving or
driven production adapter.

## Immutable inputs and dependencies

- P1.1A shared contract conventions accepted at `041b5c7c2d3225b7dc2eca9e9b7b71aa33217060`.
- P1.1B/P1.1C routes, capability assertions, semantic harness, fixture corpus, and ratchets accepted
  at `6a9e9ab714359638fb93a6880855a53c9e8ef4be`.
- Formal P1.R1 `ACCEPT` integrated at `759a5d4f45c2142485a0acc13760f3de4d0ff6ea`.
- `docs/FEATURE_ARCHITECTURE_STANDARD.md`, the P1.1D packet, and the two Phase 1 sections named by
  that packet.

P1.1D depends on those exact accepted inputs. It does not depend on or authorize P1.R2, an IPC/HTTP
adapter, renderer work, production composition, or any Phase 2+ artifact.

## Launch gate

This packet is dormant until both conditions are true:

1. the exact docs-only router commit containing this controller packet, the single P1.1D packet, and
   the consistent router/index updates is policy-integrated after canonical P1.R1; and
2. the successor controller responsible for that integrated packet reports exactly `live=true`.

No controller exists or is launched by this docs change. Before both conditions, producer capacity is
zero. After both, the single `worker-start-v1` contract must bind:

- `projectId: agent-teams-hosted-web-refactor`;
- `phaseId: phase-01`, `laneId: p1-1d`, and
  `baseSha: 759a5d4f45c2142485a0acc13760f3de4d0ff6ea`;
- the integrated router commit as both `planBundleCommit` and `phaseStartSha`;
- this controller packet and `lanes/p1-1d-team-lifecycle-read.md` at revision
  `phase-01-p1-1d-team-lifecycle-read-r1`;
- one controller job and one source worktree; and
- the exact reads, writer paths, checks, evidence IDs, handoff, and stop conditions in the lane
  packet.

Any pre-integration start, `live!=true`, stale base, mixed packet/revision, second producer, extra
writable path, review/integration contract, or later-node contract fails closed with `packet_stale` or
`packet_conflict`.

The router commit may differ from canonical P1.R1 on exactly these seven contract-owned documentation
paths:

- `docs/hosted-web-phases/START_HERE.md`
- `docs/hosted-web-phases/README.md`
- `docs/hosted-web-phases/EXECUTION_INDEX.json`
- `docs/hosted-web-phases/phase-01/README.md`
- `docs/hosted-web-phases/phase-01/controller-packet.md`
- `docs/hosted-web-phases/phase-01/execution-dag.md`
- `docs/hosted-web-phases/phase-01/lanes/p1-1d-team-lifecycle-read.md`

The prior `lanes/p1-r1-review.md` and accepted review result are preserved, not router-owned. Any
eighth path, or any product, test, fixture, handoff, review-evidence, package, or config change in this
router rejects the transition.

## Exact producer ownership

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

The three sets are exact and mutually disjoint: five product + three test + one handoff = nine total
paths. All are exclusive to the one producer. Every unlisted path is read-only.

## Non-goals and architecture boundary

P1.1D must preserve the standard feature boundaries:

- contracts contain only DTOs, parsers, constants, and browser-safe shared contract imports;
- core application contains only the source port and use-case orchestration;
- test-owned in-memory values may implement the port, but product code contains no fake adapter;
- Electron, preload, renderer, IPC, HTTP/Fastify, filesystem/path/process, infrastructure,
  composition, route registration, and production mounts remain absent; and
- app shell, RouteCatalog/capabilities, fixtures, shared kernel, dependencies, package/config, and
  existing handoffs/evidence remain unchanged.

No fake browser implementation, real runtime/project access, raw provider/runtime payload, legacy
aggregate team DTO, path-bearing contract, transport-only error, or Phase 1 completion claim is
allowed.

## Definition of Ready

- [ ] This exact seven-path router is policy-integrated after
      `759a5d4f45c2142485a0acc13760f3de4d0ff6ea`.
- [ ] The successor controller reports `live=true` and binds the integrated router SHA.
- [ ] Exactly one producer starts from the canonical base with packet revision
      `phase-01-p1-1d-team-lifecycle-read-r1`.
- [ ] The nine producer paths are absent or unchanged at the canonical base as classified by the
      packet, and the source worktree has no unclassified change.
- [ ] No P1.R2, integration, P1.F, Phase 2+, transport, renderer, filesystem, or runtime worker exists.

Failure of any item stops admission. This router author cannot launch, repair, integrate, commit, or
push.

## Monitoring and stop conditions

While the one producer exists, the successor controller checks useful progress, packet/base/start
freshness, exact ownership, and boundary compliance at least every ten minutes. Stop on stale runtime
facts, a second worker, an unowned path, accepted-input drift, an IPC/HTTP/preload/renderer or
filesystem change, production mount, package/config edit, fake browser implementation, real
runtime/project access, secret/private-path evidence, inherited-diagnostic drift, or later-node
activity. Return the blocker record from `PACKET_STANDARD.md`; do not retry, refill, widen, repair
outside ownership, or convert production into integration work.

## Producer completion gate

- [ ] Only the exact nine producer-owned paths changed.
- [ ] All three evidence IDs are `target_verified` and map only to owned paths.
- [ ] The narrow DTO/parser and pure list use case pass the packet's positive, negative, boundary,
      focused, lint, typecheck-classification, Prettier, diff, ownership, and safety gates.
- [ ] `P1.NEG.SEMANTIC_OUTCOME` rejects the deliberate drift and its adjacent valid outcomes pass.
- [ ] The legacy-god-DTO and no-filesystem P1.1D positive neighbors pass without weakening the
      inherited ratchets.
- [ ] The handoff records all commands, exit codes, hashes, findings, unverified claims, and exact
      next action `review`.
- [ ] No adapter, transport, production mount, integration, commit, push, review, or successor exists.

Successful production returns the handoff for a later review/router decision. P1.R2, P1.I, P1.F, and
Phase 2+ remain blocked.

## Focused docs-router checks

The router author runs only these checks before handoff:

```bash
export PATH=/usr/local/bin:/usr/bin:/bin:$PATH
node <<'NODE'
const fs = require('node:fs')
const path = require('node:path')
const same = (actual, expected) =>
  actual.length === expected.length && actual.every((value, index) => value === expected[index])
const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}
const routerPaths = [
  'docs/hosted-web-phases/START_HERE.md',
  'docs/hosted-web-phases/README.md',
  'docs/hosted-web-phases/EXECUTION_INDEX.json',
  'docs/hosted-web-phases/phase-01/README.md',
  'docs/hosted-web-phases/phase-01/controller-packet.md',
  'docs/hosted-web-phases/phase-01/execution-dag.md',
  'docs/hosted-web-phases/phase-01/lanes/p1-1d-team-lifecycle-read.md',
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
const index = JSON.parse(fs.readFileSync('docs/hosted-web-phases/EXECUTION_INDEX.json', 'utf8'))
assert(index.currentExecutableSubphase === 'P1.1D', 'wrong current subphase')
assert(same(index.currentExecutableNodes, ['P1.1D']), 'wrong executable nodes')
assert(index.currentRoute.baseSha === '759a5d4f45c2142485a0acc13760f3de4d0ff6ea', 'wrong base')
assert(index.currentRoute.lanePackets.length === 1, 'lane count is not one')
assert(index.currentRoute.lanePackets[0].path === routerPaths[6], 'wrong lane path')
assert(
  index.currentRoute.lanePackets[0].packetRevision ===
    'phase-01-p1-1d-team-lifecycle-read-r1',
  'wrong packet revision',
)
const review = index.acceptedPhase1FormalRoutesAndRatchetsReview
assert(review.commit === '759a5d4f45c2142485a0acc13760f3de4d0ff6ea', 'wrong review commit')
assert(
  review.reviewer === 'agent-teams-hosted-web-refactor-p1-r1-review-v16-r1',
  'wrong reviewer',
)
assert(review.disposition === 'ACCEPT', 'wrong disposition')
assert(review.routesTests === '16/16' && review.conformanceTests === '13/13', 'wrong counts')
assert(Object.values(review.findings).every(value => value === 0), 'nonzero finding')
assert(same(index.authorization.authorizedNodes, ['P1.1D']), 'wrong authorization')
assert(
  same(index.authorization.blocked, ['P1.R2', 'P1.I', 'P1.F', 'Phase 2+']),
  'wrong blocked set',
)
assert(same(index.p11dExclusiveOwnership.productPaths, productPaths), 'product ownership drift')
assert(same(index.p11dExclusiveOwnership.testPaths, testPaths), 'test ownership drift')
assert(same(index.p11dExclusiveOwnership.handoffPaths, handoffPaths), 'handoff ownership drift')
assert(new Set([...productPaths, ...testPaths, ...handoffPaths]).size === 9, 'ownership overlap')
for (const routerPath of routerPaths) assert(fs.existsSync(routerPath), `missing ${routerPath}`)
for (const routerPath of routerPaths.filter(value => value.endsWith('.md'))) {
  const source = fs.readFileSync(routerPath, 'utf8')
  for (const match of source.matchAll(/\]\(([^)]+)\)/g)) {
    const target = match[1].replace(/^<|>$/g, '').split('#')[0]
    if (!target || /^[a-z]+:/i.test(target)) continue
    assert(fs.existsSync(path.resolve(path.dirname(routerPath), target)), `broken link ${target}`)
  }
}
console.log('router-json-links-provenance: ok')
NODE
pnpm exec prettier --write docs/hosted-web-phases/START_HERE.md docs/hosted-web-phases/README.md docs/hosted-web-phases/EXECUTION_INDEX.json docs/hosted-web-phases/phase-01/README.md docs/hosted-web-phases/phase-01/controller-packet.md docs/hosted-web-phases/phase-01/execution-dag.md docs/hosted-web-phases/phase-01/lanes/p1-1d-team-lifecycle-read.md
pnpm exec prettier --check docs/hosted-web-phases/START_HERE.md docs/hosted-web-phases/README.md docs/hosted-web-phases/EXECUTION_INDEX.json docs/hosted-web-phases/phase-01/README.md docs/hosted-web-phases/phase-01/controller-packet.md docs/hosted-web-phases/phase-01/execution-dag.md docs/hosted-web-phases/phase-01/lanes/p1-1d-team-lifecycle-read.md
git diff --check
test "$(git status --short)" = "$(printf '%s\n' ' M docs/hosted-web-phases/EXECUTION_INDEX.json' ' M docs/hosted-web-phases/README.md' ' M docs/hosted-web-phases/START_HERE.md' ' M docs/hosted-web-phases/phase-01/README.md' ' M docs/hosted-web-phases/phase-01/controller-packet.md' ' M docs/hosted-web-phases/phase-01/execution-dag.md' '?? docs/hosted-web-phases/phase-01/lanes/p1-1d-team-lifecycle-read.md')"
git status --short
```

The expected final status is exactly the seven router paths listed above and no other path. These
checks author a packet only; they do not start its producer.

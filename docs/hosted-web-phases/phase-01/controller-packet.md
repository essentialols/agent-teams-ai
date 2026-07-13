# Phase 1 controller packet: P1.S2 routes and conformance

## Status and authority

- Current subphase: `P1.S2`
- Canonical base: `041b5c7c2d3225b7dc2eca9e9b7b71aa33217060`
- Accepted predecessor: P1.S1 foundations plus schema-version remediation, independently accepted and
  integrated at the canonical base
- Current packets: `phase-01-s2-routes-r1` and `phase-01-s2-conformance-r1`
- Capacity after admission: exactly two parallel producers, one per packet
- Blocked: P1.S3/P1.R1 and every later node

The accepted P1.S0 ownership manifest froze the P1.1B and P1.1C evidence IDs, exact no-glob writer
sets, focused checks, negative-control ownership, and P1.R1 pairing. This transition activates only
those two independent rows; it does not revise or extend them.

## Launch gate

This packet is dormant product authority until both conditions are true:

1. the exact docs-only router commit containing this controller packet, both lane packets, and the
   consistent router/index updates is integrated after the canonical base; and
2. the successor controller responsible for that integrated packet reports `live=true`.

No controller exists or is launched by this docs change. Before both conditions, product-worker
capacity is zero. After both, each `worker-start-v1` contract must bind:

- `projectId: agent-teams-hosted-web-refactor`;
- `phaseId: phase-01` and `baseSha: 041b5c7c2d3225b7dc2eca9e9b7b71aa33217060`;
- the integrated router commit as both `planBundleCommit` and `phaseStartSha`;
- this controller packet and exactly one current lane packet;
- that packet's revision, exact reads, writer set, checks, and handoff path; and
- a distinct controller job and source worktree for the lane.

Any pre-integration launch, controller value other than `live=true`, mixed packet/revision, duplicate
lane, third producer, or later-node contract fails closed with `packet_stale` or `packet_conflict`.

The router commit may differ from the canonical base on exactly these eight contract-owned docs paths:

- `docs/hosted-web-phases/START_HERE.md`
- `docs/hosted-web-phases/README.md`
- `docs/hosted-web-phases/EXECUTION_INDEX.json`
- `docs/hosted-web-phases/phase-01/README.md`
- `docs/hosted-web-phases/phase-01/controller-packet.md`
- `docs/hosted-web-phases/phase-01/execution-dag.md`
- `docs/hosted-web-phases/phase-01/lanes/p1-s2-routes.md`
- `docs/hosted-web-phases/phase-01/lanes/p1-s2-conformance.md`

Any ninth path or any product/test/handoff change belongs to a different transition and rejects this
router packet.

## Outcome and non-goals

P1.S2 produces two independently reviewable handoffs: P1.1B proves minimal RouteCatalog and separate
capability assertions; P1.1C proves the semantic harness, synthetic fixture corpus, and architecture/
parity ratchets. The lanes may run concurrently because they share no writable path.

P1.S2 does not implement the P1.1D list feature, production IPC/HTTP/preload/renderer transport,
identity, auth, persistence, filesystem reads, runtime control, terminal behavior, dependencies,
shared integration wiring, reviews, or releases. Test-only descriptors and fixture data cannot be
mounted or advertised as production support.

## Lane registry and ownership

| Lane                  | Packet                       | Evidence IDs                          | Exact writer authority |
| --------------------- | ---------------------------- | ------------------------------------- | ---------------------- |
| `P1.1B` / routes      | `lanes/p1-s2-routes.md`      | `P1.1B.ROUTES`, `P1.1B.CAPABILITIES`  | packet list only       |
| `P1.1C` / conformance | `lanes/p1-s2-conformance.md` | `P1.1C.CONFORMANCE`, `P1.1C.RATCHETS` | packet list only       |

The complete exact sets are repeated in [`execution-dag.md`](execution-dag.md) and the respective lane
packets. A path has one live writer. Package/lock/config files, existing P1.1A source and tests, global
composition/registration, docs, research, accepted evidence, and the future P1.R1 review path are
read-only.

## Definition of Ready

- [ ] The router commit is integrated after `041b5c7c2`, contains changes to only the eight
      contract-owned documentation paths, and leaves canonical P1.S1 product/handoff bytes unchanged.
- [ ] The successor controller reports `live=true` and binds the exact integrated router commit.
- [ ] Both lane writer sets are absent or match the canonical base as applicable, are disjoint, and
      have no unclassified inherited changes.
- [ ] Each runtime contract binds exactly one lane; no P1.S3+ or duplicate producer exists.
- [ ] Accepted P1.S0 evidence and canonical P1.S1 paths remain immutable.

Failure of any item stops admission; this router author cannot repair, launch, integrate, or create a
controller.

## Monitoring and stop conditions

While the two jobs exist, the successor controller checks useful progress, packet/base/start
freshness, ownership, and negative controls at least every ten minutes. Stop only the affected lane on
stale identity, owned-path failure, missing required evidence, source-plan contradiction, secret or
private-path evidence, production exposure, filesystem/path-taking work, dependency/config/docs/
research changes, or unclassified failure. Stop both on writer overlap, accepted-evidence drift,
canonical P1.S1 drift, controller `live!=true`, a third producer, or an attempt to start P1.S3+.
Return the blocker record from `PACKET_STANDARD.md`; do not refill or widen either lane.

## P1.S2 completion gate

- [ ] P1.1B changed only its exact paths and returned both evidence IDs with its focused tests,
      negative diagnostics, lint, typecheck, formatting, diff, scope, and secret/path results.
- [ ] P1.1C changed only its exact paths and returned both evidence IDs with its focused tests,
      owned negative diagnostics, lint, typecheck, formatting, diff, scope, and secret/path results.
- [ ] Handoffs identify the same canonical base and integrated router `phaseStartSha`, contain exact
      commands/exit codes and patch hashes, and make no P1.S3, Phase 1, or production completion claim.
- [ ] The controller has not integrated either producer, created a reviewer, or launched a successor.

Completion returns the two candidates for independent P1.R1 admission review planning. P1.S3/P1.R1
remains blocked until a separate docs-only router transition is reviewed and integrated and its own
successor controller is live. No product worker, integration, push, or controller creation is an
action of this packet authoring transition.

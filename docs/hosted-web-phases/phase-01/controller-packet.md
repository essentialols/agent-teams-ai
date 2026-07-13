# Phase 1 controller packet: formal P1.R1 routes and ratchets review

## Status and authority

- Current node: `P1.R1`
- Canonical review base: `6a9e9ab714359638fb93a6880855a53c9e8ef4be`
- Accepted predecessor: P1.S2 routes and conformance, independently accepted and
  policy-integrated/pushed
- Current packet: `phase-01-p1-r1-review-r1`
- Capacity after admission: exactly one formal reviewer
- Reviewer output: `docs/research/hosted-web/phase-1/reviews/routes-ratchets.md`
- Blocked: P1.1D, P1.R2, integration/P1.I, P1.F, and Phase 2+

This transition authorizes review only. It does not reopen P1.S2, permit repairs, integrate a review,
or advance a successor.

## Full accepted-input provenance

| Role                                              | Commit or identity                                                                       | Disposition                                        |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------- |
| P1.S2 router/start                                | `a0dc964e9a71b782b1bbad4769db62a691e50c97`                                               | accepted and integrated                            |
| routes producer                                   | `74038b54eee23e93798b3aa5d11411d3f7e9adcf`                                               | independently `ACCEPTED`, policy-integrated/pushed |
| conformance producer and canonical combined input | `6a9e9ab714359638fb93a6880855a53c9e8ef4be`                                               | independently `ACCEPTED`, policy-integrated/pushed |
| admission staging lineage                         | `a9dd473d0847d090ece42b7ea7a0feed81de20c6` -> `02a6b3ac5ac2baaad55c413f8547252dddee4d41` | exact routes then combined input                   |
| admission reviewer                                | `agent-teams-hosted-web-refactor-p1-s2-admission-review-v15-r2`                          | `ACCEPT`                                           |

Admission covered exactly 37 disjoint paths, routes 16/16, conformance 13/13, green lint, Prettier,
diff, and secret checks, only seven unchanged inherited Phase 0 typecheck diagnostics, no P0/P1/P2
finding, and a clean workspace. Admitted commit `02a6b3ac5ac2baaad55c413f8547252dddee4d41` and canonical
commit `6a9e9ab714359638fb93a6880855a53c9e8ef4be` have identical tree
`22020029327465ed389cd4479db340082ae81601`. Admission authorizes formal-review routing; it is not the
formal P1.R1 disposition.

## Launch gate

This packet is dormant until both conditions are true:

1. the exact docs-only router commit containing this controller packet, the single review packet, and
   the consistent router/index updates is integrated after canonical P1.S2; and
2. the successor controller responsible for that integrated packet reports exactly `live=true`.

No controller exists or is launched by this docs change. Before both conditions, reviewer capacity is
zero. After both, the single `worker-start-v1` contract must bind:

- `projectId: agent-teams-hosted-web-refactor`;
- `phaseId: phase-01` and `baseSha: 6a9e9ab714359638fb93a6880855a53c9e8ef4be`;
- the integrated router commit as both `planBundleCommit` and `phaseStartSha`;
- this controller packet and `lanes/p1-r1-review.md` at revision
  `phase-01-p1-r1-review-r1`;
- one controller job and one source worktree not used by either producer or the admission reviewer;
  and
- the exact reads, single writer path, commands, and disposition contract in the lane packet.

Any pre-integration start, `live!=true`, stale base, mixed packet/revision, non-independent identity,
second reviewer, producer, repairer, integrator, or later-node contract fails closed with
`packet_stale` or `packet_conflict`.

The router commit may differ from canonical P1.S2 on exactly these seven contract-owned docs paths:

- `docs/hosted-web-phases/START_HERE.md`
- `docs/hosted-web-phases/README.md`
- `docs/hosted-web-phases/EXECUTION_INDEX.json`
- `docs/hosted-web-phases/phase-01/README.md`
- `docs/hosted-web-phases/phase-01/controller-packet.md`
- `docs/hosted-web-phases/phase-01/execution-dag.md`
- `docs/hosted-web-phases/phase-01/lanes/p1-r1-review.md`

Any eighth path, or any product, test, handoff, or research-evidence change, rejects this router.

## Outcome and non-goals

P1.R1 independently reviews the canonical P1.S2 route/catalog, capability assertions, semantic
harness, fixture corpus, and architecture/parity ratchets. The reviewer returns one formal `ACCEPT`
or `REJECT` at its exact owned evidence path.

P1.R1 does not change an input, repair a finding, implement P1.1D, add transport or feature behavior,
create another review artifact, integrate or push its output, launch a controller, or authorize later
work. The prior admission decision cannot satisfy the formal-review requirement and its reviewer
cannot fill this lane.

## Definition of Ready

- [ ] The router commit is integrated after `6a9e9ab714359638fb93a6880855a53c9e8ef4be`, changes only
      the seven listed documentation paths, and leaves all 37 P1.S2 input paths byte-identical.
- [ ] The successor controller reports `live=true` and binds the exact integrated router commit.
- [ ] The one reviewer identity, job, and worktree are distinct from both producers and
      `agent-teams-hosted-web-refactor-p1-s2-admission-review-v15-r2`.
- [ ] The reviewer output path is absent at the canonical base and no unclassified worktree change
      exists.
- [ ] No P1.1D, P1.R2, integration, P1.F, or Phase 2+ worker/controller exists.

Failure of any item stops admission. This router author cannot repair, launch, integrate, or create a
controller.

## Monitoring and stop conditions

While the one review job exists, the successor controller checks useful progress, packet/base/start
freshness, exact ownership, and reviewer independence at least every ten minutes. Stop on stale
identity, an input edit, a second output, an extra path, missing gate, secret/private-path evidence,
production or real-project access, a repair attempt, or any later-node activity. Return the blocker
record from `PACKET_STANDARD.md`; do not retry, refill, widen, or convert review into implementation.

## P1.R1 completion gate

- [ ] The reviewer changed only `docs/research/hosted-web/phase-1/reviews/routes-ratchets.md`.
- [ ] The result names canonical `6a9e9ab714359638fb93a6880855a53c9e8ef4be`, the admitted
      byte-identical input, the integrated router `phaseStartSha`, and its independence identity.
- [ ] Every exact architecture, scope, negative, focused, lint, typecheck, Prettier, diff, and
      secret/path gate is recorded with its command and exit code.
- [ ] The result is exactly `ACCEPT` or `REJECT`, with all findings and inherited diagnostics
      classified and no input repaired.
- [ ] The controller has not integrated or pushed the review, created a successor, or started later
      work.

Either result returns to a later router decision. Even `ACCEPT` leaves P1.1D, P1.R2, integration/P1.I,
P1.F, and Phase 2+ blocked until the review is integrated and a separate later docs-only router is
reviewed, integrated, and has its own successor controller live.

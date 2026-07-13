# Hosted Web execution router

Always begin with [`START_HERE.md`](START_HERE.md). This router selects the executable node; it does
not redefine product architecture or turn preserved evidence into worker instructions.

## Fixed route

1. Read the baseline in `START_HERE.md`.
2. Confirm the route in [`EXECUTION_INDEX.json`](EXECUTION_INDEX.json).
3. Read the current [`Phase 1 controller packet`](phase-01/controller-packet.md).
4. Read the single assigned
   [`P1.1D team-lifecycle read packet`](phase-01/lanes/p1-1d-team-lifecycle-read.md).
5. Read only the exact inputs and plan headings listed by that packet.

On conflict, stop with `packet_conflict`. A packet may narrow its authority but may not broaden scope,
change an ADR, weaken a guardrail, skip a gate, or repair an accepted input.

## Accepted P1.R1 provenance

P1.S2 routes and conformance are accepted at canonical commit
`6a9e9ab714359638fb93a6880855a53c9e8ef4be`. Formal P1.R1 reviewer
`agent-teams-hosted-web-refactor-p1-r1-review-v16-r1` independently returned `ACCEPT`, and that review
evidence is policy-integrated in canonical commit `759a5d4f45c2142485a0acc13760f3de4d0ff6ea`.

The formal result records routes 16/16, conformance 13/13, and zero P0, P1, and P2 findings. The
accepted result is preserved at
`docs/research/hosted-web/phase-1/reviews/routes-ratchets.md`; it is immutable input, not a current
writer path.

## Current execution

P1.1D is the sole current node. Its only packet is
[`p1-1d-team-lifecycle-read.md`](phase-01/lanes/p1-1d-team-lifecycle-read.md). Capacity is zero until
this exact seven-path router is policy-integrated and its successor controller reports `live=true`;
afterward capacity is exactly one serial producer.

The producer starts from canonical P1.R1 `759a5d4f45c2142485a0acc13760f3de4d0ff6ea` and may change
only the packet's exact, mutually disjoint product, test, and handoff paths. It proves one narrow,
transport-neutral team-lifecycle list use case with runtime contract parsing and deterministic
semantic outcomes. It closes the P1.1D-owned positive neighbors for
`P1.NEG.LEGACY_GOD_DTO`, `P1.NEG.NO_FILESYSTEM_ADAPTER_PHASE1`, and
`P1.NEG.SEMANTIC_OUTCOME` without mounting or simulating a transport.

## Boundaries and blocked successors

No IPC or HTTP route/client/handler, preload or renderer surface, filesystem adapter, production
composition or route mount, real runtime/project access, fake browser implementation, package/config
change, integration, commit, or push is authorized. Existing product inputs, fixtures, handoffs,
review evidence, and all research evidence are read-only.

P1.R2, integration/P1.I, P1.F, Phase 2, and all later work remain blocked. P1.1D completion is
necessary but not sufficient to start any of them: its handoff must be reviewed and a later docs-only
router must separately advance authority. This transition does not launch a worker or controller.

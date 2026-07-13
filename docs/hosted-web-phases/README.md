# Hosted Web execution router

Always begin with [`START_HERE.md`](START_HERE.md). This router selects the executable phase; it does
not redefine product architecture or turn preserved evidence into worker instructions.

## Fixed route

1. Read the baseline in `START_HERE.md`.
2. Confirm the route in [`EXECUTION_INDEX.json`](EXECUTION_INDEX.json).
3. Read the current [`Phase 1 controller packet`](phase-01/controller-packet.md).
4. Read the single assigned [`P1.R1 review packet`](phase-01/lanes/p1-r1-review.md).
5. Read only the exact inputs listed by that packet.

On conflict, stop with `packet_conflict`. A packet may narrow its authority but may not broaden scope,
change an ADR, weaken a guardrail, skip a gate, or repair a reviewed input.

## Accepted P1.S2 provenance

P1.S2 is accepted and policy-integrated/pushed. Its canonical lineage is:

- accepted router/start commit `a0dc964e9a71b782b1bbad4769db62a691e50c97`;
- independently accepted routes commit `74038b54eee23e93798b3aa5d11411d3f7e9adcf`;
- independently accepted conformance and canonical combined commit
  `6a9e9ab714359638fb93a6880855a53c9e8ef4be`.

Independent admission reviewer `agent-teams-hosted-web-refactor-p1-s2-admission-review-v15-r2`
returned `ACCEPT` for combined input `02a6b3ac5ac2baaad55c413f8547252dddee4d41` with exactly 37
disjoint paths, routes 16/16, conformance 13/13, lint, Prettier, diff, and secret checks green, only the
unchanged seven inherited Phase 0 typecheck diagnostics, no P0/P1/P2 finding, and a clean workspace.
That input and canonical P1.S2 have identical tree `22020029327465ed389cd4479db340082ae81601`.

## Current execution

P1.R1 is the sole current node. Its only packet is
[`p1-r1-review.md`](phase-01/lanes/p1-r1-review.md). Capacity is zero until this exact seven-path
docs-only router commit is integrated and its successor controller reports `live=true`; afterward
capacity is exactly one formal reviewer.

The reviewer must be independent from both P1.S2 producers and the admission reviewer above. It
reviews canonical `6a9e9ab714359638fb93a6880855a53c9e8ef4be`, may write only
`docs/research/hosted-web/phase-1/reviews/routes-ratchets.md`, runs the packet's exact architecture,
scope, negative, focused, and hygiene gates, and returns exactly `ACCEPT` or `REJECT`. It may not
repair, integrate, or extend the input.

## Blocked successors and evidence boundary

P1.1D, P1.R2, integration/P1.I, P1.F, Phase 2, and all later work remain blocked. A P1.R1 `ACCEPT` is
necessary but not sufficient to start any of them: the accepted review must be integrated and a later
reviewed router transition must separately advance authority. `REJECT` leaves the same nodes blocked.

All existing product, test, handoff, and research evidence paths are read-only. The only writable
research path is the new review result explicitly owned by the current packet. This transition does
not launch a worker or controller.

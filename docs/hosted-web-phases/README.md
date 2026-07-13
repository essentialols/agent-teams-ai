# Hosted Web execution router

Always begin with [`START_HERE.md`](START_HERE.md). This router selects the executable phase; it does
not redefine product architecture or turn preserved evidence into worker instructions.

## Fixed route

1. Read the baseline in `START_HERE.md`.
2. Confirm the route in [`EXECUTION_INDEX.json`](EXECUTION_INDEX.json).
3. Read the current [`Phase 1 controller packet`](phase-01/controller-packet.md).
4. Read exactly one assigned lane packet.
5. Read only exact lane references listed in the runtime contract.

On conflict, stop with `packet_conflict`. A packet may narrow its authority but may not broaden scope,
change an ADR, weaken a guardrail, or skip an exit gate.

## Current execution

Phase 0 and P1.S0 are accepted history. P1.S1 foundations and the bounded schema-version remediation
were independently accepted and integrated in canonical commit
`041b5c7c2d3225b7dc2eca9e9b7b71aa33217060`; this disposition supersedes the remediation handoff's
then-unverified review and integration claims without rewriting that preserved handoff.

P1.S2 is current. Its sole router packet set is:

- [`p1-s2-routes.md`](phase-01/lanes/p1-s2-routes.md) for `P1.1B.ROUTES` and
  `P1.1B.CAPABILITIES`;
- [`p1-s2-conformance.md`](phase-01/lanes/p1-s2-conformance.md) for `P1.1C.CONFORMANCE` and
  `P1.1C.RATCHETS`.

These are exactly two parallel producer slots with disjoint writer sets frozen by the accepted
ownership manifest. Neither lane may edit the other's paths, shared/global files, documentation,
research, dependencies, configuration, or production transport registration.

## Launch boundary

No product worker may start from the canonical P1.S1 commit alone. The exact docs-only router commit
must first be integrated, and the successor controller must be live with `live=true`. Each
`worker-start-v1` contract must bind that router commit as `planBundleCommit` and `phaseStartSha`,
`041b5c7c2d3225b7dc2eca9e9b7b71aa33217060` as `baseSha`, and exactly one of the two current lane
packets. Before both gates, current producer count is zero; after them, capacity is exactly one worker
per lane and two total. This packet production does not launch either worker.

## Blocked successors and evidence boundary

P1.S3/P1.R1, P1.S4, P1.S5, Phase 2, and all later work remain blocked. Completion of both producers
returns two handoffs to the controller; it does not start review, integration, feature-slice, or
production work. `docs/research/hosted-web` remains preserved evidence and may be read only by exact
path when a current packet requires it.

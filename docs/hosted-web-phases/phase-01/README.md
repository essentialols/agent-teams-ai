# Phase 1: contracts and conformance

Status: **P1.S2 router authority for exactly two parallel, non-overlapping producers after the launch
gate**. P1.S3 and every later subphase remain blocked.

## Accepted predecessors

P1.S0 is accepted at `6f1a87daa9a4bfdf5d754347d92f313f28d0f95d`; its six bootstrap evidence
paths and historical `phaseStartSha` remain immutable. P1.S1 foundations and schema-version
remediation are independently accepted and integrated in canonical commit
`041b5c7c2d3225b7dc2eca9e9b7b71aa33217060`. The preserved remediation handoff remains historical
input; this operator-directed disposition closes its then-unverified review and integration claims.

## Current route

The route contains exactly these packets:

1. [`controller-packet.md`](controller-packet.md)
2. exactly one of:
   - [`lanes/p1-s2-routes.md`](lanes/p1-s2-routes.md) — `P1.1B` route/catalog and capability
     assertions;
   - [`lanes/p1-s2-conformance.md`](lanes/p1-s2-conformance.md) — `P1.1C` conformance and ratchets.

The lanes may run concurrently only because the accepted ownership manifest gives them disjoint exact
writer sets. Each worker receives one lane packet and may not repair, complete, or edit the other lane.

## Launch and capacity

This docs-only transition does not launch workers. No product worker may start until the router commit
containing these exact packets is integrated and a successor controller reports `live=true`. The
runtime must bind the integrated router commit as both `planBundleCommit` and `phaseStartSha`, canonical
P1.S1 commit `041b5c7c2d3225b7dc2eca9e9b7b71aa33217060` as `baseSha`, and exactly one lane packet.

Before that gate, capacity is zero. After it, capacity is exactly two producers total: one P1.1B and
one P1.1C. There is no duplicate, refill, retry, replacement, reviewer, feature-slice, integration, or
later-phase slot in this route.

## Scope and successor boundary

P1.1B owns only the exact RouteCatalog, route-type, route-test, negative-fixture, and handoff paths in
its packet. P1.1C owns only the exact three scanners, architecture tests, synthetic fixture corpus,
and handoff path in its packet. Package/lock/config files, legacy APIs, global composition, production
IPC/HTTP/preload/renderer registration, documentation, and research are read-only to both.

Both handoffs are inputs to a later independent P1.R1 review. They do not authorize P1.S3/P1.R1 or
P1.1D. A separate reviewed router transition is required before any later worker or controller
objective can become live.

The planning files below remain exact reference-on-demand inputs only when a current packet lists
them; they are not an unconditional reading queue:

- `architecture-and-contracts.md`
- `conformance-and-tests.md`
- `operations-and-risk.md`
- `execution-packet-templates.md`
- `packet-inputs.md`

The authoritative current dependency and ownership projection is
[`execution-dag.md`](execution-dag.md).

# Hosted Web execution router

Always begin with [`START_HERE.md`](START_HERE.md). This router selects the executable node; it does
not redefine product architecture or turn accepted or rejected evidence into worker instructions.

## Fixed route

1. Read the baseline in `START_HERE.md`.
2. Confirm the route in [`EXECUTION_INDEX.json`](EXECUTION_INDEX.json).
3. Read the current [`Phase 1 controller packet`](phase-01/controller-packet.md).
4. Read the single assigned
   [`P1.1D additive-response remediation packet`](phase-01/lanes/p1-1d-additive-response-remediation.md).
5. Read only the exact inputs and plan headings listed by that packet.

On conflict, stop with `packet_conflict`. A packet may narrow its authority but may not broaden scope,
change an ADR, weaken a guardrail, skip a gate, or repair an accepted or rejected input in place.

## Accepted and rejected provenance

P1.S2 routes and conformance are accepted at
`6a9e9ab714359638fb93a6880855a53c9e8ef4be`. Formal P1.R1 reviewer
`agent-teams-hosted-web-refactor-p1-r1-review-v16-r1` returned `ACCEPT`; that evidence is
policy-integrated at `759a5d4f45c2142485a0acc13760f3de4d0ff6ea`. The original P1.1D docs router is
canonical at `1b37afb02bec25a1f08432d733595b553101ecab`.

The later P1.1D r3 implementation patch
`a7d5539e68e62b1c64e5cdf663bc784d92d4db03e74a0087e29d9bb3b2faa7ee` was independently
`REJECT`ed with one P1 response-compatibility finding. Its exact nine-path output remains immutable
rejected evidence and has no integration or worker-start authority.

## Current execution

`P1.1D-additive-response-remediation` is the sole current node. Its only packet is
[`p1-1d-additive-response-remediation.md`](phase-01/lanes/p1-1d-additive-response-remediation.md).
Capacity is zero until this exact seven-path router is policy-integrated and its successor controller
reports `live=true`; afterward capacity is exactly one serial producer in a fresh worktree.

The producer starts from canonical router commit
`1b37afb02bec25a1f08432d733595b553101ecab`, may use the rejected r3 artifact only as a read-only
salvage input, and may change only the exact five product, three test, and one handoff paths. It must
retain strict request parsing while making every same-version response parser validate all known
fields first, build a fresh known-field projection, and discard additive own fields at the
success/failure/inapplicable top level and in nested item and safe-error objects. It must rerun all
original semantic, architecture, quality, provenance, ownership, hash, and safety gates and
regenerate the handoff and every hash.

## Review and blocked successors

Producer success is only a remediation candidate. A separately provisioned reviewer, independent of
the router author and all P1.1D producers, must rerun the required gates and return `ACCEPT` before a
separately authorized integration may occur. This docs transition launches neither producer nor
reviewer and authorizes no integration.

No IPC/HTTP route, client, or handler; preload/renderer surface; filesystem adapter; production
composition or mount; real runtime/project access; fake browser; package/config change; commit; or
push is authorized. P1.R2, P1.I, P1.F, Phase 2, and all later work remain blocked after production,
review, or integration of this remediation. A later reviewed router and live successor controller
must separately advance authority.

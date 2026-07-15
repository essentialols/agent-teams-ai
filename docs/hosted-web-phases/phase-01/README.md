# Hosted Web Phase 1

Current authority is `phase-01-p1-i-router-r1`; terminal state is `HOLD`.

## Accepted predecessor

Formal P1.R2 evidence is integrated at canonical SHA
`c5d842f75ca7a647a0773b0c30d303d7da21d1d6`. The review ran from authority
`f6794b607609c57dc92def696d05946c9c96856a`, returned `ACCEPT`, and recorded P0/P1/P2
`0/0/0`. Its reviewed-product snapshot remains
`666042037a9c91df572b1d8274bf6024f8d00f40`.

The accepted handoff and Markdown result are frozen:

1. `.codex-handoff/phase-01-p1-r2.json`
2. `docs/research/hosted-web/phase-1/reviews/list-semantics.md`

P1.I consumes these files but never edits or reintegrates them. The historical
[`p1-r2-review.md`](lanes/p1-r2-review.md) packet is no longer executable.

## Current P1.I node

The only current packet is
[`p1-i-integration.md`](lanes/p1-i-integration.md). After this exact seven-path router is
independently accepted, broker-integrated, and pushed, root may authorize exactly one P1.I producer
from the resolved pushed authority.

The required profile is:

- model `gpt-5.6-sol`;
- reasoning effort `xhigh`;
- `serviceTier: "default"`; and
- Fast prohibited.

Root remains the sole orchestrator. `controller-v17` stays `HOLD` and observation-only. No successor
controller is authorized. The producer is admitted through `codex_goal_project_refill_worker` from
`origin/refactor/hosted-web-feature-boundaries`, with `reviewKind: implementation`,
`inputPatchHash: null`, and all authority fields bound to the resolved
`postIntegrationAuthoritySha`. Dependencies are broker-materialized offline; the producer performs no
network query or installation.

After the producer terminates with the strict result and broker-captured immutable five-path output,
root may admit exactly one fresh independent P1.I milestone reviewer. It uses `gpt-5.6-sol`, `xhigh`,
and `serviceTier: "default"`; Fast is prohibited. It is read-only over the exact 68 frozen inputs plus
the five outputs, and it may not overlap the producer or another reviewer.

## P1.I mission and gates

P1.I performs serialized adoption and evidence freeze over 68 immutable canonical inputs. It writes
only the five paths frozen under `ownerId: "P1.I"` in the ownership manifest:

1. `.codex-handoff/phase-01-p1-i.json`
2. `docs/research/hosted-web/phase-1/decision-register.json`
3. `docs/research/hosted-web/phase-1/estimate-reconciliation.json`
4. `docs/research/hosted-web/phase-1/evidence-index.json`
5. `docs/research/hosted-web/phase-1/integration-report.json`

Required proof includes:

- full Phase 1 Vitest plus team-lifecycle: 13/13 files and 59/59 tests;
- focused `P1.NEG.RATCHET_REGRESSION`: 1/1 file and 3/3 tests, including pinned positive neighbors,
  debt-after-rename rejection, expired-quarantine rejection, and exact
  `phase1-ratchet-regression` diagnostics;
- typecheck with exactly seven inherited Phase 0 diagnostics, zero owned, and zero unexpected;
- full `pnpm lint`, exact 73-path Prettier, diff/scope, and classified
  secret/provider/private-path/binary scans;
- exact authority, content-hash, decision, estimate, and evidence-lifecycle provenance; and
- scratch-only forward/reverse apply proof over the exact 54-path rollback payload, with no
  repository mutation.

No implementation/product edit, raw Git integration, registry write, agent-flow test, runtime/team
launch, provider check, or real-project access is permitted.

## HOLD boundary

P1.I producer completion ends `HOLD` with a five-file candidate. It is not independent acceptance and
does not by itself authorize integration. The serial milestone reviewer must return explicit
`ACCEPT` or `REJECT`. On `ACCEPT`, root may mechanically call `mark_reviewed`, then the broker may
integrate and push exactly the five P1.I outputs. `REJECT` authorizes neither lifecycle action.

P1.F remains blocked until another separately reviewed router transition after accepted P1.I
integration. This router does not authorize P1.F. Phase 2+, product workers, controller replacement,
and successor controllers remain blocked.

The authoritative dependency projection is [`execution-dag.md`](execution-dag.md).

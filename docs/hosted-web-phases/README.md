# Hosted Web execution router

> Current route: `phase-01-p1-i-router-r1`, authored from integrated P1.R2 `ACCEPT` at
> `c5d842f75ca7a647a0773b0c30d303d7da21d1d6`. After independent router acceptance, broker
> integration, and push, it conditionally authorizes exactly one P1.I evidence-freeze producer using
> `gpt-5.6-sol`, `xhigh`, and `serviceTier: "default"`, followed serially by exactly one fresh
> independent milestone reviewer using that same profile. Fast is prohibited. This docs transition
> launches nothing and ends `HOLD`.

Always begin with [`START_HERE.md`](START_HERE.md). Machine-readable authority is
[`EXECUTION_INDEX.json`](EXECUTION_INDEX.json). The current executable packets are
[`controller-packet.md`](phase-01/controller-packet.md) and
[`p1-i-integration.md`](phase-01/lanes/p1-i-integration.md).

## Accepted P1.R2 authority

Canonical SHA `c5d842f75ca7a647a0773b0c30d303d7da21d1d6` integrates exactly the P1.R2 handoff and
formal review result. The review authority is `f6794b607609c57dc92def696d05946c9c96856a`; the
separate reviewed-product snapshot is `666042037a9c91df572b1d8274bf6024f8d00f40`. Formal
disposition is `ACCEPT` with P0/P1/P2 `0/0/0`.

The two evidence files are immutable. P1.I reads them but cannot edit, regenerate, replay, or
reintegrate them. The prior P1.R2 lane remains accepted history only.

## P1.I route

The router's `packetBaseSha` is the accepted evidence integration SHA above. The future
`postIntegrationAuthoritySha` is intentionally unresolved until the broker integrates and pushes the
accepted router. Root must bind the exact broker-returned commit to the explicit remote branch ref,
prove a clean worktree, and capture immutable pre-start authority evidence. The producer does not
perform a network recheck.

The producer performs serialized adoption, complete Phase 1 gates, explicit rollback/apply proof, and
evidence freeze over 68 immutable inputs. It owns exactly five JSON outputs:

1. `.codex-handoff/phase-01-p1-i.json`
2. `docs/research/hosted-web/phase-1/decision-register.json`
3. `docs/research/hosted-web/phase-1/estimate-reconciliation.json`
4. `docs/research/hosted-web/phase-1/evidence-index.json`
5. `docs/research/hosted-web/phase-1/integration-report.json`

Evidence IDs are `P1.I.INTEGRATION` and `P1.I.ROLLBACK`. The producer must also publish fresh
acceptance evidence for `P1.NEG.RATCHET_REGRESSION`.

Required quality proof is the full Phase 1 Vitest plus team-lifecycle command, focused ratchet test,
the exact frozen seven-diagnostic typecheck classification, full lint, Prettier, diff/scope,
secret/provider/private-path/binary scans, exact provenance, and a scratch-only 54-path forward/reverse
rollback round trip. No product edit, dependency install, raw Git integration, registry write,
agent-flow test, runtime/team launch, provider check, or real-project access is permitted.

## Orchestration and HOLD

Root remains the sole orchestrator. `controller-v17` remains `HOLD` and observation-only. It cannot
launch, admit, integrate, restart, replace itself, or create a successor. The router author launches
nothing, and no product or P1.I worker may launch before the accepted router is broker-integrated,
pushed, and immutably attested.

P1.I completion returns a five-file candidate and ends `HOLD`. This router then authorizes root to
start exactly one fresh independent P1.I milestone reviewer, never concurrently with the producer or
another reviewer. The reviewer is read-only over the 68 frozen inputs and five immutable outputs,
uses the default-only profile, and returns explicit `ACCEPT` or `REJECT`.

On `ACCEPT`, root may call `mark_reviewed` and the broker may integrate and push exactly those five
outputs. `REJECT` leaves the candidate unreviewed and unintegrated.

P1.F remains blocked until a separate reviewed router transition after accepted P1.I integration.
Phase 2+, product workers, controller replacement, and successor controllers remain blocked.

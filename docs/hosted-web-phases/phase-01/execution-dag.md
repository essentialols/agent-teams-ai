# Phase 1 execution DAG and ownership

Status: current revision is `phase-01-p1-i-router-r1`; terminal state is `HOLD`.

## Current DAG

```text
accepted P1.R1 architecture/ratchet review
                         |
                         v
accepted P1.1D transport-neutral list contract and remediation
                         |
                         v
P1.R2 formal semantic review at f6794b607...
ACCEPT + P0/P1/P2 0/0/0
                         |
                         v
exact two evidence paths broker-integrated at c5d842f75...
                         |
                         v
seven-path P1.I router authored at c5d842f75...
                         |
                         v
independent router review -> broker integration + push
                         |
                         v
root resolves and immutably attests postIntegrationAuthoritySha
clean + exact origin refs/heads/refactor/hosted-web-feature-boundaries equality
                         |
                         v
root admits exactly one P1.I producer
gpt-5.6-sol + xhigh + default service tier; Fast prohibited
expectedSourceCommit/HEAD/contract authority = postIntegrationAuthoritySha
                         |
                         v
serialized adoption of 68 immutable canonical inputs
P1.R2 evidence consumed; never edited or reintegrated
                         |
                         v
full Phase 1 Vitest plus team-lifecycle: 13 files / 59 tests
focused P1.NEG.RATCHET_REGRESSION: 1 file / 3 tests
                         |
                         v
typecheck 7 inherited / 0 owned / 0 unexpected
full lint + exact Prettier + diff/scope + classified scans
                         |
                         v
54-path scratch-only forward/reverse rollback/apply proof
                         |
                         v
decision + estimate + evidence + integration + handoff freeze candidate
exact five JSON outputs
                         |
                         v
strict P1_I_PRODUCER_RESULT + immutable five-path output
                         |
                         v
                        HOLD
                         |
                         v
root admits exactly one fresh independent P1.I milestone reviewer
gpt-5.6-sol + xhigh + default service tier; Fast prohibited
read-only 68 frozen inputs + 5 immutable outputs; no concurrent reviewer
                         |
                         v
explicit ACCEPT or REJECT
             ACCEPT ----+---- REJECT -> HOLD; no mark_reviewed or integration
                |
                v
root mark_reviewed -> broker integrates + pushes exactly five P1.I outputs
                |
                v
               HOLD
                |
                -X-> P1.F requires a separate reviewed router after accepted integration
                         -X-> Phase 2+ / product workers / successor controllers
```

Root is the sole orchestrator. `controller-v17` remains `HOLD` and observation-only. Controller
launch, admission, integration, restart, replacement, and successor creation are not DAG edges. The
router author launches nothing.

## Proven identities

| Record                     | Identity                                   | Authority                                                     |
| -------------------------- | ------------------------------------------ | ------------------------------------------------------------- |
| P1.S0 bootstrap            | `5f30df49e052d1cc1d0e7efd03aa105673b5b614` | rollback payload absence/base provenance                      |
| Reviewed product snapshot  | `666042037a9c91df572b1d8274bf6024f8d00f40` | P1.R2's exact 32 reviewed product inputs                      |
| P1.R2 review authority     | `f6794b607609c57dc92def696d05946c9c96856a` | formal review worktree authority                              |
| Accepted P1.R2 integration | `c5d842f75ca7a647a0773b0c30d303d7da21d1d6` | exact two frozen evidence paths and router authoring base     |
| Router authority           | `phase-01-p1-i-router-r1` at `c5d842f75…`  | current seven-path candidate only                             |
| Producer authority         | `postIntegrationAuthoritySha`              | exact future broker-returned pushed router integration commit |
| Current evidence           | `P1.I.INTEGRATION`, `P1.I.ROLLBACK`        | pending one producer, one serial reviewer, and integration    |

The distinct SHA roles cannot be collapsed. The future producer authority does not rewrite the
accepted P1.R2 integration or reviewed-product snapshot.

## Current capacity and ownership

Capacity is exactly one P1.I producer after the router's independent acceptance, broker integration,
push, and authority attestation, followed by exactly one fresh independent milestone reviewer after
producer termination and immutable output capture. Both profiles are `gpt-5.6-sol`, `xhigh`, and
`serviceTier: "default"`; Fast is prohibited. Dependencies are broker-materialized offline.

The producer writes exactly:

1. `.codex-handoff/phase-01-p1-i.json`
2. `docs/research/hosted-web/phase-1/decision-register.json`
3. `docs/research/hosted-web/phase-1/estimate-reconciliation.json`
4. `docs/research/hosted-web/phase-1/evidence-index.json`
5. `docs/research/hosted-web/phase-1/integration-report.json`

The 68 canonical inputs, the 54 rollback-payload paths, the P1.R1/P1.R2 reviews, all product/test
bytes, router files, configuration, packages, lockfiles, and every unrelated path are read-only. A
sixth output, staged path, tracked diff, product edit, P1.R2 evidence edit, or repository patch apply
is not a DAG edge.

## Gate transition

All 14 gate IDs in `EXECUTION_INDEX.json` must pass. The broad commands are:

```bash
pnpm exec vitest run test/features/team-lifecycle test/architecture/hosted-web/phase-1
pnpm exec vitest run test/architecture/hosted-web/phase-1/parity/parity-references.test.ts
pnpm typecheck
pnpm lint
pnpm exec prettier --check <exact 73-path scope>
git diff --check
git diff --cached --quiet
git diff --exit-code
git status --short
```

The ratchet transition requires positive pinned references/counts and deliberate over-count-after-
rename plus expired-quarantine failures with exact `phase1-ratchet-regression`. The rollback
transition requires a 54-path binary patch, forward byte comparison, reverse absence proof, scratch
cleanup, and unchanged repository state. No actual repository integration or product rollback occurs.

Any authority, input, gate, output, safety, rollback, decision, estimate, or evidence-lifecycle failure
ends `HOLD`. There is no producer repair, retry, refill, second attempt, or narrower completion path.

## Completion boundary

P1.I producer completion requires the strict terminal line and broker-captured immutable output
binding all five result paths. `changedFiles`, heartbeat, PID, tmux, and `providerObserved` cannot
close the edge.

The five-file candidate then remains `HOLD` while root serially starts the one authorized milestone
reviewer. The reviewer has no repository writer authority and reads exactly the 68 frozen inputs plus
the five immutable outputs. It returns explicit `ACCEPT` or `REJECT`. On `ACCEPT`, root may call
`mark_reviewed`, then the broker may integrate and push exactly the five P1.I outputs. On `REJECT`,
neither action is authorized. The already integrated P1.R2 evidence is never in that integration set.

P1.F remains blocked even after a future P1.I integration until a separate reviewed router transition.
No edge authorizes Phase 2+, product work, controller replacement, or a successor controller.

# Hosted-web execution: start here

> Current route: `phase-01-p1-i-router-r1`, authored at canonical
> `c5d842f75ca7a647a0773b0c30d303d7da21d1d6` after formal P1.R2 evidence was integrated with
> `ACCEPT` and P0/P1/P2 `0/0/0`. The route conditionally authorizes exactly one P1.I producer only
> after independent router acceptance, broker integration, and push, then exactly one fresh
> independent P1.I milestone reviewer after the producer has terminated with immutable five-path
> output. Both use `gpt-5.6-sol`, `xhigh`, and `serviceTier: "default"`; Fast is prohibited. This
> router launches nothing and ends `HOLD`.

The accepted P1.R2 integration commit changes exactly:

1. `.codex-handoff/phase-01-p1-r2.json`
2. `docs/research/hosted-web/phase-1/reviews/list-semantics.md`

Those evidence files are frozen and may never be edited or reintegrated by P1.I. The P1.R2 review
authority is `f6794b607609c57dc92def696d05946c9c96856a`; its separate reviewed-product snapshot is
`666042037a9c91df572b1d8274bf6024f8d00f40`.

Root is the sole orchestrator. `controller-v17` remains `HOLD` and observation-only. It cannot
launch, admit, integrate, restart, replace itself, or create a successor. After the router is accepted,
broker-integrated, and pushed, root resolves the exact broker-returned pushed
`postIntegrationAuthoritySha`, proves a clean worktree, and immutably attests equality to the sole
result of `git ls-remote origin refs/heads/refactor/hosted-web-feature-boundaries`. The producer makes
no network or remote query. No product or P1.I worker may launch before that router integration and
authority attestation.

## Deterministic reading order

1. `AGENTS.md`
2. This file
3. `docs/hosted-web-phases/EVIDENCE_LIFECYCLE.md`
4. `docs/hosted-web-phases/README.md`
5. `docs/hosted-web-phases/EXECUTION_INDEX.json`
6. `docs/hosted-web-phases/phase-01/controller-packet.md`
7. `docs/hosted-web-phases/phase-01/lanes/p1-i-integration.md`
8. `CLAUDE.md`
9. `AGENT_CRITICAL_GUARDRAILS.md`
10. `docs/FEATURE_ARCHITECTURE_STANDARD.md`
11. `docs/hosted-web-phases/PACKET_STANDARD.md`
12. `docs/hosted-web-phases/phase-01/README.md`
13. `docs/hosted-web-phases/phase-01/execution-dag.md`
14. `docs/hosted-web-phases/phase-01/architecture-and-contracts.md`
15. `docs/hosted-web-phases/phase-01/conformance-and-tests.md`
16. `docs/hosted-web-phases/phase-01/operations-and-risk.md`
17. `docs/hosted-web-phases/phase-01/packet-inputs.md`
18. the exact 68 paths in `EXECUTION_INDEX.json.phase1CanonicalInputs`, in its exact declared group
    and path order

Do not replace the exact machine manifest with a directory read or glob. Do not recursively inspect
unrelated research, rejected job state, or product paths outside the manifest.

## Current producer contract

The only current node is `P1.I`, represented by
[`p1-i-integration.md`](phase-01/lanes/p1-i-integration.md). It becomes startable only after this
router's independent acceptance, broker integration, push, and root authority attestation.

The producer writes only:

1. `.codex-handoff/phase-01-p1-i.json`
2. `docs/research/hosted-web/phase-1/decision-register.json`
3. `docs/research/hosted-web/phase-1/estimate-reconciliation.json`
4. `docs/research/hosted-web/phase-1/evidence-index.json`
5. `docs/research/hosted-web/phase-1/integration-report.json`

Its mission is serialized adoption, full Phase 1 gate closure, exact rollback/apply proof, and evidence
freeze for `P1.I.INTEGRATION` and `P1.I.ROLLBACK`, including fresh acceptance evidence for
`P1.NEG.RATCHET_REGRESSION`.

Required checks include:

- `pnpm exec vitest run test/features/team-lifecycle test/architecture/hosted-web/phase-1`, exactly
  13/13 files and 59/59 tests;
- focused parity/ratchet Vitest, exactly 1/1 file and 3/3 tests;
- `pnpm typecheck`, with exactly seven inherited Phase 0 diagnostics and zero owned/unexpected;
- full `pnpm lint`;
- exact 73-path Prettier, diff/scope, and classified secret/provider/private-path/binary scans; and
- exact 54-path scratch-only forward/reverse rollback proof with no repository mutation.

The producer performs no implementation/product edit, raw Git integration, registry write, agent-flow
test, dependency install, network/fetch/GitHub action, runtime/team/provider action, or real-project
access.

## Completion boundary

P1.I producer completion requires a strict terminal result plus broker-captured immutable output
binding all five paths. Runtime observations alone are insufficient. Completion ends `HOLD` for a
serially authorized independent milestone review. Root may start exactly one fresh reviewer only
after the producer is terminal and no producer or reviewer is active. The reviewer is read-only over
the 68 frozen inputs plus the five immutable outputs, uses the same default-only profile, and must
return explicit `ACCEPT` or `REJECT`.

On `ACCEPT`, root may mechanically call `mark_reviewed`, then the broker may integrate and push
exactly the five P1.I outputs. `REJECT` authorizes neither action. This router does not authorize
P1.F or a successor controller. Even after accepted P1.I integration, only a later separately
reviewed router may consider P1.F. P1.F, Phase 2+, product workers, and successor controllers remain
blocked.

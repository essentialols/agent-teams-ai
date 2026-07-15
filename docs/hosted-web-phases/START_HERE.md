# Hosted-web execution: start here

> Current route: `phase-01-p1-r2-router-r1`, authored at `packetBaseSha`
> `48d79e2b13e258fc82ad55723875f15d6e162872`, authorizes only one independent P1.R2
> semantic/auth/error/cursor/kernel-size review after integration. Its review authority is the
> intentionally unresolved `postIntegrationAuthoritySha`: the exact commit the broker returns and
> pushes after this router is accepted and policy-integrated. The unchanged exact 32 product inputs
> are separately bound to reviewed product snapshot
> `666042037a9c91df572b1d8274bf6024f8d00f40`.
> The reviewer uses `gpt-5.6-sol`, `xhigh`, and `serviceTier: "default"`; Fast is not authorized.
> This seven-path router launches nothing and ends `HOLD`. Reviewer dependencies are
> broker-materialized offline; the reviewer must not install dependencies.

Phase 0 and accepted Phase 1 history remain frozen. PR #252's conflict gate and P1.1D are complete
and accepted. Their accepted true merge is the reviewed product snapshot
`666042037a9c91df572b1d8274bf6024f8d00f40`, with ordered parents
`c3135d40c6e70e4b2ddc905dc815407397197634` and
`3b48f9391b4bff1d82bc85ef01a2d5e0e5b50e95`. The router remediation is authored only at
`packetBaseSha` `48d79e2b13e258fc82ad55723875f15d6e162872`; that SHA is not future review
authority. After integration and push, root must resolve `postIntegrationAuthoritySha` from the exact
commit returned and pushed by the broker, prove the resulting worktree clean, and capture immutable
authority evidence showing exact equality with the sole result of
`git ls-remote origin refs/heads/refactor/hosted-web-feature-boundaries`. An upstream-tracking ref is
not evidence. The old
[`pr252-base-conflict-resolution.md`](phase-01/lanes/pr252-base-conflict-resolution.md) packet is
immutable history, not current execution authority.

Root is the sole orchestrator. `controller-v17` remains in `HOLD` and observation-only; it may not
launch, admit, integrate, restart, replace itself, or create a successor controller. The only current
executable node is `P1.R2`, represented by
[`p1-r2-review.md`](phase-01/lanes/p1-r2-review.md), and it becomes startable only after this exact
router is accepted, policy-integrated, and pushed. Root launches it with
`codex_goal_project_refill_worker`, not `prepare_verifier`, from
`origin/refactor/hosted-web-feature-boundaries`, with `reviewKind: review`, `inputPatchHash: null`,
and every source/worktree/contract authority binding set to the resolved
`postIntegrationAuthoritySha`.

## Deterministic reading order

1. `AGENTS.md`
2. This file
3. `docs/hosted-web-phases/EVIDENCE_LIFECYCLE.md`
4. `docs/hosted-web-phases/README.md`
5. `docs/hosted-web-phases/EXECUTION_INDEX.json`
6. `docs/hosted-web-phases/phase-01/controller-packet.md`
7. `docs/hosted-web-phases/phase-01/lanes/p1-r2-review.md`
8. `CLAUDE.md`
9. `AGENT_CRITICAL_GUARDRAILS.md`
10. `docs/FEATURE_ARCHITECTURE_STANDARD.md`
11. `docs/hosted-web-phases/PACKET_STANDARD.md`
12. `docs/hosted-web-phases/phase-01/README.md`
13. `docs/hosted-web-phases/phase-01/execution-dag.md`
14. Only the additional immutable inputs listed in the P1.R2 lane packet, in its exact order

Do not recursively inspect research, rejected job state, or unrelated product/test paths. The formal
reviewer does not fetch, query GitHub or the network, stage, commit, merge, push, launch an
app/runtime/team, access a real project, or substitute a moving reference for a bound SHA. It validates
the immutable broker/root authority attestation and local canonical `HEAD` only.

## Current review contract

Exactly one fresh independent reviewer may review the unchanged shared hosted kernel and the
team-lifecycle list contract/use case from the reviewed product snapshot. Its only writable paths
are:

1. `.codex-handoff/phase-01-p1-r2.json`
2. `docs/research/hosted-web/phase-1/reviews/list-semantics.md`

Evidence ID is `P1.R2.SEMANTIC_REVIEW`. The exact focused command is:

```bash
pnpm exec vitest run test/architecture/hosted-web/phase-1/contracts test/features/team-lifecycle
```

The reviewer must also classify the frozen current typecheck baseline at exactly seven inherited,
zero owned, and zero unexpected diagnostics; prove Prettier, diff, exact two-path ownership, and
secret/provider/private-path scans; and return explicit `ACCEPT` or `REJECT` with P0/P1/P2 counts.
Only `ACCEPT` with P0/P1/P2 `0/0/0` is acceptable evidence.

The reviewer worktree `expectedSourceCommit` and `HEAD` must remain equal to the resolved
`postIntegrationAuthoritySha`. Its handoff `baseSha`, `canonicalSha`, `planBundleCommit`,
`phaseStartSha`, and `headSha` must all equal that same authority SHA, while
`reviewedProductSnapshotSha` must separately equal
`666042037a9c91df572b1d8274bf6024f8d00f40`. All 32 listed review inputs must be byte-identical
between the post-integration authority `HEAD` and that reviewed product snapshot. Missing or invalid
immutable authority attestation, authority checkout/admission failure, or required environment/network
failure is a runtime incident that ends `HOLD`, not a semantic `REJECT`.

Review completion requires both a strict terminal result and broker-captured immutable output that
binds the bytes and hashes of the exact two result paths. `changedFiles`, heartbeat, PID, tmux, or
`providerObserved` state is observation only and cannot complete the review. Semantic, content, or
review-gate findings produce `REJECT`. Admission,
provider, environment, or no-strict-result failures are runtime incidents that produce `HOLD`, never
a synthetic `REJECT`; no duplicate may run concurrently, and root may authorize at most one exact
corrected attempt only after proving the prior attempt terminal or proving that no runner exists.

On strict `ACCEPT` with P0/P1/P2 `0/0/0`, root mechanically verifies the terminal result, immutable
output, and both bound result paths; invokes `mark_reviewed`; and directs the broker to integrate and
push exactly the handoff and Markdown result paths. P1.I, P1.F, Phase 2+, and every product worker
remain blocked.
Only a later separately reviewed docs router may authorize P1.I; that router consumes the already
integrated evidence and must never integrate either P1.R2 evidence path again. No successor
controller is authorized. End `HOLD`.

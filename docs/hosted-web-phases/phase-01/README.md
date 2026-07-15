# Hosted Web Phase 1

Current authority is `phase-01-p1-r2-router-r1`; terminal state is `HOLD`. Accepted Phase 0 and
Phase 1 history remains frozen.

## Accepted canonical state

Canonical, base, phase start, and `HEAD` are
`666042037a9c91df572b1d8274bf6024f8d00f40`, clean and remote-equal. It is the accepted true
two-parent PR #252 merge with ordered parents
`[c3135d40c6e70e4b2ddc905dc815407397197634,
3b48f9391b4bff1d82bc85ef01a2d5e0e5b50e95]`.

The PR #252 conflict gate and P1.1D are complete and accepted. The old
[`pr252-base-conflict-resolution.md`](lanes/pr252-base-conflict-resolution.md) packet is preserved
unchanged as historical provenance and has no current launch or integration authority.

## Current P1.R2 node

The only executable node is the formal review in [`p1-r2-review.md`](lanes/p1-r2-review.md). After
this seven-path router is accepted, policy-integrated, and pushed, root may authorize exactly one
fresh independent reviewer with:

- model `gpt-5.6-sol`;
- reasoning effort `xhigh`;
- `serviceTier: "default"`; and
- no Fast mode.

The broker materializes all dependencies offline before admission. The reviewer must not install,
update, or fetch dependencies.

Root is the sole orchestrator. `controller-v17` remains `HOLD` and observation-only. It cannot
launch, admit, integrate, restart, replace itself, or create a successor controller. This router
launches nothing.

The reviewer writes only `.codex-handoff/phase-01-p1-r2.json` and
`docs/research/hosted-web/phase-1/reviews/list-semantics.md`. Evidence is
`P1.R2.SEMANTIC_REVIEW`. The exact focused command is:

```bash
pnpm exec vitest run test/architecture/hosted-web/phase-1/contracts test/features/team-lifecycle
```

The result must independently cover list semantics, strict authorization context, safe error
normalization, opaque revisions/cursors, deterministic ordering, shared-kernel size, the 1,000-item
bound, and the trusted-array/additive-response remediation. Additional required gates are the exact
current typecheck baseline with zero owned and zero unexpected diagnostics, Prettier, diff, exact
two-path ownership, and classified secret/provider/private-path scans.

Only explicit `ACCEPT` with P0/P1/P2 `0/0/0` is acceptable. Semantic, content, or review-gate
findings produce `REJECT`. Admission, provider, environment, or no-strict-result failures are runtime
incidents and produce `HOLD`, not a synthetic disposition. No concurrent duplicate is allowed, and
root may authorize at most one exact corrected attempt after proving the prior attempt terminal or
proving no runner exists. Review completion requires a strict terminal result plus broker-captured
immutable output binding the exact two result paths; `changedFiles`, heartbeat, PID, tmux, and
`providerObserved` are insufficient.
The authoritative dependency projection is [`execution-dag.md`](execution-dag.md).

On strict `ACCEPT` with P0/P1/P2 `0/0/0`, root mechanically verifies the result, immutable output,
and bound evidence bytes; invokes `mark_reviewed`; and has the broker integrate and push exactly
`.codex-handoff/phase-01-p1-r2.json` and
`docs/research/hosted-web/phase-1/reviews/list-semantics.md`. P1.I, P1.F, Phase 2+, and all product
workers remain blocked. Only a later separately reviewed docs router may authorize P1.I; it consumes
the already integrated evidence and never integrates either evidence path. This transition does not
authorize a successor controller or later work. End `HOLD`.

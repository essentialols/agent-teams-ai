# Hosted Web execution router

> Current route: `phase-01-p1-r2-router-r1`, authored at `packetBaseSha`
> `48d79e2b13e258fc82ad55723875f15d6e162872`, conditionally authorizes exactly one independent
> P1.R2 semantic/auth/error/cursor/kernel-size reviewer after the broker returns and pushes the exact
> `postIntegrationAuthoritySha`. The profile is `gpt-5.6-sol`, `xhigh`,
> `serviceTier: "default"`; Fast is not authorized. This docs transition launches nothing and ends
> `HOLD`. Dependencies are broker-materialized offline; the reviewer may not install them.

Always begin with [`START_HERE.md`](START_HERE.md). Machine-readable authority is
[`EXECUTION_INDEX.json`](EXECUTION_INDEX.json). The current
[`controller-packet.md`](phase-01/controller-packet.md) and
[`p1-r2-review.md`](phase-01/lanes/p1-r2-review.md) are the only executable packets.

## Authority and reviewed product state

`packetBaseSha` `48d79e2b13e258fc82ad55723875f15d6e162872` is only the base where this
seven-path router remediation is authored. `postIntegrationAuthoritySha` is intentionally unknown in
this packet and must never be hardcoded to that base or a guessed SHA. After policy integration and
push, root resolves it from the exact commit returned and pushed by the broker. Before reviewer start,
root must prove the resulting worktree clean and capture an immutable attestation that the resolved SHA
is the sole result of `git ls-remote origin refs/heads/refactor/hosted-web-feature-boundaries`; no
upstream-tracking assumption is accepted.

The unchanged exact 32 product inputs are bound separately to `reviewedProductSnapshotSha`
`666042037a9c91df572b1d8274bf6024f8d00f40`. That snapshot is the accepted true two-parent PR #252
merge with ordered parents:

1. `c3135d40c6e70e4b2ddc905dc815407397197634`
2. `3b48f9391b4bff1d82bc85ef01a2d5e0e5b50e95`

The PR #252 conflict gate and P1.1D are complete and accepted. The prior
[`pr252-base-conflict-resolution.md`](phase-01/lanes/pr252-base-conflict-resolution.md) lane remains
byte-for-byte frozen as history. It is not a current node, successor, or implementation source.

## Orchestration boundary

Root remains the sole orchestrator. `controller-v17` is retained only in `HOLD`, observation-only
mode. Controller replacement, restart, launch, admission, integration, and successor-controller
creation are not authorized.

After this exact seven-path router is independently accepted, policy-integrated, and pushed, root may
start exactly one fresh independent P1.R2 reviewer. The router author starts no reviewer and performs
no lifecycle action. Admission uses `codex_goal_project_refill_worker`, never `prepare_verifier`, with
`workerRole: reviewer`, `reviewKind: review`, `inputPatchHash: null`, source
`origin/refactor/hosted-web-feature-boundaries`, and `expectedSourceCommit`, worktree `HEAD`, and all
canonical/base/phase-start contract fields bound to `postIntegrationAuthoritySha`.

## Authorized review

The reviewer is read-only except for exactly:

1. `.codex-handoff/phase-01-p1-r2.json`
2. `docs/research/hosted-web/phase-1/reviews/list-semantics.md`

The sole evidence ID is `P1.R2.SEMANTIC_REVIEW`. The review independently checks:

- team-lifecycle list semantics and all ten immutable outcomes;
- strict request identity, authorization-scope, deadline, and cancellation handling without
  production-auth claims;
- safe error normalization and absence of raw/provider/private values;
- opaque revision/cursor behavior and deterministic ordering;
- the accepted five-family shared-kernel boundary and the bounded 1,000-item parser; and
- P1.1D's trusted-array, additive-response, public-entrypoint, and transport-neutral invariants.

The reviewer worktree `expectedSourceCommit` and `HEAD`, plus handoff `baseSha`, `canonicalSha`,
`planBundleCommit`, `phaseStartSha`, and `headSha`, must all equal the resolved
`postIntegrationAuthoritySha`.
The handoff also records `reviewedProductSnapshotSha`
`666042037a9c91df572b1d8274bf6024f8d00f40`, and the exact 32 product inputs must be byte-identical
at the reviewed snapshot and post-integration authority commits. The reviewer has no GitHub or network
authority; it verifies the immutable broker/root authority attestation and local canonical `HEAD`.

The exact focused command is:

```bash
pnpm exec vitest run test/architecture/hosted-web/phase-1/contracts test/features/team-lifecycle
```

Acceptance additionally requires the current typecheck baseline at seven inherited, zero owned, and
zero unexpected diagnostics; green Prettier and diff checks; exact two-path output scope; classified
secret/provider/private-path scans; and explicit `ACCEPT` with P0/P1/P2 `0/0/0`. Otherwise the result
is `REJECT` only for a semantic, content, or review-gate finding.

Admission, provider, environment, and no-strict-result failures are runtime incidents and end
`HOLD`; they are not adverse review findings. There may be no concurrent duplicate. After root has
proved the affected attempt terminal or proved no runner exists, root may authorize at most one
exact corrected attempt with the same inputs, profile, commands, and two-path authority. A strict
terminal result and broker-captured immutable output binding both exact result paths are required for
completion; `changedFiles`, heartbeat, PID, tmux, and `providerObserved` are insufficient.
Missing or invalid authority attestation, source checkout failure, and root's remote-query/network
failure are admission/environment incidents under this rule, never semantic `REJECT` findings.

For strict `ACCEPT` with P0/P1/P2 `0/0/0`, root mechanically verifies the result, immutable output,
and bound evidence bytes; invokes `mark_reviewed`; and has the broker integrate and push exactly
those two evidence paths. P1.I, P1.F, Phase 2+, and product workers remain blocked. Only a later
separately reviewed docs router may authorize P1.I, and it must never reintegrate either already
integrated evidence path. This router authorizes no successor controller or later node. End `HOLD`.

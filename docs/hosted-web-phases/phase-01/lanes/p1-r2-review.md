# P1.R2 list semantics formal review lane

## Authority and provenance

- Project: `agent-teams-hosted-web-refactor`
- Phase/node: `phase-01` / `P1.R2`
- Lane ID: `p1-r2`
- Packet revision: `phase-01-p1-r2-review-r1`
- Router revision: `phase-01-p1-r2-router-r1`
- Evidence ID: `P1.R2.SEMANTIC_REVIEW`
- Canonical/base/phase start/`HEAD`:
  `666042037a9c91df572b1d8274bf6024f8d00f40`
- Canonical state: clean and remote-equal
- Accepted true-merge parents, in order:
  1. `c3135d40c6e70e4b2ddc905dc815407397197634`
  2. `3b48f9391b4bff1d82bc85ef01a2d5e0e5b50e95`
- Accepted predecessors: PR #252 conflict gate and P1.1D, both complete and accepted
- Capacity: exactly one fresh independent reviewer
- Reviewer profile: `gpt-5.6-sol`, `xhigh`, `serviceTier: "default"`; Fast is not authorized
- Dependencies: broker-materialized offline before admission; worker installation is forbidden
- Terminal result: explicit `ACCEPT` or `REJECT`, then `HOLD`

This lane becomes executable only after the exact seven-path router containing it receives
independent acceptance, is policy-integrated, and is pushed. Root is the sole orchestrator and may
then start this one reviewer. The router author starts none.

`controller-v17` remains `HOLD` and observation-only. It has no launch, admission, integration,
restart, replacement, or successor-controller authority. No successor controller exists or is
authorized by this packet.

## Independence gate

The reviewer identity, controller job, and worktree must be distinct from:

1. this P1.R2 router author;
2. every P1.1A or P1.1D producer, remediation worker, and reviewer;
3. every PR #252 conflict-resolution producer and reviewer; and
4. every prior Phase 1 formal reviewer.

The reviewer records its own identity, job, worktree, model, effort, service tier, and all four
exclusions in both outputs. Reuse, overlap, a second reviewer, non-default service tier, Fast mode,
or inability to prove independence is an admission runtime incident and requires `HOLD` without a
review disposition; substitution is not authorized. No concurrent duplicate may be started.

## Mission

Independently review the exact canonical shared hosted kernel and P1.1D team-lifecycle list surface.
Return one formal determination of whether list semantics, authorization context, safe errors,
revisions/cursors, deterministic bounded parsing, kernel size, and public boundaries match accepted
Phase 1 policy at the canonical merge.

This is a review, not a producer, repair, integration, or production-readiness pass. Do not modify a
canonical input or fix a finding. Do not add transport, filesystem, runtime, IPC, HTTP, preload,
renderer, production auth, provider, route, composition, dependency, or product behavior. Do not run
an app, runtime, team, server, provider check, browser check, filesystem integration, or real
project. Dependencies are already broker-materialized offline; do not install, fetch, update, or
repair them.

## Exact mandatory reads

Read in this order. Directory reads, globs, implicit siblings, and recursive research reads are not
authorized:

1. `AGENTS.md`
2. `docs/hosted-web-phases/START_HERE.md`
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
14. `docs/hosted-web-phases/phase-01/architecture-and-contracts.md`
15. `docs/hosted-web-phases/phase-01/lanes/p1-s1-foundations.md`
16. `docs/hosted-web-phases/phase-01/lanes/p1-1d-team-lifecycle-read.md`
17. `docs/hosted-web-phases/phase-01/lanes/p1-1d-additive-response-remediation.md`
18. the exact 32 canonical review inputs below, in listed order

The historical PR #252 lane remains frozen and is not a current review input. The two result paths
are new outputs, not inputs. Do not inspect other research or rejected artifacts.

## Exact 32-path canonical review input

P1.1A contributes exactly these 12 paths:

1. `.codex-handoff/phase-01-p1-1a.json`
2. `src/shared/contracts/hosted/app-error.ts`
3. `src/shared/contracts/hosted/identifiers.ts`
4. `src/shared/contracts/hosted/index.ts`
5. `src/shared/contracts/hosted/query-context.ts`
6. `src/shared/contracts/hosted/revision.ts`
7. `test/architecture/hosted-web/phase-1/contracts/app-error.test.ts`
8. `test/architecture/hosted-web/phase-1/contracts/fixtures/invalid-contract-values.json`
9. `test/architecture/hosted-web/phase-1/contracts/fixtures/valid-contract-values.json`
10. `test/architecture/hosted-web/phase-1/contracts/identifiers.test.ts`
11. `test/architecture/hosted-web/phase-1/contracts/query-context.test.ts`
12. `test/architecture/hosted-web/phase-1/contracts/revision.test.ts`

P1.1D contributes exactly these 9 paths:

1. `.codex-handoff/phase-01-p1-1d.json`
2. `src/features/team-lifecycle/contracts/team-lifecycle-read.ts`
3. `src/features/team-lifecycle/contracts/index.ts`
4. `src/features/team-lifecycle/core/application/ListTeamLifecycle.ts`
5. `src/features/team-lifecycle/core/application/index.ts`
6. `src/features/team-lifecycle/index.ts`
7. `test/features/team-lifecycle/core/ListTeamLifecycle.test.ts`
8. `test/architecture/hosted-web/phase-1/team-lifecycle/team-lifecycle-read-contract.test.ts`
9. `test/architecture/hosted-web/phase-1/team-lifecycle/team-lifecycle-read-boundaries.test.ts`

The immutable semantic corpus contributes exactly these 11 paths:

1. `test/fixtures/hosted-web/phase-1/team-lifecycle/manifest.json`
2. `test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/corrupt.json`
3. `test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/draft.json`
4. `test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/empty.json`
5. `test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/not-found-inapplicable.json`
6. `test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/partial.json`
7. `test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/provisioning-inapplicable.json`
8. `test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/stale.json`
9. `test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/success.json`
10. `test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/unavailable.json`
11. `test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/unexpected.json`

The 12 + 9 + 11 sets are disjoint and total exactly 32 paths. Every byte is read-only and bound to
canonical `666042037a9c91df572b1d8274bf6024f8d00f40`. A missing, additional, overlapping, or
modified canonical input requires `REJECT`.

## Exact exclusive reviewer writer authority

The reviewer may create and write exactly these two paths, in this order:

1. `.codex-handoff/phase-01-p1-r2.json`
2. `docs/research/hosted-web/phase-1/reviews/list-semantics.md`

Everything else is read-only. The reviewer may create a missing parent directory only when required
for one of these paths and may create no sibling. Any other changed, untracked, staged, generated,
formatted, or temporary repository path is `REJECT`, not repair or cleanup authority.

## Semantic, authorization, error, cursor, and bound review

The reviewer must independently prove all of the following:

1. Request parsing accepts only the exact versioned top-level and nested query-context fields,
   including own string and symbol behavior, and validates actor/session/deployment/boot/request IDs,
   `authorizedScope`, deadline, and cancellation without reading ambient or production auth state.
2. The use case invokes its injected value-only source exactly once for each valid request and zero
   times for an invalid request. It has no filesystem, adapter, transport, runtime, provider, or
   production mount.
3. Same-version success, failure, and inapplicable responses validate every known field before
   discarding additive own string/symbol fields and return fresh frozen known-field-only projections.
4. The success parser captures and bounds the untrusted `items` length at 1,000, rejects sparse or
   duplicate-ID input, reads each dense index exactly once, parses each element, uses a fresh plain
   array, and never dispatches an input-owned map, iterator, constructor, or species behavior.
5. All ten manifest scenarios retain their accepted success/failure/inapplicable outcome,
   deterministic ordering, revision/cursor values, safe fields, retryability, and empty-versus-error
   distinction. The deliberate semantic mismatch still rejects with
   `phase1-semantic-outcome-drift`.
6. Safe errors remain limited to the accepted application categories and bounded fields. Unsupported
   versions, malformed known fields, source throws, and invalid source responses fail closed without
   raw messages, stacks, auth/provider payloads, command bodies, or private paths.
7. Revisions and cursors remain opaque, kind-separated tokens. The contract never parses, increments,
   sorts, derives, or uses them as display/cache keys, and never silently converts an invalid cursor
   to page one. Production cursor integrity/scope/snapshot binding remains explicitly unverified
   because Phase 1 has no production adapter.
8. Public entrypoints expose only the narrow team-lifecycle contract and use case. They do not expose
   a legacy aggregate, universal envelope, transport status, route/capability metadata, provider
   value, filesystem/path value, production identity, or implementation folder.
9. The shared kernel remains exactly five product files and five primitive families: opaque IDs,
   query/authorization context, revision/cursor, safe application errors, and the public entrypoint.
   The five files remain exactly 159 lines and 7,242 bytes at canonical; the accepted P1.1A handoff
   remains 299 gross owned lines. No sixth primitive family or unproved export is accepted.
10. `P1.NEG.SCHEMA_VERSION` still fails with
    `phase1-schema-version-invalid-or-unsupported`, and its valid same-version neighbors pass. No
    production auth, transport parity, adapter integrity, filesystem/runtime integration, production
    mount, or full Phase 1 completion is claimed.

## Exact focused command

Run exactly this one focused test command from the canonical review worktree:

```bash
pnpm exec vitest run test/architecture/hosted-web/phase-1/contracts test/features/team-lifecycle
```

It must exit 0 with exactly 5 test files and 14/14 tests passing. Do not split, widen, replace, or add
another test command.

## Frozen typecheck baseline

Run `pnpm typecheck`. It may exit 1 only for these exact seven inherited diagnostics:

- `test/architecture/hosted-web/phase-0/auth-artifacts/auth-artifacts-spike.test.ts`: TS7016 at
  25:8; TS7031 at 66:31; TS18046 at 117:68; TS7031 at 413:48; TS7031 at 733:10;
- `test/architecture/hosted-web/phase-0/host-primitives/evidence-scanner.test.ts`: TS7016 at 12:8;
  and
- `test/architecture/hosted-web/phase-0/provider-runtime/scan-runtime-surfaces.test.ts`: TS2352 at
  162:44.

Acceptance requires exactly `7 inherited / 0 owned / 0 unexpected`. A new, removed, moved, or
changed inherited diagnostic, or any diagnostic in either reviewer output or a canonical P1 input,
requires `REJECT`.

## Prettier, diff, and exact two-path scope

Run this exact Prettier check after both outputs are complete:

```bash
pnpm exec prettier --check \
  .codex-handoff/phase-01-p1-1a.json \
  src/shared/contracts/hosted/app-error.ts \
  src/shared/contracts/hosted/identifiers.ts \
  src/shared/contracts/hosted/index.ts \
  src/shared/contracts/hosted/query-context.ts \
  src/shared/contracts/hosted/revision.ts \
  test/architecture/hosted-web/phase-1/contracts/app-error.test.ts \
  test/architecture/hosted-web/phase-1/contracts/fixtures/invalid-contract-values.json \
  test/architecture/hosted-web/phase-1/contracts/fixtures/valid-contract-values.json \
  test/architecture/hosted-web/phase-1/contracts/identifiers.test.ts \
  test/architecture/hosted-web/phase-1/contracts/query-context.test.ts \
  test/architecture/hosted-web/phase-1/contracts/revision.test.ts \
  .codex-handoff/phase-01-p1-1d.json \
  src/features/team-lifecycle/contracts/team-lifecycle-read.ts \
  src/features/team-lifecycle/contracts/index.ts \
  src/features/team-lifecycle/core/application/ListTeamLifecycle.ts \
  src/features/team-lifecycle/core/application/index.ts \
  src/features/team-lifecycle/index.ts \
  test/features/team-lifecycle/core/ListTeamLifecycle.test.ts \
  test/architecture/hosted-web/phase-1/team-lifecycle/team-lifecycle-read-contract.test.ts \
  test/architecture/hosted-web/phase-1/team-lifecycle/team-lifecycle-read-boundaries.test.ts \
  test/fixtures/hosted-web/phase-1/team-lifecycle/manifest.json \
  test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/corrupt.json \
  test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/draft.json \
  test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/empty.json \
  test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/not-found-inapplicable.json \
  test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/partial.json \
  test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/provisioning-inapplicable.json \
  test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/stale.json \
  test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/success.json \
  test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/unavailable.json \
  test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/unexpected.json \
  .codex-handoff/phase-01-p1-r2.json \
  docs/research/hosted-web/phase-1/reviews/list-semantics.md
git diff --check
git diff --cached --quiet
git diff --exit-code
git status --short
```

Prettier and all three diff commands must be green. After both outputs exist, status must resolve to
exactly the two untracked writable paths above, in lexical Git status order, with no staged path.
Prove `HEAD`, base, and phase start remain canonical and the ordered merge parents remain exact.

## Secret, provider, and private-path scans

Scan all 32 canonical inputs and both outputs. Use one exact path array so no untracked output or
canonical input is missed:

```bash
review_scan_paths=(
  .codex-handoff/phase-01-p1-1a.json
  src/shared/contracts/hosted/app-error.ts
  src/shared/contracts/hosted/identifiers.ts
  src/shared/contracts/hosted/index.ts
  src/shared/contracts/hosted/query-context.ts
  src/shared/contracts/hosted/revision.ts
  test/architecture/hosted-web/phase-1/contracts/app-error.test.ts
  test/architecture/hosted-web/phase-1/contracts/fixtures/invalid-contract-values.json
  test/architecture/hosted-web/phase-1/contracts/fixtures/valid-contract-values.json
  test/architecture/hosted-web/phase-1/contracts/identifiers.test.ts
  test/architecture/hosted-web/phase-1/contracts/query-context.test.ts
  test/architecture/hosted-web/phase-1/contracts/revision.test.ts
  .codex-handoff/phase-01-p1-1d.json
  src/features/team-lifecycle/contracts/team-lifecycle-read.ts
  src/features/team-lifecycle/contracts/index.ts
  src/features/team-lifecycle/core/application/ListTeamLifecycle.ts
  src/features/team-lifecycle/core/application/index.ts
  src/features/team-lifecycle/index.ts
  test/features/team-lifecycle/core/ListTeamLifecycle.test.ts
  test/architecture/hosted-web/phase-1/team-lifecycle/team-lifecycle-read-contract.test.ts
  test/architecture/hosted-web/phase-1/team-lifecycle/team-lifecycle-read-boundaries.test.ts
  test/fixtures/hosted-web/phase-1/team-lifecycle/manifest.json
  test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/corrupt.json
  test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/draft.json
  test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/empty.json
  test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/not-found-inapplicable.json
  test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/partial.json
  test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/provisioning-inapplicable.json
  test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/stale.json
  test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/success.json
  test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/unavailable.json
  test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/unexpected.json
  .codex-handoff/phase-01-p1-r2.json
  docs/research/hosted-web/phase-1/reviews/list-semantics.md
)
rg -n -i '(api[_-]?key|access[_-]?token|refresh[_-]?token|client[_-]?secret|password|bearer)' "${review_scan_paths[@]}"
rg -n -i '(provider|anthropic|claude|openai|opencode|gpt-[0-9])' "${review_scan_paths[@]}"
rg -n '(/Users/|/home/|/root/|~/|[A-Za-z]:\\Users\\|real[-_ ]project)' "${review_scan_paths[@]}"
```

Record every command and exit code and manually classify every lexical match. Expected test terms,
safe error-category words, and reviewer launch metadata are not secret/provider payloads. Any real
credential, secret, auth/provider payload, raw provider value, private user path, or real-project path
requires `REJECT`. A zero-match claim without all 34 paths is invalid.

## Disposition and evidence contract

Write `docs/research/hosted-web/phase-1/reviews/list-semantics.md` as the canonical review result. It
must contain:

1. exactly one formal `Disposition: ACCEPT` or `Disposition: REJECT`;
2. reviewer identity/job/worktree/profile and complete independence proof;
3. canonical/base/start/`HEAD`, clean/remote-equal state, and exact ordered-parent provenance;
4. exact 12 + 9 + 11 = 32 canonical input accounting and exact two-path output accounting;
5. findings for every semantic/auth/error/cursor/kernel-size requirement above;
6. the focused command, exact exit code, and observed file/test counts;
7. the complete seven-diagnostic typecheck classification with zero owned/unexpected;
8. Prettier, diff, status, secret/provider/private-path commands, exit codes, and match
   classifications;
9. explicit P0/P1/P2 findings or zero counts for each; and
10. an explicit statement that P1.I, P1.F, Phase 2+, product workers, integration, production auth,
    adapters, mounts, and successor controllers remain blocked or unverified as applicable.

Write `.codex-handoff/phase-01-p1-r2.json` following `PACKET_STANDARD.md`. It must include:

1. `schemaVersion: 1`, `phaseId: "phase-01"`, `laneId: "p1-r2"`, and packet revision
   `phase-01-p1-r2-review-r1`;
2. canonical `baseSha`, `canonicalSha`, `planBundleCommit`, `phaseStartSha`, and `headSha`, all
   `666042037a9c91df572b1d8274bf6024f8d00f40`;
3. status `verified` when the formal review completes with all required observations, whether its
   disposition is `ACCEPT` or `REJECT`; use `failed` only when the review contract cannot complete;
4. exactly one evidence row for `P1.R2.SEMANTIC_REVIEW`, result path
   `docs/research/hosted-web/phase-1/reviews/list-semantics.md`, and proof level
   `target_verified` when the exact canonical target and required commands were fully observed;
   otherwise record `unverified` without inventing proof;
5. `changedPaths` containing exactly the handoff path and result path, in writer-authority order;
6. every check command, exit code, observed count, typecheck classification, scan classification,
   scope proof, and result-file SHA-256;
7. explicit disposition and P0/P1/P2 findings/counts consistent with the Markdown result;
8. unverified claims and blocked successors exactly as required above; and
9. `nextAction: "controller-hold"` and `terminalState: "HOLD"`.

`ACCEPT` is legal only when every gate passes and P0/P1/P2 are `0/0/0`. There is no conditional
acceptance and no repair authority. A semantic, content, or review-gate finding—including incomplete
or ambiguous evidence content or scope/provenance drift—returns `REJECT` with the finding. Admission,
provider, or environment failure, including an unavailable required command, is a runtime incident
that returns no review disposition and ends `HOLD`. Absence of a strict terminal result is likewise
a runtime incident, not evidence and not a synthetic `REJECT`.

## Strict completion and attempt lifecycle

Root may declare this review complete only when the same admitted attempt has both:

1. a strict terminal result carrying the formal `ACCEPT` or `REJECT`, and
2. broker-captured immutable output binding both exact result paths, whose bytes and hashes match
   that terminal result.

`changedFiles`, heartbeat, PID, tmux, and `providerObserved` state are insufficient individually and
together. They never establish termination, disposition, or immutable evidence.

There is no concurrent duplicate, refill, or attempt after a semantic, content, or gate `REJECT`.
For an admission, provider, environment, or no-strict-result runtime incident, root may authorize at
most one exact corrected attempt. Before doing so, root must prove the affected attempt terminal or
prove no runner exists. The corrected attempt must preserve the exact assignment, canonical SHA,
32 inputs, two output paths, `gpt-5.6-sol` model, `xhigh` effort, default service tier, no-Fast rule,
commands, and independence requirements.

## Accepted-result integration boundary

For strict `ACCEPT` with P0/P1/P2 `0/0/0`, root mechanically verifies the strict result, immutable
output, bound evidence bytes and hashes, exact commands, findings, and two-path scope. Root then
invokes `mark_reviewed` and directs the broker to integrate and push exactly, and only:

1. `.codex-handoff/phase-01-p1-r2.json`
2. `docs/research/hosted-web/phase-1/reviews/list-semantics.md`

The reviewer and root do not stage, commit, integrate, or push. Broker integration adopts the
evidence but authorizes no successor. P1.I, P1.F, Phase 2+, and product workers remain blocked. Only
a later separately reviewed docs router may authorize P1.I; it reads the already integrated
evidence and must never integrate either P1.R2 evidence path again.

## Stop and HOLD

When a properly admitted reviewer reaches a strict terminal result, router, canonical,
clean/remote-equality, ordered-parent, accepted-predecessor, input/output scope, semantic,
authorization, error, cursor, kernel-size, test-count, typecheck, Prettier, diff, scan, or evidence
content drift is a review-gate finding: record `REJECT` and stop `HOLD`. Do not repair or retry.

Reviewer admission/count/independence/profile failure, provider failure, environment failure, or no
strict terminal result is a runtime incident: record controller `HOLD` without inventing `REJECT`.
Do not run a concurrent duplicate. At most one exact corrected attempt is possible under the
terminal/no-runner rule above.

Return the strict result, immutable output, and both bound result paths to root when they exist.
After any disposition, P1.I, P1.F, Phase 2+, and product workers remain blocked. Broker integration
of strict accepted evidence follows only the accepted-result boundary above; a later docs router
alone may authorize P1.I and never reintegrates the evidence. This packet authorizes no successor
controller. End `HOLD`.

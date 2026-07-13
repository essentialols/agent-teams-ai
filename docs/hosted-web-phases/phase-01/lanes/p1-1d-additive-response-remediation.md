# P1.1D additive-response remediation lane

## Authority and provenance

- Project: `agent-teams-hosted-web-refactor`
- Phase/node: `phase-01` / `P1.1D-additive-response-remediation`
- Lane ID: `p1-1d-additive-response-remediation`
- Packet revision: `phase-01-p1-1d-additive-response-remediation-r1`
- Canonical remediation base: `1b37afb02bec25a1f08432d733595b553101ecab`
- Superseded worker-start revision: `phase-01-p1-1d-team-lifecycle-read-r1`
- Rejected producer: `agent-teams-hosted-web-refactor-p1-1d-producer-v17-r3`
- Rejected patch SHA-256:
  `a7d5539e68e62b1c64e5cdf663bc784d92d4db03e74a0087e29d9bb3b2faa7ee`
- Rejected disposition: independent formal `REJECT`, one P1 finding
- Handoff path: `.codex-handoff/phase-01-p1-1d.json`
- Evidence IDs:
  - `P1.1D.TEAM_LIFECYCLE_READ_CONTRACT`
  - `P1.1D.TEAM_LIFECYCLE_READ_USE_CASE`
  - `P1.1D.TEAM_LIFECYCLE_SEMANTIC_PROOF`
- Capacity: exactly one future serial producer; no retry, refill, parallel duplicate, integration, or
  later-node capacity

This packet becomes executable only after the exact seven-path router containing it is
policy-integrated after the canonical remediation base and its successor controller reports exactly
`live=true`.

## Binding independent-review finding

The independent watchdog record states verbatim:

> FORMAL REJECT P1 by independent watchdog. Same-version response parsers exact-key reject additive
> fields for success, failure, inapplicable, and nested item values, contrary to phase-01 response
> compatibility policy. Requests remain strict. Preserve immutable output and rejected patch
> a7d5539e68e62b1c64e5cdf663bc784d92d4db03e74a0087e29d9bb3b2faa7ee; do not integrate or modify.
> Authorized next action is one docs-only remediation router from canonical
> 1b37afb02bec25a1f08432d733595b553101ecab.

That record rejects the complete r3 candidate as integration authority. Its useful narrow product and
test work remains a read-only salvage input, not accepted evidence. The original r3 patch, worktree,
handoff, hashes, and review record must remain byte-identical and retain the rejected disposition.

## Mission

Create a fresh candidate in the exact original nine-path scope. Preserve strict request parsing and
every valid P1.1D semantic/architecture behavior. Change the response parsing policy so every
same-version response object validates all known fields first, then returns a fresh known-field-only
projection that discards additive fields at both top-level and nested response boundaries.

The candidate must regenerate its handoff and all hashes and return for a new independent review. It
does not authorize integration, P1.R2, P1.I, P1.F, Phase 2+, a transport, production mount, commit, or
push.

## Exact worker-start identity

The hosting subscription runtime may admit work only when one `worker-start-v1` contract binds all of
these facts together:

```text
projectId: agent-teams-hosted-web-refactor
phaseId: phase-01
laneId: p1-1d-additive-response-remediation
packetRevision: phase-01-p1-1d-additive-response-remediation-r1
baseSha: 1b37afb02bec25a1f08432d733595b553101ecab
controllerPacket: docs/hosted-web-phases/phase-01/controller-packet.md
lanePacket: docs/hosted-web-phases/phase-01/lanes/p1-1d-additive-response-remediation.md
handoffPath: .codex-handoff/phase-01-p1-1d.json
rejectedPatchSha256: a7d5539e68e62b1c64e5cdf663bc784d92d4db03e74a0087e29d9bb3b2faa7ee
rejectedDisposition: REJECT
```

`planBundleCommit` and `phaseStartSha` must both resolve to the exact integrated remediation-router
commit. That commit must descend from `baseSha` and differ from it only on the seven router-owned docs
paths. `sourceWorktree` must be a new isolated worktree at that `phaseStartSha`, never the rejected r3
worktree. The successor controller must report exactly `live=true` before admission.

Every cross-product with the superseded packet, a different base/revision, a stale or altered rejected
artifact, another producer, a reused r3 worktree, or a P1.R2/later contract fails closed with
`packet_conflict` or `packet_stale`.

## Exact mandatory reads

Read in this order. Directory reads, globs, implicit siblings, recursive documentation/research
reads, and the whole master plan are not authorized:

1. `AGENTS.md`
2. `docs/hosted-web-phases/START_HERE.md`
3. `docs/hosted-web-phases/EVIDENCE_LIFECYCLE.md`
4. `docs/hosted-web-phases/README.md`
5. `docs/hosted-web-phases/EXECUTION_INDEX.json`
6. `docs/hosted-web-phases/phase-01/controller-packet.md`
7. `docs/hosted-web-phases/phase-01/lanes/p1-1d-additive-response-remediation.md`
8. `docs/hosted-web-phases/phase-01/lanes/p1-1d-team-lifecycle-read.md`
9. `CLAUDE.md`
10. `AGENT_CRITICAL_GUARDRAILS.md`
11. `src/features/CLAUDE.md`
12. `docs/hosted-web-phases/PACKET_STANDARD.md`
13. `docs/hosted-web-phases/phase-01/execution-dag.md`
14. `docs/hosted-web-phases/phase-01/architecture-and-contracts.md`
15. `docs/FEATURE_ARCHITECTURE_STANDARD.md`
16. only the two headings `Phase 1 work packages: create one contract system, not another mega-API`
    and `Phase 1: single-source contracts and conformance` in
    `docs/hosted-web-e2e-completion-plan.md`
17. `docs/research/hosted-web/phase-1/reviews/routes-ratchets.md`
18. `src/shared/contracts/hosted/index.ts`
19. `src/shared/contracts/hosted/app-error.ts`
20. `src/shared/contracts/hosted/identifiers.ts`
21. `src/shared/contracts/hosted/query-context.ts`
22. `src/shared/contracts/hosted/revision.ts`
23. `src/main/composition/hosted/routing/route-types.ts`
24. `test/architecture/hosted-web/phase-1/conformance/semantic-harness.ts`
25. `test/architecture/hosted-web/phase-1/conformance/semantic-harness.test.ts`
26. `scripts/hosted-web/phase-1/check-feature-dependencies.ts`
27. `test/architecture/hosted-web/phase-1/dependencies/feature-dependencies.test.ts`
28. `test/fixtures/hosted-web/phase-1/team-lifecycle/manifest.json`
29. `test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/corrupt.json`
30. `test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/draft.json`
31. `test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/empty.json`
32. `test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/not-found-inapplicable.json`
33. `test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/partial.json`
34. `test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/provisioning-inapplicable.json`
35. `test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/stale.json`
36. `test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/success.json`
37. `test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/unavailable.json`
38. `test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/unexpected.json`
39. the controller-supplied immutable r3 patch and its formal review record, after independently
    verifying the exact patch SHA-256 and `REJECT` disposition above

All inputs are read-only. The external r3 artifact is not copied into the repository and is not an
evidence-catalog row. A hash or disposition mismatch is `packet_stale`.

## Immutable salvage protocol

1. Begin from the fresh `phaseStartSha`; do not work in or modify the rejected r3 worktree.
2. Verify the rejected patch bytes equal the bound SHA-256 before reading them.
3. Use those bytes only to understand or reproduce useful narrow contract, use-case, entrypoint, and
   test behavior. Do not apply them to an integration branch or claim the rejected patch is accepted.
4. The new worktree may reproduce unchanged useful file content where correct, but every changed path
   belongs to the new remediation candidate and receives fresh provenance.
5. Never reuse the r3 handoff, command results, test counts, per-file hashes, or patch hash as current
   proof. Rerun every command and regenerate `.codex-handoff/phase-01-p1-1d.json` from scratch.
6. Do not delete, move, truncate, supersede, relabel, or update the rejected artifact or review record.

An inability to preserve these boundaries is a stop condition, not permission to integrate or rewrite
r3.

## Exact exclusive writer authority

### Product paths: exactly five

1. `src/features/team-lifecycle/contracts/team-lifecycle-read.ts`
2. `src/features/team-lifecycle/contracts/index.ts`
3. `src/features/team-lifecycle/core/application/ListTeamLifecycle.ts`
4. `src/features/team-lifecycle/core/application/index.ts`
5. `src/features/team-lifecycle/index.ts`

### Test paths: exactly three

1. `test/features/team-lifecycle/core/ListTeamLifecycle.test.ts`
2. `test/architecture/hosted-web/phase-1/team-lifecycle/team-lifecycle-read-contract.test.ts`
3. `test/architecture/hosted-web/phase-1/team-lifecycle/team-lifecycle-read-boundaries.test.ts`

### Handoff paths: exactly one

1. `.codex-handoff/phase-01-p1-1d.json`

The five-product, three-test, and one-handoff sets are mutually disjoint and contain exactly nine
paths. Parent directories may be created, but no other file may be placed in them. Every other
tracked or untracked path is read-only. An extra path is a stop condition, not cleanup authority.

In particular, do not modify the shared kernel, fixtures, semantic harness, dependency scanner,
IPC/HTTP/preload/renderer code, route/catalog/capability sources, filesystem/infrastructure,
composition, package/lock/config, router docs, existing handoffs, research evidence, orchestration,
or the rejected r3 artifact.

## Request contract: strict and unchanged

Request parsing continues to treat input as `unknown` and must:

1. require and validate every declared request field, supported schema version, nested query context,
   cursor, and expected revision;
2. reject every additive own string or symbol field on the top-level request;
3. reject every additive own string or symbol field in the nested query context, even if an accepted
   shared helper currently observes string keys only;
4. reject unsupported versions, malformed/missing known fields, invalid IDs/tokens/context, accessors
   that throw, arrays, null, and non-object inputs with the existing safe structured surface;
5. construct fresh request/context values without retaining unknown input state; and
6. preserve all original request diagnostics and application-call behavior.

No response compatibility rule may be reused to weaken the input boundary.

## Response contract: known-field-first projection

For a supported same-version response, every parser must follow this order:

1. establish the expected response variant and require each declared known field;
2. validate every required and present optional known field, including semantic combinations, IDs,
   revisions/cursors, lifecycle values, safe error fields, retryability, arrays, uniqueness, limits,
   and ordering inputs;
3. fail safely when any known field is missing or invalid, even when additive fields are present;
4. construct a new object or array from the validated known values only;
5. freeze the fresh projection to the same depth required by the original contract; and
6. ignore and discard every other own string or symbol field without mutating the source.

This policy applies independently at all response-object boundaries:

| Boundary                    | Required additive positive                                                                                                       | Required known-field negative                                                                                  |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| top-level success           | same-version success with additive string and symbol own fields accepts; returned success contains known keys only               | missing/invalid revision, items, cursor, kind, or version still rejects when additive fields are present       |
| top-level failure           | same-version failure with additive string and symbol own fields accepts; returned failure contains known keys only               | missing/invalid error, retryability, kind, or version still rejects when additive fields are present           |
| top-level inapplicable      | same-version inapplicable with additive string and symbol own fields accepts and projects only known fields                      | missing/invalid code/reason pair, kind, or version still rejects when additive fields are present              |
| nested success `items[]`    | every otherwise-valid item may carry additive string and symbol own fields; each returned item is a fresh narrow projection      | malformed/missing team ID, display name, lifecycle, or revision still rejects when additive fields are present |
| nested failure safe `error` | an otherwise-valid safe error may carry additive string and symbol own fields; returned error contains only accepted safe fields | malformed/missing code/reason or invalid diagnostic/retry hint still rejects when additive fields are present  |

The parser may create a local known-field safe-error candidate and then reuse the accepted shared
safe-error validator. It may not change the shared parser, duplicate the shared wire shape, spread an
untrusted object, or return any source object/array by reference. Optional known fields are validated
when present and omitted from the fresh projection when absent.

Tests must assert returned own keys/symbols and object identity. An assertion about the unchanged
source alone does not prove projection or discard. Future/unsupported schema versions remain rejected;
additive compatibility applies only to the supported same version.

## Original contract and application deliverables

All requirements from the superseded original packet remain active except its response exact-key
behavior is replaced by the policy above:

- reuse the accepted opaque IDs, query context, revision/cursor, and AppError primitives by import;
- expose only the request, narrow list item/result, parsers, and safe feature-local failure surface;
- exclude paths, commands/runtime bodies, auth/provider payloads, secrets, Electron/renderer values,
  and legacy team/member/task/message/session/provider aggregates;
- keep contracts browser-safe DTO/parser code with no store, orchestration, side effect, environment,
  transport, fixture, or framework dependency;
- keep one injected source port and pure `ListTeamLifecycle` use case, call the source exactly once for
  a valid request, normalize failures, and preserve deterministic ordering and semantics;
- expose only the narrow contracts/application/root entrypoints; and
- keep the only source implementation as a test-owned in-memory value.

No production adapter, test adapter in product, fake browser/server, filesystem adapter, IPC/HTTP
handler/client, preload bridge, renderer hook/UI, route descriptor, or production composition is
permitted.

## Original semantic and negative gates

The owned tests must still prove all ten immutable manifest scenarios:

1. empty success returns an empty list without inventing an error;
2. success, draft, partial, stale, and explicitly inapplicable classifications remain exact;
3. corrupt, unavailable, and unexpected values become the fixture-defined safe failures without raw
   message matching or leaked input;
4. identical values produce identical ordering, cursor/revision treatment, and normalized outcomes;
5. malformed IDs, revisions/cursors, items, states, failures, and semantic combinations fail safely;
6. the test-owned in-memory port is called exactly as required and has no filesystem dependency; and
7. the narrow public feature entrypoint is usable without implementation, legacy aggregate,
   transport, Electron, or `@main` imports.

The manifest and ten outcome fixtures are immutable. Tests do not rewrite or reinterpret their bytes.

| Negative ID                           | Exact diagnostic                      | Required result and positive neighbor                                                                                  |
| ------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `P1.NEG.SEMANTIC_OUTCOME`             | `phase1-semantic-outcome-drift`       | deliberate semantic mismatch rejects; all ten actual parsed/use-case outcomes match the manifest                       |
| `P1.NEG.LEGACY_GOD_DTO`               | `phase1-legacy-god-dto-forbidden`     | owned synthetic legacy aggregate rejects; narrow public DTO/parser surface accepts                                     |
| `P1.NEG.NO_FILESYSTEM_ADAPTER_PHASE1` | `phase1-filesystem-adapter-forbidden` | owned synthetic filesystem/path reader rejects; pure injected port and test-owned in-memory value accept without paths |

The negative strings remain inside the owned boundary test. No diagnostic changes, fixture creation,
weakened inherited scanner, false positive-neighbor claim, or transport/production claim is allowed.

## Architecture and boundary gates

The original architecture requirements remain unchanged:

1. product imports follow `docs/FEATURE_ARCHITECTURE_STANDARD.md` and public-entrypoint rules;
2. contracts import no Electron, Fastify, React, Zustand, Node built-in, `@main`, adapter,
   infrastructure, renderer, preload, test, fixture, or research module;
3. core application imports only its contracts and permitted pure shared contracts;
4. fixture corpus and semantic harness remain test-only and unreachable from product entrypoints;
5. no `main/`, `preload/`, `renderer/`, `adapters/`, `infrastructure/`, route/catalog, app-shell, or
   production-registration path is added; and
6. the complete product surface remains path-free, secret-free, transport-neutral, and browser-safe
   without pretending to implement browser mode.

Electron desktop remains the default real app target, but this packet runs no app or runtime.

## Focused required checks

Run every command independently from the bound worktree. Record its exact exit code, observed file and
test counts, and relevant tool version in the regenerated handoff:

```bash
pnpm exec vitest run test/features/team-lifecycle/core/ListTeamLifecycle.test.ts
pnpm exec vitest run test/architecture/hosted-web/phase-1/team-lifecycle/team-lifecycle-read-contract.test.ts
pnpm exec vitest run test/architecture/hosted-web/phase-1/team-lifecycle/team-lifecycle-read-boundaries.test.ts
pnpm exec vitest run test/architecture/hosted-web/phase-1/conformance/semantic-harness.test.ts test/architecture/hosted-web/phase-1/dependencies/feature-dependencies.test.ts
pnpm lint:fast:files -- src/features/team-lifecycle/contracts/team-lifecycle-read.ts src/features/team-lifecycle/contracts/index.ts src/features/team-lifecycle/core/application/ListTeamLifecycle.ts src/features/team-lifecycle/core/application/index.ts src/features/team-lifecycle/index.ts test/features/team-lifecycle/core/ListTeamLifecycle.test.ts test/architecture/hosted-web/phase-1/team-lifecycle/team-lifecycle-read-contract.test.ts test/architecture/hosted-web/phase-1/team-lifecycle/team-lifecycle-read-boundaries.test.ts
pnpm typecheck
pnpm exec prettier --check src/features/team-lifecycle/contracts/team-lifecycle-read.ts src/features/team-lifecycle/contracts/index.ts src/features/team-lifecycle/core/application/ListTeamLifecycle.ts src/features/team-lifecycle/core/application/index.ts src/features/team-lifecycle/index.ts test/features/team-lifecycle/core/ListTeamLifecycle.test.ts test/architecture/hosted-web/phase-1/team-lifecycle/team-lifecycle-read-contract.test.ts test/architecture/hosted-web/phase-1/team-lifecycle/team-lifecycle-read-boundaries.test.ts .codex-handoff/phase-01-p1-1d.json
git diff --check
git status --short
```

The three owned focused test files and two accepted ratchet files must pass. Lint, Prettier, diff,
ownership, hash, and safety checks must be green. `pnpm typecheck` may exit 1 only for exactly the
seven unchanged inherited Phase 0 diagnostics accepted by P1.R1, in exactly these files:

- `test/architecture/hosted-web/phase-0/auth-artifacts/auth-artifacts-spike.test.ts`
- `test/architecture/hosted-web/phase-0/host-primitives/evidence-scanner.test.ts`
- `test/architecture/hosted-web/phase-0/provider-runtime/scan-runtime-surfaces.test.ts`

Any new, moved, removed, or changed inherited diagnostic, or any owned-path diagnostic, fails. Do not
run an app, browser, Electron, server, IPC/HTTP smoke, real project, provider/runtime, or filesystem
integration check.

## Safety, scope, provenance, and hashes

Before handoff:

1. prove `HEAD`, `baseSha`, `planBundleCommit`, and `phaseStartSha` match this packet and the successor
   controller's live binding;
2. prove `phaseStartSha` differs from `baseSha` on exactly the seven router paths and the worktree diff
   contains exactly the nine owned paths;
3. verify the rejected patch hash/disposition again and prove its artifact/worktree/review bytes were
   not changed by this job;
4. validate the regenerated handoff JSON, evidence IDs, revision, base/start provenance, changed-path
   list, proof levels, original negative matrix, additive-response matrix, commands/counts, unverified
   claims, and `nextAction`;
5. compute SHA-256 for every non-handoff owned path and a deterministic binary/full-index patch hash
   from `phaseStartSha` in exact owned-path order;
6. prove no new hash equals a merely copied r3 handoff assertion without independent recomputation;
7. scan all nine owned paths, including untracked files, for credentials, secrets, auth/provider
   payloads, private, user-directory, or real-project paths, raw command/runtime bodies, and binary
   content; classify every lexical match; and
8. require status to resolve to exactly the nine owned paths with nothing staged.

A secret, private path, binary, raw payload, staging, extra path, rejected-artifact mutation,
provenance mismatch, stale/reused hash, or unclassified workspace change fails the gate. The producer
may not clean, repair, stage, commit, or push outside its contract.

## Evidence and regenerated handoff

The evidence mapping remains:

| Evidence ID                           | Required owned evidence                               | Proof level       |
| ------------------------------------- | ----------------------------------------------------- | ----------------- |
| `P1.1D.TEAM_LIFECYCLE_READ_CONTRACT`  | two contract files plus contract-focused test         | `target_verified` |
| `P1.1D.TEAM_LIFECYCLE_READ_USE_CASE`  | use-case/application/root entrypoints plus core test  | `target_verified` |
| `P1.1D.TEAM_LIFECYCLE_SEMANTIC_PROOF` | two architecture tests and all focused/ratchet checks | `target_verified` |

Write only `.codex-handoff/phase-01-p1-1d.json`, newly generated in this worktree. It must follow
`PACKET_STANDARD.md` and include:

1. `schemaVersion: 1`, `phaseId: "phase-01"`,
   `laneId: "p1-1d-additive-response-remediation"`, and current packet revision;
2. `baseSha: "1b37afb02bec25a1f08432d733595b553101ecab"` plus runtime-bound
   `planBundleCommit` and `phaseStartSha`;
3. the superseded original packet revision, rejected producer/job, exact r3 patch SHA-256, formal
   `REJECT`, quoted finding, immutable-salvage result, and an explicit statement that r3 remains
   unintegrated and unmodified;
4. status `verified` only when every producer gate passes, while explicitly stating independent
   acceptance remains unverified;
5. exactly the three evidence IDs, their exact owned paths, and `target_verified` proof levels;
6. `changedPaths` containing exactly five product, three test, and one handoff paths in packet order;
7. every required command, exact exit code, observed test/file count, and tool version;
8. the original three-row negative matrix plus the five-boundary additive-response matrix and strict
   top-level/nested request negatives;
9. fresh per-file SHA-256 values and deterministic patch SHA-256, with no r3 handoff/hash reuse;
10. ownership, rejected-artifact immutability, lexical/binary safety, and P0/P1/P2 findings;
11. unverified claims for independent acceptance/integration, IPC/HTTP parity/adapters,
    preload/renderer behavior, filesystem/runtime integration, production mount, Phase 1 completion,
    and Phase 2+; and
12. exact `nextAction: "review"`.

The handoff contains no secret, auth/provider payload, raw runtime body, private path, external
artifact body, or fake success claim. Do not create a second handoff/evidence file.

## Independent review and acceptance

Producer verification is not `ACCEPT`. The successor controller's smallest safe next action is to
provision one independent review job only after receiving the complete handoff. The reviewer must be
distinct from this router author and every P1.1D producer, use a separate isolated worktree, inspect
the full nine-path candidate, rerun every exact command, reproduce counts and diagnostics, recompute
all hashes, test every response boundary and request-strictness negative, verify r3 immutability, and
return explicit `ACCEPT` or `REJECT` with P0/P1/P2 findings.

Only independent `ACCEPT` makes the candidate eligible for a separately authorized integration. This
packet does not authorize that integration. `REJECT`, `blocked`, failed, incomplete, or non-independent
review ends this one-shot node with no retry/refill. P1.R2, P1.I, P1.F, and Phase 2+ stay blocked after
producer success, independent `ACCEPT`, and any later remediation integration.

## Explicit stop conditions

Stop changing files and return the smallest `PACKET_STANDARD.md` blocker record when any of these is
true:

- the router is not policy-integrated, the successor controller is not `live=true`, or a runtime fact
  is stale/mixed;
- the base/revision/phase start is wrong, another worker exists, or this one-shot packet was consumed;
- the rejected patch hash/disposition differs, its artifact/worktree/review was changed, or using it
  would revive/integrate rejected evidence;
- an extra/unowned/staged path appears or an accepted input differs;
- request strictness cannot reject top-level and nested own string/symbol fields;
- a response boundary cannot validate known fields first, construct a fresh projection, and discard
  additive own string/symbol fields;
- an invalid/missing known response field passes because additive data exists, or an unsupported
  version is treated as compatible;
- a required original semantic/negative/architecture check fails or its diagnostic changes;
- inherited typecheck diagnostics drift, evidence cannot reach `target_verified`, hashes/provenance
  are inconsistent, or the regenerated handoff reuses r3 proof;
- implementation requires a shared-kernel, fixture, dependency, config, docs, research, orchestration,
  adapter, transport, filesystem, infrastructure, composition, or production path;
- any real project/runtime/provider, production data, credential, private path, raw payload, or binary
  enters the work; or
- review, integration, commit, push, P1.R2, P1.I, P1.F, Phase 2+, or any launch outside the live
  controller's one producer begins.

Use blocker class `packet_conflict`, `packet_stale`, `base_failure`, `environment`, `scope_overlap`,
`security`, `missing_evidence`, or `design_falsified` as applicable. Do not widen scope, weaken a
ratchet, repair an immutable input, silently reinterpret response compatibility, retry/refill, or
continue on another deliverable.

## Completion and HOLD

Producer completion requires exactly nine owned changed paths; all evidence at `target_verified`;
every original and additive-response gate classified; a complete, newly generated handoff; and exact
next action `review`. Return the handoff without staging, committing, pushing, integrating, launching
a reviewer/successor, or starting later work.

The docs-router author likewise ends on `HOLD`. P1.R2, P1.I, P1.F, and Phase 2+ remain blocked. Only a
later independently accepted, separately integrated docs-only router with its own successor controller
`live=true` may advance authority.

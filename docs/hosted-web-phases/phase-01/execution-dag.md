# Phase 1 execution DAG and ownership

Status: P1.S0 and P1.S1 are accepted and integrated. P1.S2 is the sole current producer epoch after
its router-integration and live-controller gate. P1.S3 and later nodes are blocked.

## Current DAG

```text
P1.S0 accepted
  -> P1.S1 / P1.1A accepted + integrated at 041b5c7c2
       -> P1.S2: P1.1B routes + capabilities ----+
       -> P1.S2: P1.1C conformance + ratchets ---+ -X-> P1.S3 / P1.R1
                                                        -> P1.1D
                                                          -> P1.R2
                                                            -> P1.I
                                                              -> P1.F
```

`P1.1B` and `P1.1C` are independent siblings, not dependencies of one another. `-X->` is a blocked
transition: completing both handoffs does not launch P1.R1. The later chain remains exactly
`P1.1B + P1.1C -> P1.R1 -> P1.1D -> P1.R2 -> P1.I -> P1.F` and requires separate router decisions.

## Current lane registry

| Node    | Mission                                                         | Dependency                  | Evidence IDs                          | Packet                       |
| ------- | --------------------------------------------------------------- | --------------------------- | ------------------------------------- | ---------------------------- |
| `P1.1B` | RouteCatalog assertions and separate capability cross-reference | accepted/integrated `P1.1A` | `P1.1B.ROUTES`, `P1.1B.CAPABILITIES`  | `lanes/p1-s2-routes.md`      |
| `P1.1C` | Semantic harness, ADR-19/20 ratchets, synthetic fixture corpus  | accepted/integrated `P1.1A` | `P1.1C.CONFORMANCE`, `P1.1C.RATCHETS` | `lanes/p1-s2-conformance.md` |

Capacity is zero until the router commit is integrated and the successor controller is `live=true`.
Afterward it is exactly one producer per row, two total, running in parallel. No retry or refill is
authorized.

## Exact exclusive writer sets

P1.1B owns exactly:

- `.codex-handoff/phase-01-p1-1b.json`
- `src/main/composition/hosted/routing/RouteCatalog.ts`
- `src/main/composition/hosted/routing/index.ts`
- `src/main/composition/hosted/routing/route-types.ts`
- `test/architecture/hosted-web/phase-1/routes/RouteCatalog.test.ts`
- `test/architecture/hosted-web/phase-1/routes/capability-descriptors.test.ts`
- `test/architecture/hosted-web/phase-1/routes/fixtures/duplicate-route.ts`
- `test/architecture/hosted-web/phase-1/routes/fixtures/missing-reference.ts`
- `test/architecture/hosted-web/phase-1/routes/fixtures/test-only-production-route.ts`

P1.1C owns exactly:

- `.codex-handoff/phase-01-p1-1c.json`
- `scripts/hosted-web/phase-1/check-feature-dependencies.ts`
- `scripts/hosted-web/phase-1/check-parity-references.ts`
- `scripts/hosted-web/phase-1/check-renderer-boundaries.ts`
- `test/architecture/hosted-web/phase-1/conformance/semantic-harness.test.ts`
- `test/architecture/hosted-web/phase-1/conformance/semantic-harness.ts`
- `test/architecture/hosted-web/phase-1/dependencies/feature-dependencies.test.ts`
- `test/architecture/hosted-web/phase-1/fixtures/core-side-effect.ts`
- `test/architecture/hosted-web/phase-1/fixtures/filesystem-adapter.ts`
- `test/architecture/hosted-web/phase-1/fixtures/forbidden-core-import.ts`
- `test/architecture/hosted-web/phase-1/fixtures/hosted-electron-api.ts`
- `test/architecture/hosted-web/phase-1/fixtures/legacy-god-dto.ts`
- `test/architecture/hosted-web/phase-1/fixtures/path-secret-leak.ts`
- `test/architecture/hosted-web/phase-1/fixtures/production-adapter-mount.ts`
- `test/architecture/hosted-web/phase-1/fixtures/ratchet-regression.ts`
- `test/architecture/hosted-web/phase-1/parity/parity-references.test.ts`
- `test/architecture/hosted-web/phase-1/renderer-boundaries/renderer-boundaries.test.ts`
- `test/fixtures/hosted-web/phase-1/team-lifecycle/manifest.json`
- `test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/corrupt.json`
- `test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/draft.json`
- `test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/empty.json`
- `test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/not-found-inapplicable.json`
- `test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/partial.json`
- `test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/provisioning-inapplicable.json`
- `test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/stale.json`
- `test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/success.json`
- `test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/unavailable.json`
- `test/fixtures/hosted-web/phase-1/team-lifecycle/outcomes/unexpected.json`

These exact no-glob sets are copied from the accepted ownership manifest. Any overlap is
`scope_overlap`, never permission for cooperative editing.

## Global read-only boundary

Both producers must leave package and lock files, TypeScript/ESLint configuration, legacy APIs,
existing shared contracts, documentation, research, accepted evidence, and all production
registration/composition paths unchanged. In particular, `src/main/ipc/teams.ts`,
`src/main/http/teams.ts`, `src/main/http/index.ts`,
`src/main/services/infrastructure/HttpServer.ts`, `src/main/standalone.ts`,
`src/preload/constants/ipcChannels.ts`, `src/preload/index.ts`, and `src/renderer/api/index.ts` are
read-only. No production IPC channel, HTTP route, preload/global facet, renderer API, filesystem
adapter, dependency, or real-project/runtime access is allowed.

## Handoff and blocked review

Each producer writes only its manifest-owned handoff with exact checks, proof levels, changed paths,
negative results, unverified claims, and patch hashes. Only after both handoffs are independently
reviewed by a reviewer different from both producers may a later router consider P1.S3/P1.R1 and its
manifest-owned review path `docs/research/hosted-web/phase-1/reviews/routes-ratchets.md`. That review
path is not writable in P1.S2.

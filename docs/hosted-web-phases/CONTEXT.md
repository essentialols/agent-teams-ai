# Hosted-web context: what exists, where it lives, what holds it together

Living orientation map (≤200 lines) for anyone joining the hosted-web effort. Refresh it at every
integration step. Status authority stays with [EXECUTION_INDEX.json](EXECUTION_INDEX.json); this
file only answers "what is already built and where".

Last refreshed: 2026-07-19, after the phase-2 safe read boundary (`ec43eb727`).

## The goal in one paragraph

Decouple Agent Teams from Electron so a hosted web runtime can serve the same product. Strategy:
contract-first strangler — build transport-neutral contracts and adapters beside the legacy
Electron path, wire them through the existing transports, and only then take over mutations,
runtime control, and the real hosted server (master plan phases 3-10). Nothing existing is
rewritten in place; external CLI writers of team files must keep working untouched.

## Code map (all shipped and production-wired unless noted)

### Shared contract kernel — `src/shared/contracts/hosted/`

| File | What it is |
| --- | --- |
| `identifiers.ts` | Branded IDs. Canonical `TeamId`/`WorkspaceId` = `team_`/`workspace_` + 32 hex, opaque, never derived from names/paths (`parseTeamId`, `parseWorkspaceId`). Phase-1 synthetic IDs remain only for fixtures (`parseSyntheticTeamId`). |
| `query-context.ts` | In-process execution context (actor, scope, deadline, `AbortSignal`). **Host-assembled from the authenticated principal — never parsed from a wire payload.** |
| `revision.ts` | Opaque `Revision`/`Cursor` tokens + `HOSTED_SCHEMA_VERSION`. |
| `app-error.ts` | `createSafeAppError` — the redaction boundary; snapshots fields once so getters cannot smuggle unvalidated text. |

### Team lifecycle feature — `src/features/team-lifecycle/`

- `contracts/team-lifecycle-read.ts` — wire DTOs. `ListTeamLifecycleRequest` is fully
  JSON-serializable (`schemaVersion`, `cursor`, `expectedRevision`); identity/cancellation travel
  in `QueryContext`, passed separately. Canonical results carry `workspaceId` per item.
- `contracts/team-lifecycle-read-api.ts` — `TeamLifecycleReadTransportApi` (the single
  renderer-facing transport method `listTeamLifecycle`) and the wider in-process
  `TeamLifecycleReadApi` (snapshot / runtime projection / alive projections).
- `core/application/` — use cases (`ListTeamLifecycle`, `GetTeamLifecycleSnapshot`,
  `GetRuntimeStateProjection`, `ListAliveTeamProjections`) + `ports/TeamIdentityPersistence.ts`.
- `main/infrastructure/` — the adapters:
  `TeamIdentityFileStore.ts` (descriptor-bound, fail-closed identity publication),
  `TeamDirectoryLifecycleAdapter.ts` (derives lifecycle from real team directories; quarantine
  semantics for removal), `LegacyTeamLifecycleReadSource.ts` (read-only strangler over legacy
  data), `TeamIdentityBackupCompatibility.ts` (TeamBackupService interop).
  Note: temp-root admission compares canonical paths (macOS `/var` → `/private/var`).

### Supporting features

- `src/features/workspace-registry/` — workspace registration domain +
  `AuthorizeWorkspaceOperation` + read-only manifest adapter.
- `src/features/runtime-instance-context/` — deployment/boot identity of the running instance.
- `src/features/internal-storage/main/infrastructure/worker/teamIdentityStorage{Schema,Ops}.ts` —
  team-identity tables inside the existing SQLite worker (same worker as the storage pilot).

### Composition and transports (the phase-2 wiring, `bc893aa16`)

- `src/main/composition/hosted/phase2ReadComposition.ts` — assembles sources, storage, and use
  cases; `phase2ReadBootstrapSource.ts` reads `AGENT_TEAMS_HOSTED_PHASE2_READ_BOOTSTRAP`;
  `phase2ReadOnlyIdentitySource.ts` and `phase2RuntimeEvidenceSource.ts` complete the safe
  read boundary (`ec43eb727`).
- `src/main/composition/hosted/routing/` — route/capability catalog (drift-checked descriptors).
- Wired endpoints: IPC (`src/main/ipc/teams.ts`), HTTP POST `TEAM_LIFECYCLE_LIST_ROUTE`
  (`src/main/http/teams.ts`), preload (`src/preload/index.ts`), browser client
  (`src/renderer/api/httpClient.ts`), and `src/main/standalone.ts`.
- IPC and HTTP must stay semantically identical: enforced by
  `test/architecture/hosted-web/phase-2/ipc-http-read-conformance.test.ts`.

### Tests that guard all of this

- `test/architecture/hosted-web/phase-1/` — contract kernel, routes, boundaries, parity ratchets
  (corpus-wide scans of real sources).
- `test/architecture/hosted-web/phase-2/` — canonical identifiers, identity boundaries,
  IPC/HTTP conformance.
- `test/features/team-lifecycle/`, `test/features/workspace-registry/`,
  `test/features/internal-storage/` — behavior suites (fixture oracles, fault injection).
- `test/architecture/hosted-web/phase-0/` — one-shot phase-0 characterization gates plus three
  `node:test` suites run via `pnpm test:arch:node`.
- Expected failures live in [KNOWN_RED.md](KNOWN_RED.md) — check it before diagnosing red runs.

## Invariants that must survive every change

1. Wire DTOs stay JSON-serializable; `QueryContext` is host-assembled, never client-supplied.
2. Canonical IDs stay opaque; legacy team names never become identifiers in new contracts.
3. Legacy data access stays read-only until the mutation phase; external CLI writers keep working.
4. IPC and HTTP transports return semantically identical results (conformance test).
5. Guarded zones (`AGENT_CRITICAL_GUARDRAILS.md`): persisted state atomicity, message delivery,
   spawn/stop lifecycle — full review weight applies there.

## What is NOT built yet

Durable mutations (master plan phase 3), runtime control (4), the real hosted server and packaging
(5), auth (6), the browser lifecycle vertical (7), tasks/kanban/messages parity (8-9), release
hardening (10). No `phase-03/` packet exists yet; the master plan
([hosted-web-e2e-completion-plan.md](../hosted-web-e2e-completion-plan.md)) is the reference for
its scope.

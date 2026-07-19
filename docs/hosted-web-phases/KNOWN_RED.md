# Known red tests on this branch

Living ledger of test failures that are **known** on the current head, with cause, triage state,
and the resolution each needs. Check this file before diagnosing a red run; update it whenever an
entry is fixed or a new known failure appears. Anything red and NOT listed here is an unexpected
regression.

Last reviewed: 2026-07-19, head `ec43eb727` (from the CI run on that head).

## Understood — cause known, fix scoped

### `phase-0/parity-renderer/scan-api-and-actions.test.ts` — 5 failed (W1 parity drift)

- **Cause:** the base reconcile (`75a65332c`) moved renderer sources again; the pinned
  child-control catalog references stale site hashes. This recurs after **every** base merge.
- **Resolution:** reconcile
  `docs/research/hosted-web/phase-0/parity-renderer/renderer-child-control-catalog.json`
  (remove deleted controls, remap moved site hashes, sync duplicate counts, curate genuinely new
  controls), then regenerate the evidence with
  `pnpm exec tsx scripts/hosted-web/phase-0/parity-renderer/scan-api-and-actions.ts`.

### `phase-0/provider-runtime/scan-runtime-surfaces.test.ts` — 2 failed (W2 env census)

- **Cause:** production wiring introduced `AGENT_TEAMS_HOSTED_PHASE2_READ_BOOTSTRAP`
  (`src/main/composition/hosted/phase2ReadBootstrapSource.ts`); the environment census discovers
  it (and possibly newer keys from the reconcile) as unclassified.
- **Resolution:** hand-classify the new key(s) in
  `docs/research/hosted-web/phase-0/provider-runtime/environment-provenance.json` (group binding,
  policy profile, probe path per the schema) — the W2 scanner only validates, it does not
  regenerate — then verify with
  `pnpm exec tsx scripts/hosted-web/phase-0/provider-runtime/scan-runtime-surfaces.ts`.

### `phase-1/team-lifecycle/team-lifecycle-read-boundaries.test.ts` — 1 failed (export boundary)

- **Cause:** the wiring introduced wildcard `export *` re-exports in
  `src/features/team-lifecycle/contracts/index.ts` and `src/features/team-lifecycle/index.ts`;
  the boundary test forbids wildcard implementation exports outright
  (`expect(source).not.toContain('export *')`).
- **Resolution:** replace each `export *` with explicit named exports, deciding per export whether
  it should be public. There is no pinned entrypoint list to extend; do not weaken the wildcard
  ban.

## Needs triage — cause not yet established

### `src/main/services/team/provisioning/__tests__/TeamProvisioningServiceFacadeGuard.test.ts` — 3 failed

- Facade line-cap / narrow-entrypoint guards started failing after the base reconcile brought new
  facade surface. Owner must decide: shrink the facade or (with review) raise the documented cap.

### `test/main/services/team/TeamAgentLaunchMatrix.safe-e2e.test.ts` — 16 failed

- Large regression after the base reconcile (`75a65332c`); OpenCode launch/stop lane semantics
  changed on the base again. Needs owner triage against the base branch's own CI history before
  touching tests or code.

### `lint (main)` CI job — failed

- New lint errors in `src/main` after the reconcile; run
  `pnpm lint:ci:files src/main src/preload src/shared src/types` locally for the list.

## History

- 2026-07-17: W1 catalog debt (~127 uncurated controls) from that day's base merge — resolved.
- 2026-07-18: W2 env key + boundary export entries first recorded.
- 2026-07-19: W1 drift returned after the next base reconcile; FacadeGuard/LaunchMatrix/lint(main)
  appeared post-reconcile (untriaged).

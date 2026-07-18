# Known red tests on this branch

Living ledger of architecture-test failures that are **expected** on the current head, with their
causes and the exact resolution each one needs. Check this file before diagnosing a red
`test/architecture/hosted-web` run; update it whenever an entry is fixed or a new expected failure
appears. Anything red and NOT listed here is an unexpected regression.

Last reviewed: 2026-07-18, head `bc893aa16`.

## 1-2. `phase-0/provider-runtime/scan-runtime-surfaces.test.ts` (2 failures)

- **Cause:** `bc893aa16` introduced the `AGENT_TEAMS_HOSTED_PHASE2_READ_BOOTSTRAP` environment
  variable (`src/main/composition/hosted/phase2ReadBootstrapSource.ts`). The W2 environment census
  discovers it as an unclassified key.
- **Resolution:** classify the new key in the W2 evidence (`docs/research/hosted-web/phase-0/`
  provider-runtime documents) and regenerate the environment-provenance evidence with the W2
  scanner, the same way earlier routing keys were classified. Semantic classification (owner,
  disposition) belongs to the lane that owns the wiring.

## 3. `phase-1/team-lifecycle/team-lifecycle-read-boundaries.test.ts` (1 failure)

- **Cause:** `bc893aa16` widened the `team-lifecycle` public entrypoints (new `main/index.ts` and
  transport exports); the boundary test pins the previous narrow export list.
- **Resolution:** extend the boundary test's expected entrypoint list to the new deliberate
  exports (they are part of the accepted wiring), or narrow any export that was not meant to be
  public. Decide per export; do not blanket-widen the test.

## Historical note

The W1 child-control parity debt from the 2026-07-17 base merge (~127 uncurated renderer control
sites) has been resolved; `phase-0/parity-renderer/scan-api-and-actions.test.ts` is green again.
After every future base merge, expect the W1 catalog and W2 evidence to need the same
reconciliation pass (deleted/renamed controls, moved site hashes, new env keys).

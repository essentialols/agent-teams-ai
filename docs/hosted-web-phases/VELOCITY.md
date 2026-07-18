# Velocity guidance for hosted-web lanes

Reference material for controllers and workers. Not mandatory reading; it changes no authority.
Grounded in this branch's own history (commit ratios and remediation chains are cited from git log).

## 1. Mechanical checks run before handoff, never as review rounds

Format, lint, typecheck, and schema remediations each cost a full authorize → execute → review
cycle in Phase 1 (`P1.I format remediation`, `P1.I lint remediation`, `P1.S1 schema-version
remediation`). Every lane's definition of done includes the exact commands
(`pnpm exec prettier --check <paths>`, `pnpm lint:fast:files -- <paths>`, `pnpm typecheck`,
handoff schema validation); the worker runs them before ending, the controller re-runs them
instead of reviewing mechanical properties in prose. Formal review is for semantics only.

## 2. Record authorize/route/record together with the work

59 of the first 78 hosted-web commits were process bookkeeping in separate commits. A decision is
recorded when it is made: fold authorization, routing, and the record into the commit that carries
the change they govern.

## 3. Git already content-addresses everything

Freeze = commit SHA. Provenance = git log. Integrity = git itself. Attestation = a green CI run on
that SHA (both long-lived branches now run CI on every push). Hand-built SHA-256 path manifests,
manifests-of-manifests, and rollback proofs duplicate git and rot on every merge.

## 4. Parallel lanes only when they are large and disjoint

Phase 0 ran six worker lanes plus three cross-lane audits and reconciliation; coordination cost
more than the lanes. Serial execution with checkpoints is faster whenever lanes are under a few
hundred lines or need mutual consistency.

## 5. Keep the per-phase context small

A packet that requires reading ten documents completely before the first line of work is the main
cause of slow lane starts. Maintain one living CONTEXT file per phase (≤200 lines, refreshed at
integration); packets reference deltas.

## 6. Expect base merges to invalidate pinned evidence

Every base merge moves renderer controls, environment keys, and pinned hashes. Budget a
reconciliation step per sync: W1 child-control catalog (deleted/renamed controls, moved site
hashes, counts), W2 environment census (new keys need classification), and check
[KNOWN_RED.md](KNOWN_RED.md) first. Exact-SHA head pins in routers die on every push — pin
policies, resolve heads live at attempt start.

## 7. Detect regressions in hours, not days

CI now runs on pushes to `refactor/team-provisioning-round2-reapply` and
`refactor/hosted-web-feature-boundaries`. Keep it that way: a red push is the owner's signal the
same hour, instead of surfacing days later through someone else's merge. When PR #252 shows
CONFLICTING, its pull_request CI silently stops running — treat CONFLICTING itself as a pager.

## 8. Review weight follows risk, not ritual

Mechanics (format, renames, schema bumps) need the self-checks from item 1, not a formal reviewer.
Contract semantics need one adversarial review. Guarded zones (persisted state, message delivery,
spawn/stop lifecycle) get the full process. Pricing every change at the maximum tier is why phases
took days.

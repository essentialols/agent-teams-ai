# Phase 11 - Live E2E Release Gate Plan

## Purpose

Phase 11 proves that the complete GitHub App integration works end to end
before public rollout.

The target is not more architecture. The target is evidence:

```text
fresh desktop
  -> hosted control-plane
  -> official or staging GitHub App
  -> sandbox GitHub organization
  -> visible agent-attributed GitHub output
  -> auditable success and recovery path
```

This phase is the release gate for telling users that the GitHub integration is
ready.

## Summary

Build and run a repeatable live E2E suite plus release checklist covering:

- install/setup/claim
- desktop pairing and reconnect
- repository target enablement
- issue comment
- PR conversation comment
- PR review/check run if enabled
- retry and idempotency
- revocation and disabled target failures
- worker crash recovery
- secret/config failure safety
- privacy/security evidence
- runbook execution

Only flows required to safely release GitHub App V1 belong here.

## Architecture Decision

Recommended direction:

```text
staging live E2E harness
+ sandbox GitHub organization
+ real hosted control-plane
+ real GitHub App credentials
+ mocked destructive edges only where GitHub cannot safely simulate them
```

Options:

- Real staging E2E with sandbox GitHub org
  `🎯 10   🛡️ 9   🧠 7`
  Approx changes: `1200-2500` lines.
  Recommended. This is the only reliable proof of GitHub App behavior, setup
  callbacks, permissions, and rate-limit handling.

- Mock-only integration suite
  `🎯 4   🛡️ 5   🧠 4`
  Approx changes: `700-1600` lines.
  Useful but not enough. It cannot prove GitHub App registration, permissions,
  callbacks, or real provider semantics.

- Manual checklist only
  `🎯 3   🛡️ 4   🧠 2`
  Approx changes: `200-500` lines.
  Too fragile. It will drift and miss retry/idempotency regressions.

## Critical Scope

Phase 11 should implement:

- live E2E test plan and harness
- sandbox GitHub organization/repository fixtures
- staging environment prerequisites
- repeatable desktop pairing/setup script or guided checklist
- real GitHub action assertions
- audit/outbox verification
- failure injection where safe
- privacy/security verification script/checklist
- release readiness checklist
- incident recovery drills

Phase 11 should not implement:

- new GitHub action types
- messenger connectors
- billing/entitlements
- generic load testing platform
- marketplace launch copy
- broad analytics
- enterprise self-hosting

## E2E Environment

Required accounts/resources:

- staging control-plane deployment
- staging GitHub App
- sandbox GitHub organization
- sandbox repository with issues enabled
- sandbox repository with pull requests enabled
- test GitHub user authorized to install/claim the app
- test desktop workspace
- staging Postgres
- staging secret store
- log/metric access for operator

Repository fixtures:

- issue for comment tests
- pull request for PR conversation comment tests
- branch for check run tests
- protected case for permission-denied tests if needed
- repository target disabled case

Secrets:

- stored only in the hosted secret manager or local secure CI secret store
- never committed
- never printed by the harness
- redacted in failure artifacts

## Golden Path Scenarios

### Setup And Pairing

Flow:

1. start with fresh desktop state
2. pair desktop with hosted control-plane
3. start GitHub setup session
4. install staging GitHub App into sandbox org
5. complete claim flow
6. return to desktop
7. verify connected state
8. verify repository availability snapshot
9. enable repository target

Assertions:

- setup status transitions are correct
- `installation_id` alone is never accepted as trusted
- desktop token is created and scoped
- repository targets use immutable GitHub repository ids
- audit events exist
- no token or OAuth code appears in logs

### Agent Issue Comment

Flow:

1. submit trusted action envelope for sandbox issue
2. wait for outbox dispatch
3. fetch GitHub issue comments
4. find hidden marker
5. verify visible agent/team attribution
6. verify avatar fallback or allowed avatar rendering
7. verify action status is succeeded

Assertions:

- GitHub actor is the App bot
- body shows agent name and team name
- hidden marker does not leak internal ids or raw prompts
- result metadata stores content hash/external ids, not raw body
- encrypted content is deleted or crypto-shredded after success

### Agent PR Conversation Comment

Flow:

1. submit trusted PR conversation comment action
2. wait for worker dispatch
3. fetch PR issue comments
4. verify marker and attribution
5. retry same idempotency key
6. verify no duplicate comment

Assertions:

- PR belongs to bound base repository
- issue comment action does not cross repository boundary
- duplicate idempotency key returns existing status
- unknown outcome retry uses marker recovery

### PR Review And Check Run

Run only if enabled by backend flags.

Assertions:

- PR review uses explicit `COMMENT` semantics
- no approve/request-changes action is available unless separately accepted
- check run has stable low-cardinality name
- check run stores GitHub `check_run_id` for updates
- `external_id` is correlation metadata, not a uniqueness guarantee

## Failure And Recovery Scenarios

Critical failures:

- desktop token revoked before setup status poll
- setup session expired before callback
- GitHub App installation removed after target enabled
- repository target disabled before action dispatch
- worker crashes after claiming event
- GitHub returns retry-after/secondary rate-limit response
- GitHub returns permission denied
- DB update fails after GitHub success
- hidden marker is manually deleted
- encrypted content decryption fails
- webhook signature invalid if webhooks are enabled

Expected behavior:

- failures map to safe error codes
- policy failures do not retry forever
- retry-after controls next attempt time
- worker crash recovers stale processing events
- duplicate public comments are avoided
- decryption failure fails closed
- dead-letter is auditable and bounded by retention policy

## Privacy And Security Gate

The release cannot pass unless evidence shows:

- no GitHub installation token in desktop process logs
- no GitHub installation token in renderer state
- no GitHub App private key in desktop artifacts
- no OAuth code or PKCE verifier in logs
- no raw action content in general logs
- no raw webhook payload persisted by default
- no repository code or diffs stored by default
- encrypted external action content retention works
- dead-letter content retention is bounded
- avatar URL policy blocks local file paths and unsafe schemes
- setup session ids are correlation ids, not authentication
- GitHub `installation_id` from callback is verified through claim flow

## Observability Gate

E2E run must capture:

- request id
- correlation id
- workspace id
- setup session id
- action id
- outbox event id
- GitHub external ids where safe
- safe error code/category for failures
- worker attempt count
- retry/dead-letter status

Required dashboards or query snippets:

- setup success/failure
- action request success/failure
- outbox lag
- dead-letter count
- token broker failures
- GitHub provider error classes
- encrypted content cleanup lag

## Release Checklist

Before public beta:

- Phase 9 desktop bridge merged and verified
- Phase 10 hosted operations merged and verified
- staging deployment active
- staging GitHub App installed in sandbox org
- golden path E2E suite passes
- failure/recovery E2E suite passes or explicitly deferred with accepted risk
- security/privacy gate passes
- secret rotation drill completed at least once in staging
- operator runbooks reviewed
- rollback procedure documented
- public error messages reviewed
- support/debug artifact redaction verified

## Harness Design

Recommended harness shape:

```text
control-plane/scripts/live-e2e/
  github-app-setup-smoke.mjs
  github-agent-action-smoke.mjs
  github-failure-recovery-smoke.mjs
  lib/
```

Rules:

- scripts fail closed on missing staging env
- scripts print safe ids, not secrets
- scripts clean up only sandbox-owned resources
- scripts do not delete user resources
- scripts are explicit about which GitHub org/repo they target
- scripts can run locally by maintainers and in protected CI

## Test Plan

Automated:

- live smoke script against staging
- mocked failure injection tests for retry/dead-letter
- redaction tests for generated artifacts
- contract tests for desktop/control-plane version compatibility
- architecture checks after harness additions

Manual:

- fresh install and setup through real browser
- desktop restart during pending setup
- revoke desktop client from hosted admin path
- remove GitHub App installation
- rotate staging webhook secret or private key
- inspect runbook steps from a clean operator shell

## Acceptance Criteria

- fresh desktop can connect to hosted control-plane
- user can install and claim GitHub App into sandbox org
- repository target can be enabled and shown in desktop
- trusted agent action creates visible GitHub App comment with agent/team
  attribution
- duplicate/retry path does not create duplicate public comments
- disabled/revoked/expired states fail closed with safe errors
- worker crash recovery is proven
- critical secrets never appear in logs, desktop, renderer, or artifacts
- live E2E scripts and release checklist are documented
- public beta is blocked until this gate is green

## Rollout

Recommended rollout:

1. maintainers only
2. internal dogfood org
3. trusted external sandbox users
4. beta public GitHub App listing
5. wider release after support and incident data are stable

## Deferred After Release Gate

These are important but not critical for the GitHub App V1 release gate:

- messenger connector foundation
- billing and entitlements
- BYO GitHub App
- enterprise self-hosting
- multi-region active-active deployment
- broad product analytics
- additional GitHub write actions

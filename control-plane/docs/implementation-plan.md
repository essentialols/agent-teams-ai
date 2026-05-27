# Control Plane Implementation Plan

## Purpose

This plan describes how to create the Agent Teams Control Plane foundation without rushing into GitHub-specific code too early.

The implementation should happen in phases. Each phase should leave the system coherent, testable, and reviewable.

## Phase 0 - Documentation And Repository Boundary

Status: completed in the scaffold branch.

Goals:

- create `control-plane/`
- document optional nature of the service
- decide architecture direction
- record NestJS modular monolith ADR
- record edge cases and security model

Deliverables:

- `control-plane/README.md`
- `control-plane/docs/architecture.md`
- `control-plane/docs/implementation-plan.md`
- `control-plane/docs/plan-review-and-hardening.md`
- `control-plane/docs/edge-cases.md`
- `control-plane/docs/security-and-privacy.md`
- `control-plane/docs/decisions/001-nestjs-modular-monolith.md`

No dependencies, package manifests, or executable code should be added in this phase.

## Phase 0.5 - Pre-Implementation Decision Gates

Goals:

- make the risky product/architecture decisions explicit before scaffold code exists
- avoid implementing a "generic service" that accidentally depends on hidden GitHub assumptions
- avoid promising self-hosted official-app mode without a token broker design

Required decisions:

- hosted official GitHub App is the V1 deployment target
- self-hosted official-app mode is deferred unless a hosted token broker ADR exists
- BYO GitHub App self-hosted mode is future/enterprise, not V1
- V1 GitHub App registration uses setup URL plus separate claim OAuth flow, not OAuth-during-install
- V1 GitHub comments are issue comments and top-level PR comments
- line-level review comments require a separate ADR
- agent identity comes from trusted desktop/runtime envelope, not agent-authored text
- Postgres is the v1 canonical store for metadata, idempotency, locks, and outbox
- no raw prompts, reusable model-output logs, repository code, diffs, or raw webhook payloads are stored by default
- external action content may be temporarily stored only as encrypted, short-retention dispatch payload
- GitHub REST API version is pinned after checking current official docs
- V1 GitHub App permissions are mapped per capability and kept minimal
- GitHub installation claim requires provider-side authority verification, not setup URL `installation_id` alone
- GitHub user access tokens used for claim verification are not persisted in V1
- GitHub App client secret remains hosted control-plane secret only
- GitHub claim OAuth uses hosted web application flow, short-lived state, and
  `S256` PKCE
- GitHub device flow is deferred unless a future ADR defines server-side claim
  brokerage without exposing user tokens to desktop

Deliverables:

- [Plan Review And Hardening](plan-review-and-hardening.md)
- ADR for deployment modes and GitHub App secret custody
- ADR for agent identity envelope and attribution rendering
- ADR for GitHub comment modes
- ADR for outbox transaction and recovery strategy
- ADR for external action content storage, encryption, and retention
- ADR for content encryption key management and crypto-shredding
- ADR for GitHub API version and permission mapping policy
- ADR for GitHub installation claim authority and user authorization flow
- ADR for GitHub App registration settings and OAuth/device-flow policy

Acceptance criteria:

- all required V1 decisions are accepted or explicitly deferred
- implementation PRs can point to an ADR instead of re-litigating deployment/security basics
- docs clearly distinguish hosted official app mode from self-hosted BYO app mode
- setup URL `installation_id` is documented as untrusted input
- docs clearly state that OAuth-during-install is not enabled in V1 when using setup URL

Approximate change size:

```text
🎯 10   🛡️ 10   🧠 4
~600-1200 lines
```

## Phase 1 - Workspace Scaffold

Status: implemented in the scaffold branch.

Goals:

- add `control-plane/package.json`
- add `control-plane/pnpm-workspace.yaml`
- add TypeScript config
- add ESLint/prettier config
- add `apps/api`
- add `apps/worker`
- add `packages/shared`
- add `packages/platform/config`
- add `packages/platform/logger`
- add architecture boundary checker
- add placeholder config keys for external API versions without real secrets

Dependency policy:

- verify latest stable versions before adding dependencies
- pin versions through lockfile
- verify current official docs before pinning a GitHub REST API version
- avoid adding infrastructure SDKs before their phase

Expected packages:

- NestJS core/platform package
- TypeScript
- Zod or equivalent validation library
- test runner
- lint tooling

Do not add Prisma, Octokit, queue, or billing dependencies yet.

Acceptance criteria:

- `pnpm --dir control-plane install --frozen-lockfile`
- `pnpm --dir control-plane format:check`
- `pnpm --dir control-plane typecheck`
- `pnpm --dir control-plane test`
- `pnpm --dir control-plane architecture:check`
- `pnpm --dir control-plane lint`
- `pnpm --dir control-plane build`
- `pnpm --dir control-plane worker:smoke`
- `pnpm --dir control-plane worker:smoke:dist`
- `pnpm --dir control-plane api:smoke`
- `pnpm --dir control-plane api:smoke:dist`
- `pnpm --dir control-plane config:hosted-failfast`
- API app has `/health`
- worker app boots and exits cleanly in smoke mode
- `domain/application` forbidden import check is active
- forbidden pre-phase SDK dependency check is active
- no request-scoped Nest provider is used in domain/application wiring
- no `forwardRef()` exists
- feature packages expose only explicit entrypoints
- config validation can fail startup on missing required hosted-mode settings without breaking local-disabled mode

Approximate change size:

```text
🎯 9   🛡️ 9   🧠 5
~800-1400 lines
```

## Phase 2 - Shared Kernel And Platform Basics

Goals:

- add shared `Result`
- add shared error primitives
- add typed IDs
- add clock/time helpers
- add config loader and env validation
- add logger abstraction

Packages:

```text
packages/shared/result
packages/shared/errors
packages/shared/ids
packages/shared/time
packages/shared/validation
packages/platform/config
packages/platform/logger
```

Rules:

- shared must not know about Nest
- platform may use Nest where useful
- config must validate env at boot
- errors exposed over public APIs must be safe and stable

Acceptance criteria:

- safe error format documented in [Public Error Contract](error-contract.md)
- unit tests for Result/errors/config
- API health route includes version/build metadata without secrets

Approximate change size:

```text
🎯 9   🛡️ 9   🧠 5
~700-1200 lines
```

## Phase 3 - API/Error/Observability Platform Layer

Goals:

- add `packages/platform/api`
- add framework adapter for public safe error responses
- add request and correlation id propagation
- add request context store for API request scope
- add safe request logging with duration/status/method/path
- add global Nest exception filter and request interceptor
- keep all public errors aligned with [Public Error Contract](error-contract.md)

Important rule:

API adapters normalize errors and observability metadata only. They do not perform
auth decisions, persistence, GitHub calls, queue dispatch, pairing, billing, or
provider-specific error mapping.

Acceptance criteria:

- every API response receives `x-request-id` and `x-correlation-id`
- safe incoming correlation/request ids are preserved
- unsafe incoming ids are ignored and replaced
- `SafeError` values serialize to the public error contract
- unknown exceptions serialize to `CONTROL_PLANE_INTERNAL_ERROR`
- public error responses do not expose stack traces or raw exception messages
- health response keeps version/build metadata and no secrets
- request logs include safe metadata only
- global filter/interceptor are registered once through platform module wiring
- architecture guardrails still pass

Approximate change size:

```text
🎯 9   🛡️ 9   🧠 5
~600-1100 lines
```

## Phase 4 - Database, Transactions, Outbox, Locks

Detailed plan: [Phase 4 Persistence, Transactions, Outbox, Locks Plan](phase-4-persistence-transactions-outbox-locks-plan.md)

Goals:

- add database platform package
- add migration setup
- add transaction port
- add outbox feature
- add encrypted external action content store
- add platform crypto adapter for envelope encryption
- add distributed lock port and initial DB-backed adapter
- add dead-letter state

Important rule:

No external side effects happen inline in request handlers. Requests record intent and outbox events; workers perform side effects.

Recommended v1 storage:

- Postgres as canonical metadata store
- DB-backed outbox and locks
- Postgres-backed encrypted ExternalActionContent for atomic action/outbox/content transaction
- no Redis/Kafka/queue service until DB-backed processing is proven insufficient
- no object storage for ExternalActionContent until atomicity/lifecycle ADR exists

Core tables:

```text
OutboxEvent
DeadLetterEvent
AuditEvent
ExternalActionContent
ExternalActionContentKeyRef
```

Potential later tables:

```text
Workspace
DesktopClient
IntegrationConnection
AgentActionRequest
GitHubSetupSession
GitHubInstallationClaim
```

Acceptance criteria:

- outbox event can be appended inside transaction
- worker claims pending event
- retry with backoff exists
- stale processing recovery exists or is explicitly documented as a follow-up gate before GitHub side effects
- unknown event version becomes dead letter
- no in-memory lock is used for correctness
- idempotency has database uniqueness, not only application checks
- worker shutdown does not lose claimed events
- outbox event payload stores content reference/hash, not raw comment body
- encrypted content can be deleted or cryptographically shredded after success
- dead-letter retention policy for encrypted content is explicit
- each ExternalActionContent row uses envelope encryption with per-content data encryption key
- key rotation/rewrap path is documented or implemented before public rollout
- decryption failure fails safe and never posts regenerated/best-effort content

Approximate change size:

```text
🎯 9   🛡️ 10   🧠 7
~1200-2200 lines
```

## Phase 5 - workspace-bound GitHub installation

Detailed plan:
[Phase 5 Workspace-Bound GitHub Installation Plan](phase-5-workspace-bound-github-installation-plan.md)

The detailed plan is the canonical Phase 5 scope. It keeps agent action
envelopes, GitHub comments, installation token issuance, and target enablement
out of Phase 5.

Goals:

- introduce workspace identity
- introduce desktop client identity
- introduce verified GitHub App installation claim flow
- implement short-lived pairing code
- implement revocable desktop client token
- implement resumable hosted setup session model for desktop-started integrations
- bind a verified GitHub App installation to a workspace
- snapshot repository availability without granting target authorization

Feature packages:

```text
packages/features/workspace-identity
packages/features/integration-connections
packages/features/github-installation-setup
```

Use cases:

- `BootstrapWorkspace`
- `StartDesktopPairing`
- `CompleteDesktopPairing`
- `RotateDesktopClientToken`
- `RevokeDesktopClient`
- `ValidateDesktopClientSession`
- `StartGitHubInstallationSetup`
- `HandleGitHubSetupCallback`
- `StartGitHubClaimOAuth`
- `CompleteGitHubClaimOAuth`
- `GetGitHubSetupStatus`

Security rules:

- pairing code is short-lived
- pairing code is single-use
- desktop token is scoped to workspace/client
- desktop token can be revoked
- desktop token is not a GitHub token
- agent identity snapshot is attribution metadata, not an authorization grant
- paired desktop identity does not prove GitHub organization or repository authority
- setup session id is correlation data, not authentication
- hosted setup sessions expire and can be cancelled
- setup URL `installation_id` is untrusted until GitHub user-token verification
- repository availability is not target authorization

Acceptance criteria:

- unit tests for pairing expiry and single-use
- integration tests for token validation
- route tests for pairing endpoints
- audit events for pairing complete and revoke
- old/rotated desktop token cannot start setup, pairing, or status flows
- GitHub installation binding cannot be completed with desktop token or
  `installation_id` alone
- desktop can resume active setup session after app restart
- expired/cancelled setup session cannot become connected later
- repository availability snapshots use immutable GitHub repository ids

Approximate change size:

```text
🎯 10   🛡️ 10   🧠 7
~2500-4000 lines
```

## Phase 6 - repository target binding and policy

Detailed plan:
[Phase 6 Repository Target Binding And Policy Plan](phase-6-repository-target-binding-policy-plan.md)

Goals:

- turn repository availability snapshots into explicit workspace targets
- add target state and policy rules
- keep repository availability separate from authorization
- provide the policy evaluator that later GitHub action dispatch must call
- fail closed on partial/stale repository snapshots in V1, without GitHub HTTP
- use a conservative repository availability max age before enabling targets
- use SQL migration partial unique indexes for active target authorization
  constraints
- avoid GitHub writes and token issuance

Recommended package:

```text
packages/features/integration-targets
```

Approximate change size:

```text
🎯 10   🛡️ 9   🧠 6
~1500-2500 lines
```

## Phase 7 - GitHub installation token broker

Detailed plan:
[Phase 7 GitHub Installation Token Broker Plan](phase-7-github-installation-token-broker-plan.md)

Goals:

- mint GitHub App installation tokens server-side only
- narrow tokens by enabled target repository and minimal permission set
- keep tokens out of desktop, agents, runtime subprocesses, logs, and DB
- use no token cache in V1 and always pass explicit `repository_ids`
- keep token broker abuse controls active because no-cache V1 can otherwise
  over-call GitHub token endpoints
- keep readiness honest: config/key parseability only, not proof that every
  installation has future action permissions
- expose readiness/dry-run status, not token-returning APIs
- provide the internal server-side broker port used by Phase 8

Recommended package:

```text
packages/features/github-token-broker
```

Approximate change size:

```text
🎯 9   🛡️ 10   🧠 7
~1200-2200 lines
```

## Phase 8 - Agent GitHub actions outbox

Detailed plan:
[Phase 8 Agent GitHub Actions Outbox Plan](phase-8-agent-github-actions-outbox-plan.md)

Goals:

- accept trusted agent action request envelopes
- validate target policy before enqueue and before dispatch
- store action body as encrypted short-retention external action content
- enqueue GitHub writes through outbox
- dispatch comments/reviews/checks through the GitHub App with visible agent
  attribution
- render safe agent avatar metadata when possible, while GitHub actor remains the
  official App
- use a default public agent avatar when a specific agent avatar is missing or
  unsafe
- honor GitHub retry-after/rate-limit backoff through an outbox retry extension
- keep check-run names stable and put per-action correlation in `external_id`
- keep retries/idempotency/dead-letter behavior explicit

Recommended package:

```text
packages/features/agent-github-actions
```

Approximate change size:

```text
🎯 10   🛡️ 9   🧠 8
~2000-3500 lines
```

## Phase 9 - Desktop GitHub Integration Bridge

Detailed plan:
[Phase 9 Desktop GitHub Integration Bridge Plan](phase-9-desktop-github-integration-bridge-plan.md)

Goals:

- connect the desktop app to hosted control-plane pairing/setup/status APIs
- add the trusted runtime bridge that submits structured agent GitHub action
  envelopes
- keep desktop local-first and fully usable without control-plane
- keep GitHub installation tokens server-side only
- surface connected repositories, unavailable states, version mismatch, and
  action status safely

Approximate change size:

```text
🎯 10   🛡️ 10   🧠 7
~1600-2800 lines
```

## Phase 10 - Hosted GitHub App Operations

Detailed plan:
[Phase 10 Hosted GitHub App Operations Plan](phase-10-hosted-github-app-operations-plan.md)

Goals:

- make the official hosted GitHub App path deployable and operable
- document GitHub App registration, permissions, callbacks, and secret custody
- harden hosted config, readiness, migration, worker, and runbook workflows
- define critical metrics, alerts, and secret rotation procedures
- prove staging deployment with the official/staging GitHub App

Approximate change size:

```text
🎯 10   🛡️ 9   🧠 6
~1000-2200 lines
```

## Phase 11 - Live E2E Release Gate

Detailed plan:
[Phase 11 Live E2E Release Gate Plan](phase-11-live-e2e-release-gate-plan.md)

Goals:

- prove the complete GitHub App flow against a sandbox GitHub organization
- run golden-path install, claim, target enablement, and agent action scenarios
- run critical retry, revocation, disabled target, worker crash, and redaction
  checks
- block public beta until live E2E, security/privacy, and recovery gates pass

Approximate change size:

```text
🎯 10   🛡️ 9   🧠 7
~1200-2500 lines
```

## Deferred After GitHub V1

These are intentionally not part of the critical GitHub App release path:

- messenger connector foundation
- Telegram/Slack/Discord integrations
- billing and entitlements
- BYO GitHub App
- enterprise self-hosting
- multi-region active-active deployment
- broad product analytics
- additional GitHub write actions beyond accepted V1 actions

## Recommended PR Sequence

Completed/foundation PRs:

1. Documentation-only foundation.
2. Decision-gate ADRs from Phase 0.5.
3. Workspace scaffold with architecture check.
4. Shared kernel and config/logger.
5. Persistence, transactions, outbox, and locks.
6. Workspace-bound GitHub installation.
7. Repository target binding and policy.
8. GitHub installation token broker.
9. Agent GitHub actions outbox.

Critical next PRs:

1. Desktop GitHub integration bridge.
2. Hosted GitHub App operations.
3. Live E2E release gate.

Do not combine all phases into one PR.

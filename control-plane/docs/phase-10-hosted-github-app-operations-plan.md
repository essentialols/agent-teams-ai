# Phase 10 - Hosted GitHub App Operations Plan

## Purpose

Phase 10 makes the official hosted GitHub App path deployable and operable for
real users.

The earlier phases build the code path. This phase makes it safe to run:

```text
official GitHub App
  -> hosted control-plane API
  -> worker/outbox
  -> Postgres
  -> observability and runbooks
```

Without this phase, GitHub integration can work in development but is not ready
for public installation.

## Summary

Implement the minimal hosted operations foundation:

- production configuration profile
- GitHub App registration checklist
- secret custody and rotation runbook
- database migration/deploy flow
- worker deployment and outbox health checks
- readiness/liveness probes
- structured logs and metrics for critical paths
- safe admin/operator runbooks
- backup and recovery expectations
- hosted environment smoke tests

This phase should not add product features beyond operational readiness.

## Architecture Decision

Recommended direction:

```text
single hosted control-plane deployment
+ separate api and worker processes
+ managed Postgres
+ managed secret store
+ no microservice split yet
```

Options:

- Modular monolith deployed as API plus worker
  `🎯 10   🛡️ 9   🧠 6`
  Approx changes: `1000-2200` lines.
  Recommended. Matches current architecture and keeps operations simple.

- Split GitHub integration into separate microservice now
  `🎯 5   🛡️ 7   🧠 9`
  Approx changes: `3000-6000` lines.
  Too early. Adds network contracts, deployment coupling, and more failure
  modes before load proves the need.

- Keep only local/dev deployment docs
  `🎯 3   🛡️ 4   🧠 3`
  Approx changes: `400-900` lines.
  Not enough. Users cannot safely install the official shared GitHub App without
  a reliable hosted backend.

## Critical Scope

Phase 10 should implement:

- production env schema review
- hosted GitHub App required settings doc
- secret inventory and ownership model
- secret rotation procedure
- deployment runbook for API and worker
- migration runbook with rollback expectations
- health/readiness endpoint hardening for hosted mode
- worker outbox lag and dead-letter visibility
- release artifact build checks
- hosted smoke script against a configured non-production deployment
- minimal dashboards/alerts spec
- safe operator commands for retry/cancel/dead-letter inspection if not already
  present

Phase 10 should not implement:

- billing
- multi-region active-active
- generic integration marketplace
- BYO GitHub App
- messenger connectors
- new queue service unless DB-backed outbox is proven insufficient
- Kubernetes-specific assumptions unless that is the chosen deployment target

## Plan-Improve Findings

Scope preserved:

- Phase 10 remains an operations hardening phase for the hosted GitHub App path.
- It should not add new GitHub action types, desktop UX, billing, or messenger
  connectors.
- It can add operational scripts/docs/checks only when they reduce deployment,
  secret, migration, or recovery risk.

Weak spots studied in current code:

- Hosted mode already has strict config gates for public URL, GitHub App
  metadata, OAuth secret, database URL, encryption key, persistence, outbox,
  integration targets, token broker, and GitHub actions.
- The code exposes feature flags for desktop bootstrap/pairing, GitHub setup,
  claim OAuth, integration targets, token broker, actions, and unclaimed
  callback recording. Operations docs must define valid hosted combinations.
- The API and worker are separate entrypoints in one workspace. Phase 10 should
  deploy them from the same release revision, not split services yet.
- Current route surface is desktop-token authenticated for app workflows and
  public only for GitHub setup/OAuth callbacks. Hosted CORS and public callback
  rules need explicit review.
- `verify:phase1` is a full local gate, but production readiness also needs DB
  migration, DB smoke, hosted config, and staging live smoke gates.

## Deployment Topology

V1 topology:

```text
load balancer / platform router
  -> control-plane api process

worker process
  -> same codebase, worker entrypoint

managed Postgres
  -> metadata, outbox, locks, encrypted action content

managed secret store
  -> GitHub App private key
  -> GitHub App webhook secret
  -> GitHub OAuth client secret
  -> envelope encryption root key or key reference
```

Operational rules:

- API and worker use the same release revision
- worker count can scale horizontally only if DB lock/outbox claim semantics are
  verified
- migrations run before new code starts processing new event versions
- old workers must not process new unsupported event versions
- hosted mode fails startup if required secrets are absent
- API can deploy without worker only for read/setup maintenance windows
- worker must not run with actions enabled if API has not applied the matching
  migrations
- worker scale-out requires proving DB-backed claims and locks in staging

## Hosted Startup Matrix

Document and test these valid hosted combinations:

```text
setup-only staging:
  desktopBootstrap=true
  desktopPairing=true
  githubSetup=true
  githubClaimOAuth=true
  integrationTargets=false
  githubTokenBroker=false
  githubActions=false
  outboxWorker=false

target-management staging:
  desktopBootstrap=true
  desktopPairing=true
  githubSetup=true
  githubClaimOAuth=true
  integrationTargets=true
  githubTokenBroker=false
  githubActions=false
  outboxWorker=false

actions staging or beta:
  desktopBootstrap=true
  desktopPairing=true
  githubSetup=true
  githubClaimOAuth=true
  integrationTargets=true
  githubTokenBroker=true
  githubActions=true
  persistence=true
  outboxWorker=true
```

Invalid combinations must fail fast:

- GitHub actions without persistence
- GitHub actions without outbox worker
- GitHub actions without token broker
- token broker without integration targets
- claim OAuth without GitHub setup
- hosted mode without HTTPS public base URL
- hosted mode without encryption master key
- GitHub actions without default avatar URL and allowed origins

## GitHub App Registration Checklist

Document and verify:

- App name and public description
- homepage URL
- setup URL
- callback URL
- webhook URL
- webhook secret
- private key custody
- requested repository permissions
- requested account permissions
- subscribed webhook events
- installation target account policy
- whether app is public or private during rollout
- organization ownership and recovery contacts

Required V1 permissions should remain minimal and map to implemented action
types only.

Permission mapping must document:

- issue comments
- pull request conversation comments
- pull request reviews if enabled
- check runs if enabled
- metadata/read permissions needed for repository validation

Forbidden in V1 unless accepted by a separate plan:

- contents write
- administration write
- secrets write
- actions write
- merge/write capabilities

## Secret Custody

Secret classes:

- GitHub App private key
- GitHub webhook secret
- GitHub OAuth client secret
- control-plane signing/encryption keys
- database URL
- session token signing keys
- hosted environment provider tokens

Rules:

- no secret in repository
- no secret in Electron
- no secret in Docker image layers
- no secret in build logs
- no full env dump in health or diagnostics
- no GitHub private key in local examples
- rotation procedure is tested before public beta

Rotation runbooks:

- GitHub App private key rotation
- webhook secret rotation
- OAuth client secret rotation
- desktop session signing key rotation
- envelope encryption key rotation/rewrap or crypto-shred policy
- database credential rotation

## Hosted Configuration

Hosted startup must validate:

- public base URL
- GitHub App id
- GitHub App private key source
- webhook secret source
- OAuth client id and secret
- database URL
- encryption key configuration
- action feature flags
- allowed avatar URL policy
- CORS/origin policy for hosted callback pages
- log level
- build revision and creation timestamp

Validation output:

- safe missing-key error code
- no raw secret values
- operator-friendly key names
- fail fast in hosted mode
- allow disabled/local mode for normal desktop development
- safe summary shows whether values are configured, not the values themselves
- operator docs map every required env var to owner, source, rotation cadence,
  and blast radius

## Database And Migration Operations

Required docs/scripts:

- migration apply command
- migration status command
- rollback stance
- backup before destructive migration
- seed data policy
- test database policy
- operator access policy

Migration rules:

- additive migrations preferred
- deploy code that can read old and new schema when possible
- outbox event version changes must be backward compatible or gated
- destructive migration requires explicit release gate
- encrypted action content retention must survive deploy rollback safely

Deployment ordering:

1. build release artifact
2. run local `verify:phase1`
3. run DB migration in staging
4. start API with actions disabled
5. start worker with outbox worker disabled
6. run setup/target smoke
7. enable token broker
8. enable GitHub actions and outbox worker together
9. run live action smoke
10. promote the same revision to production

Rollback rules:

- disabling `CONTROL_PLANE_GITHUB_ACTIONS_ENABLED` stops new action requests
- disabling `CONTROL_PLANE_OUTBOX_WORKER_ENABLED` pauses dispatch without
  deleting queued events
- rolling back code must not downgrade schema unless a tested rollback exists
- if a new outbox event version was introduced, keep old worker stopped until
  unsupported events are drained, cancelled, or dead-lettered by policy
- never rotate encryption keys as part of emergency app rollback

## Worker Operations

Worker readiness should verify:

- database reachable
- outbox claim path can initialize
- lock adapter configured
- event handler registry loaded
- GitHub token broker config parseable
- hosted feature flags consistent

Worker metrics:

- pending outbox events by type
- processing outbox events by age
- retry count by type
- dead-letter count by type
- dispatch success/failure counts
- GitHub provider response class
- token broker request count
- rate-limit/backoff count
- encrypted content cleanup lag

Failure behavior:

- worker shutdown releases or times out claims safely
- unknown event versions go dead-letter
- provider retry-after updates next attempt time
- disabled feature flag pauses dispatch without losing queued events
- decryption failure fails closed
- private key parse failure fails readiness before dispatch
- GitHub token broker repeated failures trigger alert before outbox max attempts
  burn down
- dead-letter inspection never decrypts action body by default
- cleanup of completed encrypted content is observable and bounded

## API Operations

API health/readiness:

- liveness stays shallow
- readiness checks critical dependencies only
- hosted mode readiness fails when DB or required config is missing
- health includes service name/version/build metadata only
- no secrets or full env values

API metrics/logs:

- request count/status/duration
- safe request/correlation ids
- safe error code/category
- desktop contract version
- GitHub setup state transitions
- action enqueue outcomes
- no raw comments, prompts, tokens, OAuth codes, or webhook payloads
- public callback result class, not raw query values
- desktop contract version and safe client build metadata when present
- hosted feature gate state in startup logs only as booleans

## Admin And Recovery

Minimal operator workflows:

- inspect workspace connection by safe public id
- inspect GitHub installation binding by safe public id
- inspect outbox event by id
- inspect dead-letter reason without raw secret/content leakage
- retry safe dead-letter event if policy allows
- cancel queued action if feature gate is disabled
- revoke desktop client
- revoke workspace GitHub connection
- force refresh repository availability snapshot

Admin access rules:

- no broad unauthenticated admin endpoints
- prefer CLI or protected internal endpoint
- every admin mutation writes audit event
- admin output redacts action content and secrets
- admin retry requires current target policy re-evaluation unless explicitly
  documented otherwise
- admin cancel keeps encrypted content retention/shred policy explicit
- admin force-refresh repository availability must not silently enable targets

Runbook edge cases:

- lost GitHub App private key
- leaked webhook secret
- leaked OAuth client secret
- database connection string rotation during worker processing
- stuck processing event older than lease
- dead-letter caused by decryption failure
- connected installation deleted from GitHub side
- public base URL changed while setup sessions are pending

## Observability And Alerts

Critical alerts:

- API readiness failing
- worker readiness failing
- outbox lag above threshold
- dead-letter count increasing
- GitHub token broker failures
- OAuth claim failure spike
- setup callback failure spike
- database connection failures
- encrypted content cleanup lag above retention
- webhook signature verification failures spike
- rate-limit backoff sustained above threshold
- public callback error spike
- desktop auth failures spike after deploy
- setup sessions stuck in pending claim
- worker processing events older than lease plus recovery window

Dashboards:

- setup funnel
- connected installations
- enabled repository targets
- action requests by type
- action success/failure/dead-letter
- outbox latency
- GitHub provider error classes
- API p95 latency

## Security And Privacy Review

Review checklist:

- no GitHub private key in built artifacts
- no session tokens in logs
- no OAuth codes in logs
- no raw action content in logs
- no raw webhook payloads persisted by default
- encrypted content retention enforced
- dead-letter content retention bounded
- setup `installation_id` remains untrusted until claim verification
- desktop tokens are revocable
- repository target policy fails closed
- GitHub installation tokens never leave server process

## Test Plan

Automated tests:

- hosted config fail-fast tests
- secret redaction tests
- readiness tests for missing DB/config
- worker startup hosted-mode tests
- outbox lag/dead-letter metric tests where practical
- smoke script using mocked GitHub provider
- migration status command test where practical
- startup matrix tests for valid and invalid feature-flag combinations
- safe summary tests for no raw env values
- admin/runbook command tests where commands are introduced

Manual hosted smoke:

- deploy API and worker to staging
- apply migrations
- register staging GitHub App settings
- install app into sandbox organization
- pair desktop
- bind installation to workspace
- enable target repository
- submit issue comment
- submit PR conversation comment
- submit check run if enabled
- remove installation and verify failure state
- rotate a non-production secret and verify recovery
- pause worker, enqueue action, resume worker, verify delayed dispatch
- disable actions gate, verify new requests fail safely and queued events remain
  recoverable

## Acceptance Criteria

- hosted API and worker can deploy from documented commands
- hosted mode fails fast without required secrets
- GitHub App registration settings are documented and reviewed
- staging GitHub App can complete install/claim/setup
- worker dispatches through outbox in staging
- required metrics and alerts are defined
- secret rotation runbooks exist for all critical secrets
- migration and rollback stance is documented
- no raw secret/content appears in health, logs, or diagnostics
- operational smoke passes before public beta
- documented startup matrix matches config validation behavior
- rollback procedure can pause new requests and worker dispatch independently
- staging proves API and worker run the same release revision

## Rollout

Recommended rollout:

1. staging hosted deployment
2. staging GitHub App private installation
3. internal desktop dogfood
4. limited trusted external testers
5. public GitHub App listing only after Phase 11 release gate

## Open Questions

Blockers before implementation:

- chosen hosting platform and secret manager
- production database provider
- operator access mechanism for admin/recovery workflows
- whether V1 needs webhook ingress in public beta or only setup/action flows

Non-blocking:

- multi-region topology
- separate GitHub integration service
- customer-managed keys
- enterprise BYO GitHub App

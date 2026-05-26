# Phase 5 - Workspace-Bound GitHub Installation Plan

## Purpose

Phase 5 connects a user's local Agent Teams workspace to the official hosted
GitHub App without giving GitHub secrets or installation tokens to Electron,
agents, or local runtimes.

The important product model is:

```text
Agent Teams Workspace
  -> authenticated DesktopClient
  -> GitHub setup session
  -> verified GitHub App installation
  -> repository availability snapshots
```

The GitHub account is not the owner of the integration. It is used as a
provider-side proof that the user is allowed to claim the installation for the
workspace.

## Summary

Phase 5 should prove identity and installation ownership only. It should not
make GitHub usable for agent side effects yet.

The implementation must answer four questions safely:

1. Which Agent Teams workspace is asking?
2. Which desktop client is authenticated for that workspace?
3. Which GitHub App installation was selected by the user?
4. Did GitHub prove that the authorizing user can access that installation and
   its repositories?

Everything else, including target enablement and agent actions, belongs to
later phases.

## Decision

Use workspace-bound installation ownership.

```text
🎯 10   🛡️ 10   🧠 7
~2500-4000 implementation lines
```

Why this is the right V1 shape:

- The integration survives desktop reinstall and multi-device usage.
- GitHub Apps are installed on users or organizations, not on one desktop.
- The workspace is the product boundary that later owns teams, agents, target
  bindings, billing, audit, and integration policy.
- A desktop client proves local Agent Teams possession only. It does not prove
  GitHub organization or repository authority.

Options:

- Workspace-bound installation  
  `🎯 10   🛡️ 10   🧠 7`  
  Approx changes: `2500-4000` lines.  
  Recommended. The workspace owns the integration; desktop clients initiate and
  poll; GitHub user authorization only proves provider authority.

- Desktop-bound installation  
  `🎯 5   🛡️ 7   🧠 5`  
  Approx changes: `1800-3000` lines.  
  Easier but wrong long-term. Reinstalling desktop, adding another machine, or
  rotating a client can make integration ownership ambiguous.

- GitHub-user-bound installation  
  `🎯 4   🛡️ 6   🧠 6`  
  Approx changes: `2200-3500` lines.  
  Misleading for organization installs, SAML, user departure, and repository
  access drift. The GitHub user should be proof, not ownership.

Rejected shortcuts:

- Installation-id-only binding: unsafe because GitHub setup URL input can be
  spoofed.
- Local-git-remote binding: unsafe because local remotes are hints, not
  provider authority.

## Scope

Phase 5 should implement:

- workspace bootstrap for users without a hosted account system yet
- desktop client registration, token hashing, revocation, and rotation
- desktop-side token storage contract and recovery behavior
- short-lived pairing codes for additional desktop clients
- authenticated desktop API boundary
- GitHub setup session lifecycle
- GitHub setup callback handling as pending claim only
- hosted GitHub claim OAuth state and PKCE lifecycle
- transient GitHub user access token exchange for authority verification
- binding a verified GitHub installation to a workspace
- safe audit events for setup, claim, bind, failure, expiry, and revocation
- repository availability snapshots after verification, but not target enablement

Phase 5 must not implement:

- posting GitHub comments, reviews, checks, statuses, or messages
- issuing installation access tokens for agent actions
- giving GitHub tokens to desktop, agents, or runtime subprocesses
- storing GitHub user access tokens or refresh tokens
- generic agent action dispatch
- target enablement policy beyond repository availability snapshots
- GitHub webhook side effects beyond accepting a future-compatible callback shape
- billing or entitlement enforcement beyond placeholder ports
- GitHub device flow or OAuth-during-install onboarding

## Current Understanding

The current control-plane already has:

- dependency-free shared primitives
- safe error contracts
- API request context and error boundary
- optional Postgres persistence
- transaction, audit, external content, outbox, lock, and worker foundations
- architecture guardrails that keep domain/application away from Nest, Prisma,
  platform adapters, and GitHub SDKs

Phase 5 should build on those foundations. It should use the Phase 4 transaction
port for state transitions and should not introduce a separate queue, cache,
session store, or broad auth framework.

## Risks And Weak Spots

- ⚠️ Setup URL `installation_id` looks official but is not authority.
- ⚠️ A public claim start URL using only `claimId` would be enumerable and would
  let attackers start OAuth flows for other pending claims.
- ⚠️ Direct GitHub installs without desktop state can create database spam if the
  callback stores canonical installation rows before verification.
- ⚠️ Pairing codes are usually lower entropy than API tokens, so hashing alone is
  not enough; they also need expiry, attempt limits, and atomic consume.
- ⚠️ GitHub OAuth code exchange is one-shot. If the process crashes after code
  exchange but before binding, the user must be able to restart from the pending
  claim safely.
- ⚠️ GitHub OAuth callback can return `error` instead of `code`, miss `state`,
  or arrive after the claim expired. These paths must not exchange codes or leak
  whether a state exists.
- ⚠️ Repository availability snapshots are easy to misuse as authorization. They
  must stay separate from Phase 6 target binding.
- ⚠️ Multi-workspace conflicts need a hard fail-closed rule. Silent transfer is
  a security bug, not a convenience feature.
- ⚠️ Hosted official-app setup must have kill switches because bad GitHub App
  registration or callback bugs could otherwise create invalid pending claims at
  scale.
- ⚠️ Large GitHub organizations can make repository snapshot sync expensive if
  claim verification tries to load all repositories synchronously without caps or
  pagination.
- ⚠️ Without a hosted account system, losing every desktop token means the user
  cannot prove workspace ownership. The plan must make this an explicit V1
  recovery limitation.
- ⚠️ Desktop tokens are bearer credentials. If Electron stores them in plaintext
  project files or logs, workspace takeover becomes possible.
- ⚠️ Hashing low-entropy pairing codes with plain SHA-256 is not enough if the
  database leaks; use a keyed hash/pepper or sufficiently high-entropy codes plus
  attempt limits.
- ⚠️ Cleanup jobs can cause data loss if they delete bootstrap-created workspaces
  while a browser setup callback or OAuth verification is still in flight.
- ⚠️ Public hosted pages can become open-redirect or CSRF surfaces if claim
  continuation is represented only by cookies or user-controlled `returnTo`
  parameters.

## GitHub Contract Facts

These facts were checked against official GitHub docs during planning and must
be re-checked during implementation before adding GitHub SDK dependencies.

- Public GitHub Apps can be shared via install URL.
- The install URL can include a `state` query parameter.
- The setup URL receives `installation_id`, but GitHub warns that this value can
  be spoofed and must not be trusted by itself.
- GitHub App setup URL can also redirect after installation updates if
  redirect-on-update is enabled. Phase 5 must not treat update callbacks as
  ownership authority.
- User access tokens for GitHub Apps are limited to resources both the user and
  the app can access.
- GitHub App user access tokens can be used to list installations and
  repositories accessible to the authenticated user.
- GitHub REST list endpoints are paginated. Repository verification must handle
  pagination and must not assume a single page contains the whole installation.
- GitHub App web OAuth supports `state`, exact `redirect_uri`, and PKCE with
  `S256`; `plain` PKCE challenge is not supported.
- GitHub web OAuth callback must abort when returned `state` does not match the
  started flow.
- GitHub App user access token exchange can return a refresh token when
  expiring user access tokens are enabled. Phase 5 must discard both access and
  refresh tokens after verification.
- GitHub device flow exists for desktop/headless apps, but it is not the Phase 5
  claim path because it would either expose user tokens to desktop or require a
  separate hosted broker polling design.
- If OAuth-during-install is enabled for a GitHub App registration, the setup
  URL is unavailable and GitHub redirects users to the callback URL instead.
- Installation access tokens are server-side credentials, expire after one hour,
  can be narrowed to repository ids and permissions, and must not be parsed by
  token length or token shape.
- The REST API is versioned. Implementation should send the configured
  `X-GitHub-Api-Version` header and should fail readiness if the configured
  version is absent in hosted modes.

## Credential Hashing Policy

Credential hashing is Phase 5 security-critical.

Recommended approach:

- high-entropy desktop bearer token: keyed HMAC-SHA-256 or SHA-256 with
  credential id lookup is acceptable only if the random secret has enough
  entropy
- low-entropy or user-entered pairing code: keyed HMAC-SHA-256 with a
  server-side pepper, short expiry, attempt limits, and safe lockout
- setup state, OAuth state, and claim continuation token: high-entropy random
  values hashed server-side, preferably with the same keyed hashing port

The existing Phase 4 encryption master key can derive a purpose-specific
credential hashing key through a crypto adapter. Do not reuse the raw master key
directly as the HMAC key.

Illustrative derivation labels:

```text
control-plane:desktop-token:v1
control-plane:pairing-code:v1
control-plane:setup-state:v1
control-plane:oauth-state:v1
control-plane:claim-continuation:v1
```

If the deployment has persistence enabled but no credential hashing key can be
derived or configured, Phase 5 credential/session features must fail fast.

References:

- https://docs.github.com/en/apps/sharing-github-apps/sharing-your-github-app
- https://docs.github.com/en/enterprise-cloud@latest/apps/creating-github-apps/registering-a-github-app/about-the-setup-url
- https://docs.github.com/en/enterprise-cloud@latest/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app
- https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app
- https://docs.github.com/en/apps/sharing-github-apps/registering-a-github-app-using-url-parameters
- https://docs.github.com/v3/apps/installations

## GitHub Claim Flow Decision

Use hosted web application OAuth after the setup callback creates a pending
claim.

Options:

- Hosted setup URL plus explicit claim OAuth  
  `🎯 9   🛡️ 9   🧠 7`  
  Approx changes: `700-1200` lines inside Phase 5.  
  Recommended. Keeps OAuth code exchange, client secret, PKCE verifier, user
  access token, and refresh token server-side. Desktop only starts setup and
  polls safe status.

- OAuth during GitHub App installation  
  `🎯 5   🛡️ 7   🧠 5`  
  Approx changes: `500-900` lines.  
  Not V1. It makes the setup URL unavailable, reduces callback URL control, and
  conflicts with the desktop-started setup-session model.

- Desktop/device flow claim  
  `🎯 6   🛡️ 6   🧠 6`  
  Approx changes: `600-1000` lines.  
  Not V1. It is viable for some CLI/headless flows, but would put GitHub user
  token handling near desktop or require a separate hosted broker polling design.

## Assumptions To Validate During Implementation

- GitHub App V1 registration has setup URL enabled and OAuth-during-install
  disabled.
- GitHub App V1 registration has redirect-on-update disabled, or the handler
  treats update callbacks as untrusted status pages only.
- Callback URL is configured exactly for the hosted OAuth callback route.
- The official hosted control-plane owns GitHub App private key and OAuth client
  secret custody.
- Phase 5 can add GitHub HTTP/SDK dependency only inside the GitHub
  infrastructure adapter and only after checking the latest stable package
  version.
- Product accepts bootstrap-created local workspaces before a hosted user
  account system exists.
- Product accepts that direct installs without desktop setup remain unclaimed
  until the user starts a verified claim flow from desktop or future dashboard.

## Deployment Mode Behavior

Phase 5 behavior must be explicit per existing control-plane mode:

- `local-disabled`  
  Desktop bootstrap and pairing may be used for local development only if the
  feature gates allow it. GitHub setup endpoints stay disabled by default.

- `hosted-official-app`  
  The official GitHub App setup flow is allowed only when hosted GitHub config,
  persistence, encryption, public base URL, setup gates, and OAuth claim gates
  are valid. Public base URL must be HTTPS in production.

- `self-hosted-byo-app`  
  The same workspace-bound model can apply, but the customer must own the GitHub
  App credentials. Phase 5 must not imply access to the official hosted GitHub
  App from self-hosted deployments.

Mode-specific config should fail fast. A disabled feature should return a safe
`authorization` or `validation` error, not a partially working flow.

## Bootstrap Policy

Phase 5 has to choose how the first workspace/client is created before a hosted
user account system exists.

Options:

- Temporary anonymous bootstrap with hard gates  
  `🎯 8   🛡️ 7   🧠 5`  
  Approx changes: `300-600` lines.  
  Recommended for Phase 5 only. Keep the endpoint narrow, rate-limited,
  kill-switchable, and unable to perform GitHub side effects until claim OAuth
  succeeds.

- Require hosted user account before bootstrap  
  `🎯 7   🛡️ 10   🧠 8`  
  Approx changes: `1500-3000` lines.  
  More secure, but it expands Phase 5 into account/session product work.

- Local-only bootstrap and no public hosted bootstrap  
  `🎯 6   🛡️ 9   🧠 4`  
  Approx changes: `200-400` lines.  
  Safer for internal development, but does not support the intended self-service
  official GitHub App flow.

Recommended Phase 5 policy:

- anonymous bootstrap is allowed only when
  `CONTROL_PLANE_DESKTOP_BOOTSTRAP_ENABLED=true`
- hosted deployments must apply IP/user-agent level rate limits at the API
  adapter or ingress boundary
- bootstrap creates only workspace/client credentials, never GitHub connection
  ownership
- abuse cleanup can delete empty workspaces that never start or complete a
  GitHub setup session
- public documentation must label this as a temporary pre-account bootstrap
  policy, not the final hosted account model

## Bounded Contexts

### workspace-identity

Owns workspaces and trusted desktop clients.

Entities:

- `Workspace`
- `DesktopClient`
- `DesktopClientCredential`
- `DesktopPairingSession`

Responsibilities:

- create a workspace for first local setup
- register the first desktop client
- authenticate desktop API requests
- rotate and revoke desktop credentials
- create and consume pairing sessions for additional clients
- expose workspace/client identity to application use cases

Does not know about GitHub, repositories, comments, or webhooks.

### integration-connections

Owns provider-neutral integration connection records.

Entities:

- `IntegrationConnection`
- `ProviderAccountSnapshot`
- `ProviderRepositoryAvailability`
- `ProviderRepositorySyncCursor`

Responsibilities:

- represent a provider installation bound to a workspace
- keep connection status independent from GitHub-specific implementation details
- expose safe connection state to desktop UI
- provide a stable anchor for Phase 6 target bindings and agent actions
- track repository snapshot sync status without turning availability into target
  authorization

Phase 5 should add only the minimal connection lifecycle. Capability mapping and
target enablement belong to Phase 6.

### github-installation-setup

Owns GitHub-specific setup and claim verification.

Entities:

- `GitHubSetupSession`
- `GitHubInstallationClaim`
- `GitHubOAuthClaimSession`
- `GitHubInstallationSnapshot`
- `GitHubRepositorySnapshot`

Responsibilities:

- generate the GitHub App install URL with opaque setup state
- receive GitHub setup callbacks
- treat `installation_id` as untrusted until verified
- create pending claims or untrusted unclaimed callback evidence
- run GitHub user authorization for claim verification
- ask GitHub provider ports whether the user can access the installation and
  repositories
- create or update an `IntegrationConnection` only after verification

Does not post comments and does not mint installation access tokens for agent
actions.

## Package Shape

```text
control-plane/
  packages/features/
    workspace-identity/
      src/domain/
      src/application/
      src/interface/nest/
      src/infrastructure/prisma/
    integration-connections/
      src/domain/
      src/application/
      src/interface/nest/
      src/infrastructure/prisma/
    github-installation-setup/
      src/domain/
      src/application/
      src/interface/nest/
      src/infrastructure/prisma/
      src/infrastructure/github/
  packages/platform/
    database/
    crypto/
    api/
```

Architecture rules:

- Domain and application code stay plain TypeScript.
- Nest controllers and providers live only in `interface/nest`.
- Prisma imports live only in infrastructure adapters.
- GitHub SDK imports live only in `github-installation-setup/infrastructure/github`.
- Cross-feature calls happen through small application ports, not direct
  repository imports.
- Shared kernel remains dependency-free.

## Core State Machines

### Desktop client

```text
registered
active
rotating
revoked
expired
```

Rules:

- credentials are stored as hashes server-side
- raw desktop tokens are high-entropy random values, not user-entered passwords
- raw desktop token is returned only once
- use a token id or prefix for lookup plus timing-safe hash comparison
- token rotation creates a new credential version and invalidates the old version
  after a grace window
- revoked clients cannot poll setup state or start setup sessions
- desktop display name is audit metadata, not authorization

Desktop storage contract:

- desktop stores the raw token only in OS-provided secure storage where
  available
- desktop does not write the token into project files, team logs, shell env dumps,
  crash reports, or agent prompts
- local dev fallback storage, if any, must be explicit, documented, and disabled
  for production builds
- if every desktop token for a workspace is lost before a hosted account system
  exists, Phase 5 has no recovery authority; user must create a new workspace and
  reconnect GitHub
- desktop token rotation should be initiated from an authenticated client and
  should return the replacement token once

### Pairing session

```text
created
consumed
expired
cancelled
```

Rules:

- pairing code is short-lived and single-use
- only a hashed pairing code is stored
- low-entropy user-entered codes require per-session attempt counters, IP/client
  throttling, and safe lockout
- use the credential hashing port with a server-side pepper/key, not plain
  SHA-256
- consuming a code is atomic
- consuming an expired or already consumed code returns a safe validation error
- pairing does not grant GitHub authority
- pairing start requires an already authenticated active desktop client

### GitHub setup session

```text
install_url_created
installation_callback_received
pending_claim
connected
failed
expired
cancelled
```

Rules:

- setup state is opaque, random, server-side, short-lived, and single-use
- setup state correlates the desktop-started flow, but does not prove GitHub
  authority
- setup callback with valid state creates a pending claim
- setup callback without valid state creates only an untrusted unclaimed callback
  record with short retention
- expired setup sessions cannot bind installations later
- connected state cannot be overwritten by stale callbacks

### GitHub claim OAuth session

```text
created
redirected
callback_received
verifying
verified
failed
expired
cancelled
```

Rules:

- OAuth state is independent from setup state
- OAuth state and PKCE verifier are short-lived and single-use
- PKCE uses `S256`; do not implement or accept `plain`
- OAuth session stores the expected redirect URI snapshot and code challenge
  method so callback handling can verify the exact flow that was started
- public claim start needs a non-enumerable claim continuation token or
  server-side hosted session; bare `claimId` is not authority
- if server-side hosted session uses cookies, it needs SameSite settings and CSRF
  protection; browser-cookie-free fallback should use a one-time continuation
  token in POST body
- callback `redirect_uri` must exactly match configured callback URL
- GitHub user access token is used transiently and discarded after verification
- GitHub refresh token, if returned, is discarded immediately and never persisted
- no OAuth code, PKCE verifier, user token, refresh token, or client secret is
  placed in desktop deep links or logs

## Data Model

Suggested tables:

```text
workspaces
desktop_clients
desktop_client_credentials
desktop_pairing_sessions
integration_connections
provider_account_snapshots
provider_repository_availability
provider_repository_sync_cursors
github_setup_sessions
github_installation_claims
github_oauth_claim_sessions
github_unclaimed_installation_callbacks
github_installation_snapshots
github_repository_snapshots
```

## Data Ownership

- `workspaces` are canonical for Agent Teams workspace ownership.
- `desktop_clients` and `desktop_client_credentials` are canonical for desktop
  API authentication.
- `github_setup_sessions` are canonical for desktop-started setup correlation.
- `github_installation_claims` are canonical for pending and verified provider
  authority claims.
- `integration_connections` are canonical for a verified provider installation
  bound to a workspace.
- `provider_account_snapshots` are display snapshots for verified provider
  accounts, not ownership.
- `provider_repository_availability` is derived from GitHub verification/sync and
  is not authorization.
- `provider_repository_sync_cursors` are operational progress state for large
  installations and are not user-visible authority.
- `github_unclaimed_installation_callbacks` are untrusted callback evidence, not
  canonical installation ownership.
- `github_installation_snapshots` and `github_repository_snapshots` are display
  and recovery snapshots after verification.

Do not duplicate a mutable "current workspace for installation" field in
GitHub-specific tables. The provider-neutral `integration_connections` table is
the ownership boundary.

### `workspaces`

Minimum fields:

- `id`
- `display_name`
- `status`
- `created_by_bootstrap_kind`
- `created_at`
- `updated_at`

V1 can create a workspace from desktop bootstrap. A future hosted user account
system can attach owners/members without changing GitHub installation ownership.

Suggested statuses:

```text
active
disabled
pending_cleanup
deleted
```

### `desktop_clients`

Minimum fields:

- `id`
- `workspace_id`
- `display_name`
- `status`
- `last_seen_at`
- `created_at`
- `revoked_at`

No hardware fingerprint should be used as authority.

Suggested statuses:

```text
active
rotating
revoked
expired
```

### `desktop_client_credentials`

Minimum fields:

- `id`
- `desktop_client_id`
- `token_hash`
- `lookup_prefix`
- `token_version`
- `status`
- `rotation_request_id`
- `rotated_from_credential_id`
- `created_at`
- `expires_at`
- `revoked_at`
- `last_used_at`

Rules:

- raw tokens never persist
- credential lookup should use a token prefix or credential id plus hash compare
- token hash comparison must be timing-safe

Suggested raw token shape:

```text
agtcp_<credentialId>_<randomSecret>
```

The exact prefix is not authority. It only allows efficient lookup. The
`randomSecret` must be high entropy and hashed server-side.

### `desktop_pairing_sessions`

Minimum fields:

- `id`
- `workspace_id`
- `requested_by_desktop_client_id`
- `pairing_code_hash`
- `status`
- `attempt_count`
- `max_attempts`
- `expires_at`
- `consumed_at`
- `consumed_by_desktop_client_id`
- `created_at`
- `failure_safe_error_json`

Rules:

- raw pairing code is shown once and never persisted
- consume is atomic and sets `consumed_at` and `consumed_by_desktop_client_id`
- invalid attempts increment safely without revealing whether a code exists
- lockout returns the same safe error shape as invalid/expired codes
- pairing code hash uses the credential hashing port, not plain SHA-256

### `integration_connections`

Minimum fields:

- `id`
- `workspace_id`
- `provider`
- `provider_connection_kind`
- `provider_installation_id`
- `status`
- `claimed_by_desktop_client_id`
- `created_at`
- `updated_at`
- `suspended_at`
- `deleted_at`

For GitHub V1:

- `provider = github`
- `provider_connection_kind = app_installation`
- `provider_installation_id = githubInstallationId`

Suggested statuses:

```text
active
suspended
deleted
```

Unique rule:

- one active GitHub installation can be bound to one workspace at a time
- cross-workspace transfer requires an explicit future transfer flow

### `provider_account_snapshots`

Minimum fields:

- `id`
- `integration_connection_id`
- `provider_account_id`
- `provider_account_kind`
- `display_login`
- `avatar_url`
- `last_verified_at`

Rules:

- immutable provider account id is authority; login/avatar are display snapshots
- snapshots are workspace-scoped and must not be used for cross-tenant lookup
- avatar URL is metadata, not a trusted local file path

### `provider_repository_availability`

Minimum fields:

- `id`
- `integration_connection_id`
- `provider_repository_id`
- `display_owner`
- `display_name`
- `display_full_name`
- `private`
- `archived`
- `available`
- `last_verified_at`

This table means "GitHub App can see this repository". It does not mean "agents
may act on this repository". Phase 6 target binding decides that.

### `provider_repository_sync_cursors`

Minimum fields:

- `id`
- `integration_connection_id`
- `provider`
- `cursor_kind`
- `cursor_value`
- `status`
- `started_at`
- `completed_at`
- `safe_error_json`

Rules:

- this is operational sync progress, not authority
- keep safe errors only
- final binding may store a bounded first page snapshot, then continue snapshot
  sync after binding if the installation is large
- Phase 5 still must not enqueue external side effects beyond internal
  repository snapshot sync

### `github_setup_sessions`

Minimum fields:

- `id`
- `workspace_id`
- `desktop_client_id`
- `setup_state_hash`
- `status`
- `github_installation_id`
- `expires_at`
- `consumed_at`
- `created_at`
- `updated_at`
- `failure_safe_error_json`

Rules:

- store only the hash of setup state
- `github_installation_id` stays provisional until claim verification
- setup sessions are listed only to authenticated desktop clients in the same
  workspace

### `github_installation_claims`

Minimum fields:

- `id`
- `workspace_id`
- `setup_session_id`
- `github_installation_id`
- `claim_continuation_token_hash`
- `claim_continuation_consumed_at`
- `status`
- `claim_authority_kind`
- `verified_github_user_id`
- `verified_github_login_snapshot`
- `verified_at`
- `created_at`
- `failure_safe_error_json`

Statuses:

```text
pending
verified
bound
failed
expired
```

### `github_oauth_claim_sessions`

Minimum fields:

- `id`
- `workspace_id`
- `desktop_client_id`
- `github_installation_claim_id`
- `oauth_state_hash`
- `pkce_verifier_ciphertext`
- `redirect_uri_snapshot`
- `code_challenge_method`
- `status`
- `provider_error_code`
- `expires_at`
- `consumed_at`
- `created_at`
- `failure_safe_error_json`

The PKCE verifier is secret-adjacent. Prefer envelope encryption or a dedicated
short-lived secret store. Do not log it.

Important implementation note:

- the existing Phase 4 envelope encryption port can encrypt arbitrary bytes and
  is suitable for short-lived PKCE verifier persistence when persistence and
  `CONTROL_PLANE_ENCRYPTION_MASTER_KEY` are enabled
- if crypto is disabled, hosted claim OAuth must fail fast instead of storing the
  verifier in plaintext

### `github_unclaimed_installation_callbacks`

Minimum fields:

- `id`
- `github_installation_id`
- `setup_state_present`
- `status`
- `first_seen_at`
- `last_seen_at`
- `expires_at`
- `safe_metadata_json`

Rules:

- this table is untrusted evidence only
- rows are short-retention and rate-limited
- these rows cannot create `IntegrationConnection`
- a later claim must pass the same GitHub user/installation/repository
  verification as the normal setup flow

### `github_installation_snapshots` and `github_repository_snapshots`

Minimum installation snapshot fields:

- `id`
- `integration_connection_id`
- `github_installation_id`
- `github_account_id`
- `github_account_login`
- `github_account_type`
- `repository_selection`
- `last_verified_at`

Minimum repository snapshot fields:

- `id`
- `integration_connection_id`
- `github_repository_id`
- `github_node_id`
- `display_full_name`
- `private`
- `archived`
- `last_verified_at`

Rules:

- snapshots are display/recovery data and do not replace
  `provider_repository_availability`
- immutable GitHub ids are authority; names and avatars are display only
- snapshot rows are updated only after provider verification or repository sync

### Required indexes and constraints

- unique active desktop credential by `desktop_client_id` and `token_version`
- unique credential lookup prefix or credential id
- unique unconsumed pairing code hash
- unique unconsumed setup state hash
- unique unconsumed OAuth state hash
- unique claim continuation token hash while unconsumed
- unique active connection by `(provider, provider_installation_id)` for statuses
  that can act as bound or pending-bound
- repository availability unique by
  `(integration_connection_id, provider_repository_id)`

Prisma may not express every partial unique index cleanly. Use explicit SQL
migrations where partial status-aware constraints are required.

## Application Use Cases

### `BootstrapWorkspaceUseCase`

Input:

- desktop display name
- optional local workspace label
- request context

Output:

- `workspaceId`
- `desktopClientId`
- raw desktop token returned once

Rules:

- creates a workspace and first active desktop client in one transaction
- allowed only when bootstrap feature gate and deployment policy allow it
- hosted mode must apply abuse controls before transaction work
- records safe audit event
- does not require GitHub
- returns raw desktop token once and never logs it

### `StartDesktopPairingUseCase`

Input:

- authenticated workspace actor
- requested client display name or empty

Output:

- pairing code shown once
- expiry timestamp

Rules:

- stores only pairing code hash
- revokes or expires previous active pairing sessions if product policy wants one
  active pairing at a time
- requires authenticated active desktop client
- records safe audit event without the raw pairing code

### `CompleteDesktopPairingUseCase`

Input:

- pairing code
- new desktop display name

Output:

- `workspaceId`
- `desktopClientId`
- raw desktop token returned once

Rules:

- consumes code atomically
- increments attempt counters for invalid tries without revealing whether a code
  exists
- rejects expired or consumed code
- records audit event

### `StartGitHubInstallationSetupUseCase`

Input:

- authenticated desktop client

Output:

- `setupSessionId`
- `installUrl`
- `expiresAt`

Rules:

- creates random setup state and stores only hash
- install URL uses `state`
- setup state expiry should be short, for example 15 minutes
- does not create an integration connection yet
- requires `hosted-official-app` or valid `self-hosted-byo-app` GitHub config
- fails safe when GitHub setup feature gate is disabled

### `HandleGitHubSetupCallbackUseCase`

Input:

- `state` from setup URL
- `installation_id` from setup URL
- request context

Output:

- hosted completion page model

Rules:

- if state is valid and unexpired, mark setup session as callback received and
  create pending claim
- if state is missing or invalid, create only an untrusted unclaimed callback
  record with short retention
- never bind from `installation_id` alone
- return a page asking the user to continue GitHub authorization
- callback handling is idempotent by setup state hash and installation id

### `StartGitHubClaimOAuthUseCase`

Input:

- pending claim id
- authenticated desktop client or hosted claim page correlation
- claim continuation token when started from a public hosted page

Output:

- GitHub OAuth authorization URL

Rules:

- creates OAuth state and PKCE verifier
- generates `S256` PKCE challenge only
- stores state hash and encrypted verifier
- stores expected redirect URI snapshot
- links OAuth session to pending claim
- rejects public starts that have only a bare claim id
- rejects untrusted `returnTo` or redirect parameters; completion navigation is
  server-owned
- does not expose secrets to desktop deep links

### `CompleteGitHubClaimOAuthUseCase`

Input:

- OAuth `code`
- OAuth `state`
- request context

Output:

- claim verification result

Rules:

- validates OAuth state and expiry
- atomically moves OAuth session to `callback_received` or `verifying` before
  exchanging code
- handles `error`, missing `code`, missing `state`, and duplicate query
  parameters as safe callback failures without exchanging a code
- re-checks linked claim/setup status before exchanging the code; expired,
  cancelled, failed, or already-bound claims do not consume provider tokens
- exchanges code server-side outside long DB transactions
- uses user token only inside the use case or provider adapter call
- discards both user access token and refresh token if GitHub returns both
- verifies the user can access the target installation and selected repositories
- discards user token even on verification failure
- creates or updates `IntegrationConnection` in a short final transaction
- stores a bounded verified repository availability snapshot in the same final
  transaction
- records sync cursor state if repository pagination is not fully exhausted
- records safe audit event
- if exchange or verification fails after consuming OAuth state, leaves the
  installation claim restartable from a new OAuth session
- stores only safe provider error code/category, not `error_description`, raw
  query string, provider response body, OAuth code, or tokens

Large installation rule:

- claim verification must prove the target installation is accessible before
  binding
- repository availability can be partial at first when GitHub pagination is large
- status responses must expose safe `repositorySyncStatus`
- Phase 6 target binding must re-verify a target repository if snapshot sync is
  incomplete or stale

### `GetGitHubSetupStatusUseCase`

Input:

- authenticated desktop client
- setup session id

Output:

- safe setup status
- connected connection id when available
- safe failure code when failed

Rules:

- does not expose OAuth state, setup state, GitHub tokens, or raw provider errors
- supports desktop restart by listing active setup sessions for workspace/client

## Ports

### Application ports

```ts
export interface WorkspaceRepository {
  create(input: CreateWorkspaceInput): Promise<Workspace>;
  findById(id: WorkspaceId): Promise<Workspace | undefined>;
}

export interface DesktopClientAuthenticator {
  authenticate(input: AuthenticateDesktopClientInput): Promise<DesktopClientAuthResult>;
}

export interface DesktopCredentialIssuer {
  issue(input: IssueDesktopCredentialInput): Promise<IssuedDesktopCredential>;
  rotate(input: RotateDesktopCredentialInput): Promise<IssuedDesktopCredential>;
  revoke(input: RevokeDesktopCredentialInput): Promise<void>;
}

export interface CredentialHasher {
  hash(input: HashCredentialInput): Promise<CredentialHash>;
  verify(input: VerifyCredentialHashInput): Promise<boolean>;
}

export interface FeatureGatePolicy {
  assertEnabled(input: AssertFeatureEnabledInput): Promise<void>;
}

export interface AbuseControlPolicy {
  assertAllowed(input: AssertAbuseControlInput): Promise<void>;
}

export interface IntegrationConnectionRepository {
  bindVerifiedInstallation(
    input: BindVerifiedInstallationInput,
  ): Promise<IntegrationConnection>;
}

export interface GitHubClaimAuthorityVerifier {
  verifyInstallationClaim(
    input: VerifyGitHubInstallationClaimInput,
  ): Promise<GitHubInstallationClaimVerification>;
}

export interface ProviderRepositoryAvailabilitySync {
  syncNextPage(
    input: SyncProviderRepositoryAvailabilityInput,
  ): Promise<SyncProviderRepositoryAvailabilityResult>;
}

export interface GitHubUserTokenExchange {
  exchangeCode(input: ExchangeGitHubOAuthCodeInput): Promise<TransientGitHubUserToken>;
}
```

Illustrative desktop auth result:

```ts
export type DesktopClientAuthResult =
  | {
      kind: "authenticated";
      workspaceId: WorkspaceId;
      desktopClientId: DesktopClientId;
      credentialId: string;
    }
  | {
      kind: "rejected";
      safeError: SafeError;
    };
```

Illustrative verification result shape:

```ts
export type GitHubInstallationClaimVerification =
  | {
      kind: "verified";
      githubInstallationId: string;
      account: {
        id: string;
        login: string;
        type: "User" | "Organization";
      };
      repositories: readonly {
        githubRepositoryId: string;
        owner: string;
        name: string;
        fullName: string;
        private: boolean;
        archived: boolean;
      }[];
      repositorySync: {
        complete: boolean;
        nextCursor?: string;
      };
    }
  | {
      kind: "rejected";
      safeError: SafeError;
    };
```

The GitHub adapter should prove claim authority with user-token endpoints such
as listing installations accessible to the user and repositories accessible
inside the target installation. Exact endpoint usage must be confirmed during
implementation against the current official docs.

### Infrastructure adapters

- Prisma repositories for workspace, desktop, setup sessions, and connections.
- Crypto adapter for keyed credential hashing, timing-safe comparison, setup
  state hashing, OAuth state hashing, claim continuation hashing, and PKCE
  verifier encryption.
- Abuse-control adapter backed by ingress/WAF metadata, in-memory local
  development limits, or a future external rate-limit service.
- GitHub HTTP/SDK adapter for OAuth code exchange and claim authority checks.
- API adapter for desktop auth guards, safe error mapping, and request context.

## Authority Checks

A claim can bind only when all checks pass:

```text
authenticated desktop client belongs to workspace
desktop client credential is active and not expired
setup session belongs to workspace/client
setup session is active and unexpired
setup callback installation_id matches pending claim
OAuth session belongs to pending claim
OAuth claim feature gate is enabled at start time
GitHub user token can list or access the installation
GitHub user token can access selected repositories inside that installation
provider installation is not already bound to another active workspace
connection status is not deleted or suspended
```

Final binding must happen in one transaction:

```text
re-read pending claim with lock
check claim is still pending/verified for the same workspace
check installation is not actively bound to another workspace
upsert integration connection
upsert repository availability snapshots
upsert repository sync cursor if verification is partial
mark claim bound
write safe audit event
```

No GitHub HTTP call should run inside this transaction.

Forbidden authority sources:

- `installation_id` alone
- GitHub owner/repo display name
- local git remote URL
- branch name
- PR URL
- desktop client identity alone
- agent identity
- agent-authored markdown

## Failure Modes

- Missing GitHub hosted config: hosted setup endpoints fail fast with safe
  configuration error.
- Bootstrap disabled or rate limited: public bootstrap fails before creating a
  workspace.
- OAuth-during-install callback without setup session: callback cannot bind and
  should tell the user to restart setup.
- OAuth callback returns `error` or no `code`: OAuth session fails safely if
  state is valid; no code exchange is attempted.
- OAuth callback state is missing or unknown: return generic safe failure,
  rate-limit the source, and do not reveal whether a claim exists.
- Setup URL callback arrives from installation update: do not create or transfer
  ownership; already-bound installation sync belongs to Phase 8 runtime/webhook
  handling.
- GitHub OAuth code exchange fails: OAuth session fails safely; pending claim can
  start a new OAuth session.
- GitHub API verification fails transiently: claim remains pending or failed
  with retryable safe code; no connection is created.
- GitHub API returns inaccessible installation/repository: claim fails closed;
  no repository availability is stored as enabled.
- GitHub repository pagination exceeds callback budget: bind only after
  installation authority is proven, store partial repository availability, and
  continue safe snapshot sync separately.
- DB conflict on active installation binding: fail closed with conflict safe
  error; no silent transfer.
- Desktop token revoked during setup: desktop polling and continuation stop, but
  already opened public callback pages still cannot bind without valid claim
  continuation and OAuth verification.
- Process crashes after OAuth code exchange: user token is lost by design; user
  restarts claim from pending setup.
- Desktop secure storage unavailable: production desktop must fail closed or ask
  for explicit insecure local-dev mode rather than silently writing plaintext
  tokens.
- All desktop credentials revoked or lost before hosted accounts exist: workspace
  is unrecoverable in Phase 5; reconnect through a new workspace.
- Cleanup job sees an empty bootstrap workspace while setup is active: cleanup
  must re-check active clients, setup sessions, pending claims, and connections
  in one transaction before marking anything `pending_cleanup`.

## API Surface

Desktop API:

```text
POST /api/desktop/v1/workspaces/bootstrap
GET  /api/desktop/v1/me
POST /api/desktop/v1/pairing/start
POST /api/desktop/v1/pairing/complete
POST /api/desktop/v1/integrations/github/setup/start
GET  /api/desktop/v1/integrations/github/setup/:setupSessionId
GET  /api/desktop/v1/integrations/github/connections
POST /api/desktop/v1/clients/:desktopClientId/rotate-token
POST /api/desktop/v1/clients/:desktopClientId/revoke
```

Hosted public setup/OAuth API:

```text
GET /api/public/github/setup
POST /api/public/github/claim/:claimId/start
GET /api/public/github/oauth/callback
```

Notes:

- public routes never return secrets
- workspace bootstrap is unauthenticated but feature-gated, rate-limited, and
  unable to create GitHub ownership
- pairing complete authenticates through the single-use pairing code
- all other desktop routes require desktop client token
- desktop bearer token should use `Authorization: Bearer <token>` and never query
  params
- auth guard must reject bearer tokens in query params even though the current
  request logger strips query strings, because upstream access logs might not
- hosted callback pages may render human-readable state, but machine state is
  stored server-side
- public claim start creates an OAuth session, so use POST and require a claim
  continuation token in POST body or a server-side hosted session, not a bare
  claim id
- OAuth callback handles must sanitize query input before logging or audit; raw
  callback query strings are forbidden metadata
- if using hosted cookies for claim continuation, add CSRF protection; do not
  rely on cookies alone as authority
- public completion pages must not redirect to arbitrary user-provided URLs

## Security And Privacy Rules

- Store only hashes of desktop tokens, pairing codes, setup state, and OAuth
  state.
- Raw desktop token exists only in the one-time API response and desktop secure
  storage.
- GitHub private key and OAuth client secret stay server-side only.
- GitHub user access token is transient and not persisted in V1.
- GitHub refresh token is not stored in V1.
- Installation access tokens are not part of Phase 5.
- Safe audit metadata may include immutable ids and display snapshots, not raw
  tokens, OAuth codes, PKCE verifiers, or provider response bodies.
- Safe audit metadata for OAuth failures may include normalized provider error
  code only, not `error_description` or raw callback query.
- Setup and OAuth sessions expire quickly and are single-use.
- Repository names are display snapshots. `githubRepositoryId` is authority.
- Installation id is an external immutable id only after provider verification.

## Abuse Control Requirements

Phase 5 adds public routes before hosted accounts exist, so abuse controls are
part of the foundation and not an optional production polish item.

Required controls:

- bootstrap: rate-limit by IP and coarse user-agent before transaction writes
- pairing complete: rate-limit by workspace, pairing session, and IP/client
  context
- setup callback: rate-limit invalid/missing-state callbacks before storing
  untrusted evidence
- claim start: rate-limit by claim id, workspace, continuation token hash, and
  IP/client context
- OAuth callback: rate-limit invalid state attempts and avoid storing raw query
  strings
- cleanup: expire empty bootstrap workspaces and unclaimed callback evidence with
  short retention

Implementation shape:

- expose abuse checks as application-facing ports so domain/application do not
  import a specific rate-limit library
- hosted deployments may satisfy the port with ingress/WAF metadata plus a local
  adapter; local-disabled mode may use no-op or in-memory adapters behind
  feature gates
- rate-limit failures return safe public errors and do not reveal whether a
  claim, pairing code, or OAuth state exists

## Observability

Use safe structured logs and audit events only. Useful events:

- `workspace_bootstrapped`
- `desktop_client_pairing_started`
- `desktop_client_pairing_completed`
- `github_setup_started`
- `github_setup_callback_received`
- `github_setup_unclaimed_callback_received`
- `github_claim_oauth_started`
- `github_claim_verified`
- `github_installation_bound`
- `github_repository_availability_sync_started`
- `github_repository_availability_sync_completed`
- `github_claim_failed`
- `github_setup_expired`

Safe metadata may include workspace id, desktop client id, setup session id,
claim id, GitHub installation id after callback, GitHub account id/login
snapshot after verification, safe error code, and repository counts. It must not
include tokens, codes, PKCE verifier, raw provider responses, request bodies, or
repository content.

The current platform logger redacts sensitive metadata keys and request logging
stores sanitized paths only. Phase 5 code must still avoid passing raw tokens as
values under non-sensitive key names such as `value`, `id`, or `message`.

## Rollback / Kill Switch

Add narrow config gates:

```text
CONTROL_PLANE_DESKTOP_BOOTSTRAP_ENABLED
CONTROL_PLANE_DESKTOP_PAIRING_ENABLED
CONTROL_PLANE_GITHUB_SETUP_ENABLED
CONTROL_PLANE_GITHUB_CLAIM_OAUTH_ENABLED
CONTROL_PLANE_GITHUB_UNCLAIMED_CALLBACK_RECORDING_ENABLED
```

Expected behavior:

- disabling desktop bootstrap does not revoke existing desktop clients
- disabling pairing blocks new clients only
- disabling GitHub setup blocks new setup sessions and public setup callbacks
  from creating pending claims
- disabling claim OAuth blocks new OAuth sessions but keeps status polling
  available
- disabling unclaimed callback recording ignores invalid/no-state callbacks after
  safe logging and rate limiting
- existing bound connections remain readable but Phase 5 still has no external
  side effects to pause

## Idempotency And Concurrency

- Starting setup multiple times creates independent setup sessions.
- Completing the same setup callback twice returns the existing pending claim or
  connected status.
- OAuth callback is single-use by state hash and consumes atomically.
- Credential rotation is idempotent by rotation request id if the desktop retries
  after a timeout.
- Binding the same verified installation to the same workspace is idempotent.
- Binding the same installation to another workspace fails until an explicit
  transfer flow exists.
- Repository availability snapshot sync is upsert-by-immutable-repository-id.
- Repository availability sync is resumable by cursor and safe to retry.
- Expiry workers should mark stale setup, pairing, and OAuth sessions expired.
- Cleanup workers must use a two-step `pending_cleanup` then `deleted` flow with
  a grace window, and must re-check no active setup/claim/connection exists
  before final deletion.

## Edge Cases

- User installs the app directly from GitHub without desktop setup state.
- User starts setup in desktop A and finishes from browser logged into a
  different GitHub account.
- GitHub callback arrives twice.
- GitHub callback has spoofed `installation_id`.
- GitHub setup URL callback arrives after an installation update rather than a
  fresh install.
- OAuth callback arrives after setup session expired.
- OAuth callback arrives with `error=access_denied`, missing `code`, missing
  `state`, or duplicate query params.
- User does not have permission to claim organization installation.
- Organization SAML hides repositories until user starts SAML session.
- Installation is already bound to another workspace.
- User grants all repositories, but Agent Teams should enable none by default.
- Repository is renamed during setup.
- Repository is removed from installation before claim completion.
- Desktop token is revoked while setup is in progress.
- User reinstalls desktop and wants to reconnect to existing workspace.
- User loses every desktop token before account-based recovery exists.
- Hosted bootstrap endpoint is abused to create many empty workspaces.
- Desktop secure storage is unavailable or permission-denied.
- Browser blocks cookies. OAuth state must still be server-side session-safe.
- Hosted claim page receives malicious `returnTo` or open-redirect input.
- GitHub API is down during claim verification.
- GitHub returns a refresh token during claim OAuth exchange.
- GitHub repository list pagination returns partial pages or rate limits during
  availability sync.

## Implementation Sequence

### Step 1 - Workspace and desktop identity

Deliver:

- workspace tables and repositories
- desktop client tables and repositories
- credential hashing port and infrastructure adapter
- token hashing and authentication guard
- feature gates for bootstrap and pairing
- workspace bootstrap endpoint
- unit tests for token hashing, authentication, revoke, rotate

Acceptance:

- desktop can bootstrap a workspace
- desktop token is returned once
- desktop and pairing credentials are hashed through the credential hashing port
- bootstrap disabled or rate limited does not create a workspace
- invalid/revoked token gets safe unauthorized error
- desktop token is documented as OS secure-storage only on the client side

### Step 2 - Pairing sessions

Deliver:

- pairing session aggregate
- start and complete pairing use cases
- single-use atomic consume query
- attempt limit and safe lockout
- expiry handling

Acceptance:

- pairing code expires
- pairing code cannot be reused
- invalid pairing attempts do not reveal whether a code exists
- second client gets its own desktop token

### Step 3 - Integration connection skeleton

Deliver:

- provider-neutral connection table
- repository availability table
- connection repository port
- safe desktop connection listing endpoint

Acceptance:

- no GitHub-specific application code depends on desktop internals
- no target binding or agent action is introduced yet

### Step 4 - GitHub setup session

Deliver:

- setup session aggregate
- start setup endpoint
- install URL generation with `state`
- setup callback route
- pending claim records and untrusted unclaimed callback evidence

Acceptance:

- valid state creates pending claim
- invalid or missing state creates untrusted unclaimed callback evidence only
- `installation_id` alone never binds

### Step 5 - Claim OAuth

Deliver:

- claim OAuth session aggregate
- `S256` PKCE and OAuth state storage
- OAuth start and callback routes
- transient user token exchange port
- fake GitHub adapter tests plus integration adapter behind config

Acceptance:

- OAuth state is single-use
- PKCE verifier is not logged or returned
- public claim start rejects bare claim id
- user token is discarded after verification
- refresh token, if returned, is not persisted

### Step 6 - Provider authority verification and binding

Deliver:

- GitHub claim verifier port and adapter
- installation/repository authority checks
- workspace binding transaction
- repository availability snapshots
- repository availability sync cursor for large installations
- safe audit events

Acceptance:

- verified install binds to workspace
- unauthorized user cannot bind install
- same installation cannot bind to a second workspace
- selected repositories are snapshots only, not enabled targets
- large installations do not require loading every repository inside OAuth
  callback
- GitHub HTTP calls happen outside final DB binding transaction

### Step 7 - Expiry, recovery, and operational polish

Deliver:

- cleanup/expiry worker for pairing/setup/OAuth sessions
- safe cleanup for empty bootstrap-created workspaces with two-step delete
- admin-safe logs and audit summaries
- runbook section for stuck setup sessions
- kill-switch configuration and safe disabled behavior
- final architecture guardrails and verification commands

Acceptance:

- stale sessions expire deterministically
- cleanup does not delete workspaces with active setup sessions, pending claims,
  active clients, or bound connections
- setup status remains resumable after desktop restart
- no secret appears in logs, API responses, audit, or dead-letter payloads

### Step 8 - Guarded rollout

Deliver:

- migrations deployed before feature gates are enabled
- production default gates disabled until smoke checks pass
- hosted readiness confirms GitHub config, persistence, encryption, credential
  hashing, public base URL, and REST API version

Acceptance:

- enabling bootstrap does not enable GitHub setup automatically
- enabling GitHub setup does not enable OAuth claim automatically
- rollback can disable new flows without deleting existing data

## Test Plan

Unit tests:

- workspace bootstrap creates workspace and first desktop client atomically
- workspace bootstrap gate rejects disabled/rate-limited requests before writes
- abuse-control policy is called before public bootstrap, invalid setup
  callback persistence, public claim start, and pairing complete writes
- credential hasher uses purpose-separated keyed hashing and timing-safe verify
- desktop token hash verify succeeds and rejects wrong tokens
- revoked desktop token is rejected
- expired desktop credential is rejected
- token rotation invalidates old token after grace policy
- token rotation retry with the same rotation request id returns stable result
- pairing attempt limit locks out brute-force attempts safely
- pairing code hashing does not use unsalted/plain SHA-256
- pairing code is single-use and expires
- setup state hash lookup rejects wrong or expired state
- setup callback with invalid state creates untrusted callback evidence only
- setup callback replay returns stable result without duplicating claims
- setup callback from installation update cannot transfer or create ownership
- OAuth start creates `S256` challenge and never uses `plain`
- OAuth callback with provider `error` does not exchange a code
- OAuth callback with missing/unknown state does not reveal claim existence
- OAuth state is single-use and expires
- public claim start rejects bare claim id without continuation token
- PKCE verifier is encrypted or stored through secret adapter
- GitHub refresh token response is discarded and not persisted
- OAuth code exchange failure leaves claim restartable
- process-crash-style verification failure does not bind connection
- provider verification rejects mismatched installation id
- provider verification rejects inaccessible repositories
- provider verification handles paginated repository lists
- partial repository availability sync is resumable
- binding same installation to same workspace is idempotent
- binding same installation to another workspace fails safely

API tests:

- bootstrap route never logs or returns desktop token except in success body
- desktop routes require desktop token
- desktop auth rejects token in query params if such compatibility is ever
  proposed
- auth and audit paths never pass raw bearer token under generic metadata keys
- public setup route never returns secrets
- public claim start requires CSRF protection when hosted cookies are used
- public claim start rejects untrusted redirect/return targets
- OAuth callback logging/audit never stores raw query string or
  `error_description`
- public abuse-control failures return safe errors without confirming resource
  existence
- setup status response is safe and resumable
- error responses use public safe error contract

Database tests:

- workspace bootstrap transaction does not leave orphan clients on failure
- cleanup does not mark workspace pending when active setup or claim exists
- cleanup final delete re-checks active clients, claims, setup sessions, and
  connections
- atomic pairing code consume
- atomic OAuth state consume
- unique active installation binding
- same installation cannot be active in two workspaces under concurrent claims
- repository availability upsert by immutable repository id
- repository sync cursor updates are idempotent
- stale session expiry query

Architecture tests:

- domain/application do not import Nest, Prisma, GitHub SDKs, or platform HTTP
- workspace-identity does not import integration-connections or GitHub setup
- GitHub SDK imports are restricted to infrastructure adapter
- desktop identity feature does not import GitHub feature
- GitHub setup feature depends on integration-connections only through public
  application ports
- abuse-control implementations stay in adapters; domain/application depend only
  on the abuse-control port
- shared kernel stays dependency-free

Readiness/config tests:

- hosted mode fails without public base URL, persistence, encryption, GitHub
  config, credential hashing readiness, or REST API version
- hosted production mode rejects non-HTTPS public base URL
- feature gates are present in safe config summary as booleans only, never secret
  values

Manual smoke:

```text
pnpm --dir control-plane verify:phase1
pnpm --dir control-plane test:db
pnpm --dir control-plane api:smoke
```

Later real GitHub smoke, only with explicit hosted test app credentials:

```text
CONTROL_PLANE_MODE=hosted-official-app
CONTROL_PLANE_GITHUB_APP_ID=...
CONTROL_PLANE_GITHUB_APP_SLUG=...
CONTROL_PLANE_GITHUB_PRIVATE_KEY=...
CONTROL_PLANE_GITHUB_REST_API_VERSION=...
CONTROL_PLANE_GITHUB_OAUTH_CLIENT_ID=...
CONTROL_PLANE_GITHUB_OAUTH_CLIENT_SECRET=...
CONTROL_PLANE_GITHUB_WEBHOOK_SECRET=...
```

## Acceptance Criteria

- A fresh desktop can bootstrap a workspace and authenticate to the control
  plane.
- Bootstrap is feature-gated and abuse controls can reject requests before any
  workspace row is created.
- Credential hashing is keyed, purpose-separated, and used for desktop tokens,
  pairing codes, setup state, OAuth state, and claim continuation tokens.
- A second desktop can pair into the workspace through a short-lived single-use
  code.
- Desktop credential storage contract is documented: server stores hashes,
  desktop stores raw token only in OS secure storage.
- An authenticated desktop can start GitHub App setup and receive an install URL.
- GitHub setup callback creates a pending claim or untrusted callback evidence
  safely.
- GitHub OAuth claim verifies user/installation/repository authority.
- GitHub OAuth claim uses `S256` PKCE and exact redirect URI validation.
- GitHub user access token and refresh token are never persisted.
- A verified GitHub App installation is bound to exactly one workspace.
- Repository availability snapshots use immutable GitHub repository ids.
- Large-installation repository sync can be partial and resumable without
  granting target authorization.
- Unclaimed setup callbacks are short-retention evidence and cannot create
  integration ownership.
- Public claim start cannot proceed from a bare enumerable claim id.
- Public claim pages cannot redirect to arbitrary user-provided URLs.
- Kill switches can stop new setup/claim flows without breaking existing desktop
  status reads.
- Cleanup cannot delete a workspace with active clients, setup sessions, pending
  claims, or bound connections.
- Losing all desktop credentials is documented as unrecoverable in Phase 5
  before a hosted account recovery model exists.
- No agent action, GitHub comment, webhook side effect, or installation token
  issuance exists yet.
- No secrets or raw provider payloads are stored in audit, outbox, logs, or API
  responses.

## Main Risks

- Treating `installation_id` as trusted because it arrived from GitHub setup URL.
- Binding to desktop client instead of workspace.
- Accidentally storing GitHub user tokens "temporarily" without a retention ADR.
- Confusing repository availability with agent target enablement.
- Letting public claim URLs use enumerable ids as authority.
- Creating canonical installation rows from unverified direct-install callbacks.
- Running GitHub API calls inside DB transactions.
- Letting GitHub-specific types leak into generic action architecture.
- Making Phase 5 too broad by adding comments/webhooks before identity is proven.
- Leaving bootstrap public without rate limits, cleanup, or a kill switch.
- Letting Electron persist desktop bearer tokens in plaintext files.
- Using low-entropy pairing codes with plain hashes.
- Cleanup deleting a workspace while browser/OAuth flow is still active.

## Next Phase Boundary

Phase 6 should start only after Phase 5 proves:

- workspace and desktop identity are stable
- integration connection exists without GitHub comments
- repository availability snapshots are authority-safe
- GitHub installation claim is provider-verified
- desktop polling can recover from restart

Phase 6 can then add generic target binding, capability authorization, and agent
action request creation on top of this foundation.

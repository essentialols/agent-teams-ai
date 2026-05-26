# Edge Cases And Failure Modes

## Purpose

This document lists edge cases the control-plane architecture must handle before GitHub or messenger integrations are considered production-ready.

## Global Edge Cases

### Duplicate Requests

Problem:

- desktop retries
- agent retries a tool call
- network timeout hides success
- worker restarts during side effect

Required behavior:

- every external action has idempotency key
- API returns existing action when safe
- worker checks persisted state before side effect
- connector-specific hidden markers prevent duplicate public comments/messages

### Partial Success

Problem:

- GitHub comment succeeds
- DB update fails
- worker retries and may post duplicate
- encrypted external action content may already be scheduled for deletion

Required behavior:

- use hidden marker for GitHub comments
- worker recovery searches external target for marker before posting
- side-effect result update is idempotent
- audit can record recovered external result
- content deletion/shredding happens only after result metadata is safely recorded

### Out-Of-Order Events

Problem:

- GitHub webhook events can arrive out of order
- Telegram updates can be delayed or retried

Required behavior:

- event handlers tolerate missing current state
- sync jobs re-fetch source of truth when needed
- event version and received timestamp are persisted
- jobs are idempotent

### Poison Jobs

Problem:

- job payload version unsupported
- external permission permanently denied
- target deleted
- repeated validation failure

Required behavior:

- max attempts
- safe dead-letter summary
- manual retry after authorized operator action
- retry does not mutate payload
- permanent failures are user-visible where appropriate

### External Action Content Retention Expires Before Retry

Problem:

- GitHub outage or repeated provider failures outlast encrypted content retention window
- worker can no longer reconstruct the original comment body

Required behavior:

- action moves to terminal expired-content state
- no best-effort regenerated body is posted
- user/agent must submit a new action
- audit stores safe summary, content hash, and expiry reason

### External Action Content Hash Mismatch

Required behavior:

- worker refuses to dispatch
- action moves to safe failure/dead-letter state
- security signal is emitted with correlation id
- raw content is not logged

### External Action Content Decryption Fails

Problem:

- key-encryption key unavailable
- encrypted data encryption key missing
- ciphertext corrupted
- key rotation left content in an unreadable state

Required behavior:

- worker refuses to dispatch
- action moves to retryable crypto-unavailable state or terminal unrecoverable state depending on cause
- no regenerated/best-effort comment is posted
- logs include safe correlation id and key id, not plaintext key/content

### Crypto Shred Before Result Persistence

Problem:

- worker posts comment successfully
- encrypted content key is deleted before result metadata is committed
- recovery cannot prove whether comment was posted

Required behavior:

- result metadata commit happens before content key deletion
- content shredding is a separate idempotent cleanup step
- recovery can still search by marker/comment id if cleanup partially ran

### Key Rotation During Pending Dispatch

Required behavior:

- active content remains decryptable through old key id until rewrapped or expired
- rotation does not mutate outbox payload
- failed rewrap does not delete old encrypted key material
- metrics expose pending content by key version without revealing content

## GitHub Edge Cases

### Installation Started Without Desktop State

Problem:

- user installs the GitHub App directly from GitHub Marketplace/App page
- callback has installation id but no trusted workspace binding

Required behavior:

- installation is stored as unclaimed or ignored safely
- no repository action is allowed
- user must claim/bind installation from paired desktop or future dashboard
- audit/logs contain safe setup summary only

### Spoofed Setup URL Installation Id

Problem:

- GitHub setup URL includes `installation_id`
- an attacker can call the setup URL manually with a spoofed `installation_id`
- opaque setup state correlates a setup attempt but does not prove GitHub
  org/repo authority by itself

Required behavior:

- setup URL handler never binds installation from `installation_id` alone
- setup state creates only pending claim
- claim completion verifies GitHub-side user/installation/repository access
- failed verification leaves installation unclaimed and records safe audit

### GitHub User Authorization Revoked During Claim

Required behavior:

- claim fails safely
- user can restart claim flow
- no repository target is bound
- transient user token is discarded

### OAuth-During-Install Enabled By Mistake

Problem:

- GitHub App is configured to request OAuth during installation
- GitHub redirects to callback URL instead of setup URL
- desktop-started setup state may never reach the expected setup callback

Required behavior:

- hosted config/readiness detects unsupported registration mode where possible
- docs make OAuth-during-install a separate future ADR, not V1 default
- callback-only flow cannot bind installation unless it passes the same claim authority checks

### OAuth Claim Callback Failure

Required behavior:

- callback fails safe on state mismatch, missing state, provider `error`,
  missing code, or duplicate query parameters
- GitHub authorization code is not exchanged unless state and claim/session are
  valid
- pending claim remains pending or expires
- user can restart claim flow
- no token-like values, raw query strings, or provider `error_description`
  values are logged

### Device Flow Polling Too Fast

Problem:

- GitHub device flow returns an `interval`
- polling faster can trigger `slow_down` and rate-limit behavior

Required behavior:

- device flow is optional/future for V1
- polling respects provider interval
- `slow_down`, expired code, denied access, and disabled device flow map to stable safe codes

### Desktop Restart During Setup

Required behavior:

- desktop can list active setup sessions after restart
- user sees current state instead of starting duplicate setup by accident
- expired sessions show restart guidance
- no local-only memory is required for correctness

### Stale Browser Tab Completes Old Setup

Problem:

- user starts setup twice
- old browser tab finishes after newer setup session exists

Required behavior:

- setup session id and state are single-use
- expired/cancelled sessions cannot bind installation
- completing old setup does not overwrite newer connected state
- audit records safe stale-completion attempt

### Hosted Completion Deep Link Leaks Secret

Required behavior:

- completion page and deep links include only non-secret correlation data
- OAuth code, PKCE verifier, desktop token, GitHub token, and client secret are never placed in URL fragments/query for desktop
- desktop polls authenticated API for final state

### GitHub SAML SSO Blocks Claim Visibility

Problem:

- GitHub user authorized the app but org resources are hidden until active SAML SSO session exists

Required behavior:

- claim verification fails with stable safe code
- user sees guidance to start SAML SSO and retry
- no repository target is bound until verification passes

### Setup State Expired Or Replayed

Required behavior:

- callback fails safe
- setup state is single-use
- already consumed state cannot bind another installation
- repeated callback returns stable result without duplicating bindings
- expired/replayed state cannot create a pending claim

### Repository Already Bound To Another Workspace

Required behavior:

- action fails closed
- install/sync does not silently transfer repository ownership
- future transfer requires explicit flow and audit event

### App Installed On All Repositories

Problem:

- GitHub installation grants access to all repositories
- product might accidentally enable all repositories for agent actions

Required behavior:

- installation repository access is synced as provider availability
- Agent Teams target binding remains explicit
- no agent action is allowed until target is enabled in `integration-registry`

### App Has Repository Access But No Target Binding

Problem:

- GitHub installation can access a repository
- user has not enabled that repository as an Agent Teams target

Required behavior:

- action is rejected with `GITHUB_TARGET_NOT_BOUND`
- no ExternalActionContent is stored
- no outbox event is appended
- desktop UI can offer target enablement only to authorized users

### Local Git Remote Points To Fork

Problem:

- local project `origin` points to a fork
- the pull request base repository is upstream
- commenting on the fork would be wrong for a review workflow

Required behavior:

- local remote is treated only as a hint
- control-plane resolves the PR through GitHub and uses the PR base repository id as authority
- action is rejected if the base repository id is not explicitly bound and enabled
- no comment is posted to the head/fork repository by accident

### PR Number Belongs To Another Repository

Problem:

- PR numbers are repository-local
- desktop sends `#123`, but the bound repository either has no PR `123` or it is a different target

Required behavior:

- control-plane fetches or validates the PR in the bound base repository
- missing PR maps to `GITHUB_PULL_REQUEST_NOT_FOUND`
- base repository mismatch maps to `GITHUB_PULL_REQUEST_BASE_REPOSITORY_MISMATCH`
- no fallback posts an issue comment to a same-numbered issue/PR elsewhere

### Issue Number Is Not A PR For PR Action

Problem:

- top-level PR comments use issue comments internally
- not every issue is a pull request

Required behavior:

- `github_pull_request_top_level_comment` verifies PR existence before posting an issue comment
- if the number is an issue but not a PR, reject with `GITHUB_TARGET_KIND_MISMATCH`
- action kind decides the allowed target type, not the API endpoint name

### Issue Action Accidentally Targets A PR

Problem:

- GitHub issue endpoints may return PR-backed issues
- a user asked for an issue comment, but the number points to a PR conversation

Required behavior:

- V1 policy must decide whether `github_issue_comment` can comment on PR-backed issues
- if not allowed, reject when issue metadata contains PR information
- if allowed, the action kind/result must still report that the target was PR-backed
- tests cover both policy branches if this becomes configurable

### Installation Deleted Or Suspended

Required behavior:

- webhooks mark installation unavailable
- pending actions fail safely
- desktop connected state changes to disconnected
- user sees reconnect/install prompt

### Repository Renamed

Required behavior:

- authorization uses `githubRepositoryId`
- display `owner/repo` updates on sync
- old name is not used as authority
- pending actions re-resolve display owner/name before calling GitHub when needed
- stale display snapshots do not block action if immutable id and binding are valid

### Repository Transferred

Required behavior:

- transfer invalidates or re-evaluates workspace ownership
- repository cannot silently move between tenants
- action routing fails closed until sync confirms ownership

### Repository Removed From Installation

Required behavior:

- capability disabled for that repository
- pending actions fail safely
- no new token is issued for removed repo

### GitHub Rate Limits

Required behavior:

- retry with backoff for retryable rate limits
- dead-letter after max attempts
- do not duplicate comments during retry
- surface safe rate limit summary

### GitHub Secondary Rate Limits Or Spam Protection

Problem:

- creating comments can trigger notifications and secondary rate limits
- repeated agent retries can look like spam

Required behavior:

- connector maps secondary-rate-limit/spam responses to stable safe codes
- retry uses conservative backoff
- duplicate comment recovery still checks persisted result and marker
- user sees "temporarily rate limited" instead of generic provider failure

### GitHub Permission Drift

Problem:

- App permissions changed
- org policy blocks action
- repo branch protection blocks setup later

Required behavior:

- connector returns stable error codes
- permissions are rechecked during action
- user sees actionable reconnect/permission guidance
- capability state distinguishes missing app permission from repository not enabled
- app permission changes require integration capability re-sync

### GitHub API Version Changed Or Deprecated

Problem:

- GitHub REST API behavior or required headers change over time
- implementation accidentally relies on default API version
- installation token format changes and code assumes a fixed token length/prefix

Required behavior:

- configured API version is sent explicitly
- token values are treated as opaque strings
- compatibility tests pin expected request headers
- version bump is a separate ADR or migration note
- provider errors include safe version/correlation metadata

### Comment Update Strategy

Problem:

- one agent comment should update
- another agent comment should remain separate
- same agent may post multiple distinct findings

Required behavior:

- v1 must decide between summary-comment mode and append-comment mode
- idempotency marker includes action id and target
- optional thread/update key controls update behavior

Recommended v1:

- agent action creates or updates one comment for one idempotency key
- higher-level "summary per agent per PR" can be added later

### Hidden Marker Removed Or Edited

Problem:

- human edits the GitHub comment and removes the hidden marker
- GitHub strips or changes formatting unexpectedly

Required behavior:

- persisted external comment id is checked first when available
- marker search is recovery path, not the only source of truth
- if both persisted id and marker are unavailable, duplicate policy is explicit
- action does not overwrite unrelated human comments

### Line-Level Review Comment Requested

Problem:

- user expects review comments on exact diff lines
- PR head changed and old diff positions are stale
- line-level comments require path/commit/position details

Required behavior:

- V1 rejects with stable unsupported-capability code
- later implementation needs a separate ADR
- no raw diff storage is introduced accidentally

## Desktop Pairing Edge Cases

### Pairing Code Expired

Required behavior:

- complete pairing fails with safe code
- user can restart pairing
- expired code cannot be reused

### Pairing Code Reused

Required behavior:

- second use fails
- audit suspicious reuse if needed

### Desktop Token Stolen

Required behavior:

- token is scoped to workspace/client
- token can be revoked
- token expires or rotates
- all actions are still policy-checked

### Desktop Offline

Required behavior:

- desktop remains usable locally
- control-plane integrations show unavailable
- queued local action behavior must be explicit, not accidental

Recommended v1:

- no offline queue to control-plane
- user/agent gets explicit "integration unavailable"

## Agent Identity Edge Cases

### Agent Identity Spoofed In Body

Problem:

- agent-authored markdown claims to be another agent
- agent tries to inject hidden marker-like text

Required behavior:

- attribution block is rendered by control-plane from structured envelope
- agent-authored body cannot override header metadata
- hidden marker is generated after body sanitization/assembly
- audit stores the structured identity snapshot

### Unknown Agent

Required behavior:

- action rejected unless the desktop request includes a trusted local team/member snapshot
- audit logs distinguish unknown agent from known agent

### Agent Name Changed

Required behavior:

- persisted action keeps snapshot name
- future actions use new name
- stable `agentId` preferred when available
- retries use the original action identity snapshot
- audit can show current id plus historical display snapshot

### Avatar Not Public

Required behavior:

- local file URLs rejected
- v1 uses control-plane deterministic hosted avatar or known public URL
- GitHub comment rendering never embeds local paths
- avatar fetch/render failure falls back to deterministic generated avatar or no image

### Malicious Agent Text

Required behavior:

- markdown body can be user/agent authored
- attribution header escapes HTML fields
- hidden marker encoding is safe
- no token/secrets in body from control-plane
- raw body is never logged, audited, or stored outside encrypted ExternalActionContent

## Messenger Edge Cases

### Chat Removed Bot

Required behavior:

- outbound messages fail with stable code
- binding marked unhealthy
- user sees reconnect guidance

### Duplicate Webhook Update

Required behavior:

- messenger update id is idempotency key
- duplicate inbound event does not create duplicate action/message

### Message Too Large

Required behavior:

- connector enforces size limits
- may split only when product explicitly supports it
- otherwise fails with stable safe error

### Connector-Specific Capabilities

Problem:

- Telegram channel, group, DM, Slack channel, Discord thread differ

Required behavior:

- generic `ExternalTarget` supports connector-specific target metadata
- connector validates target type
- agent-actions does not hard-code Telegram/GitHub assumptions

## Billing And Entitlement Edge Cases

### Quota Exceeded

Required behavior:

- webhook ingestion still works
- action dispatch is denied
- audit records denied action
- user sees upgrade/limit message

### Billing Provider Down

Required behavior:

- fail open or fail closed must be a policy decision per feature
- v1 should fail closed for paid-only side effects
- free core desktop remains unaffected

## Runtime Relay Edge Cases

### Rust Backend Unavailable

Required behavior:

- control-plane action path remains independent
- runtime bridge port returns stable unavailable error
- no connector should block on runtime bridge unless its use case requires it

### Event Flood

Required behavior:

- rate limit public ingress
- queue backpressure
- per-workspace limits
- dead-letter poison events

## Observability Edge Cases

### Logs Leak Sensitive Data

Required behavior:

- structured logs use safe fields
- no raw webhook bodies
- no GitHub tokens
- no prompts, diffs, code, reusable model-output logs, or raw external action content

### Unknown Error

Required behavior:

- public API returns stable safe code
- internal logs include correlation id
- audit records safe summary

### Worker Version Skew

Problem:

- API writes outbox event version `v2`
- older worker only understands `v1`

Required behavior:

- worker dead-letters unsupported event version safely
- deployment order is documented
- readiness/metrics expose unsupported event errors

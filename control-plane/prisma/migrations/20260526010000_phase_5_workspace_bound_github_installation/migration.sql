CREATE TABLE "workspaces" (
  "id" UUID PRIMARY KEY,
  "display_name" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "created_by_bootstrap_kind" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "deleted_at" TIMESTAMPTZ(6)
);

CREATE TABLE "desktop_clients" (
  "id" UUID PRIMARY KEY,
  "workspace_id" UUID NOT NULL REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "display_name" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "last_seen_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "revoked_at" TIMESTAMPTZ(6)
);

CREATE TABLE "desktop_client_credentials" (
  "id" UUID PRIMARY KEY,
  "desktop_client_id" UUID NOT NULL REFERENCES "desktop_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "token_hash" TEXT NOT NULL,
  "lookup_prefix" TEXT NOT NULL,
  "token_version" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "rotation_request_id" TEXT,
  "rotated_from_credential_id" UUID,
  "issued_token_ciphertext_json" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "expires_at" TIMESTAMPTZ(6),
  "revoked_at" TIMESTAMPTZ(6),
  "last_used_at" TIMESTAMPTZ(6)
);

CREATE TABLE "desktop_pairing_sessions" (
  "id" UUID PRIMARY KEY,
  "workspace_id" UUID NOT NULL REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "requested_by_desktop_client_id" UUID NOT NULL REFERENCES "desktop_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "pairing_code_hash" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "attempt_count" INTEGER NOT NULL DEFAULT 0,
  "max_attempts" INTEGER NOT NULL DEFAULT 5,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "consumed_at" TIMESTAMPTZ(6),
  "consumed_by_desktop_client_id" UUID REFERENCES "desktop_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "failure_safe_error_json" JSONB
);

CREATE TABLE "integration_connections" (
  "id" UUID PRIMARY KEY,
  "workspace_id" UUID NOT NULL REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "provider" TEXT NOT NULL,
  "provider_connection_kind" TEXT NOT NULL,
  "provider_installation_id" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "claimed_by_desktop_client_id" UUID,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "suspended_at" TIMESTAMPTZ(6),
  "deleted_at" TIMESTAMPTZ(6)
);

CREATE TABLE "provider_account_snapshots" (
  "id" UUID PRIMARY KEY,
  "integration_connection_id" UUID NOT NULL REFERENCES "integration_connections"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "provider_account_id" TEXT NOT NULL,
  "provider_account_kind" TEXT NOT NULL,
  "display_login" TEXT NOT NULL,
  "avatar_url" TEXT,
  "last_verified_at" TIMESTAMPTZ(6) NOT NULL
);

CREATE TABLE "provider_repository_availability" (
  "id" UUID PRIMARY KEY,
  "integration_connection_id" UUID NOT NULL REFERENCES "integration_connections"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "provider_repository_id" TEXT NOT NULL,
  "display_owner" TEXT NOT NULL,
  "display_name" TEXT NOT NULL,
  "display_full_name" TEXT NOT NULL,
  "private" BOOLEAN NOT NULL,
  "archived" BOOLEAN NOT NULL,
  "available" BOOLEAN NOT NULL,
  "last_verified_at" TIMESTAMPTZ(6) NOT NULL
);

CREATE TABLE "provider_repository_sync_cursors" (
  "id" UUID PRIMARY KEY,
  "integration_connection_id" UUID NOT NULL REFERENCES "integration_connections"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "provider" TEXT NOT NULL,
  "cursor_kind" TEXT NOT NULL,
  "cursor_value" TEXT,
  "status" TEXT NOT NULL,
  "started_at" TIMESTAMPTZ(6) NOT NULL,
  "completed_at" TIMESTAMPTZ(6),
  "safe_error_json" JSONB
);

CREATE TABLE "github_setup_sessions" (
  "id" UUID PRIMARY KEY,
  "workspace_id" UUID NOT NULL REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "desktop_client_id" UUID NOT NULL,
  "setup_state_hash" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "github_installation_id" TEXT,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "consumed_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "failure_safe_error_json" JSONB
);

CREATE TABLE "github_installation_claims" (
  "id" UUID PRIMARY KEY,
  "workspace_id" UUID NOT NULL REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "setup_session_id" UUID NOT NULL REFERENCES "github_setup_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "github_installation_id" TEXT NOT NULL,
  "claim_continuation_token_hash" TEXT NOT NULL,
  "claim_continuation_consumed_at" TIMESTAMPTZ(6),
  "status" TEXT NOT NULL,
  "claim_authority_kind" TEXT NOT NULL,
  "verified_github_user_id" TEXT,
  "verified_github_login_snapshot" TEXT,
  "verified_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "failure_safe_error_json" JSONB
);

CREATE TABLE "github_oauth_claim_sessions" (
  "id" UUID PRIMARY KEY,
  "workspace_id" UUID NOT NULL REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "desktop_client_id" UUID NOT NULL,
  "github_installation_claim_id" UUID NOT NULL REFERENCES "github_installation_claims"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "oauth_state_hash" TEXT NOT NULL,
  "pkce_verifier_ciphertext" JSONB NOT NULL,
  "redirect_uri_snapshot" TEXT NOT NULL,
  "code_challenge_method" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "provider_error_code" TEXT,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "consumed_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "failure_safe_error_json" JSONB
);

CREATE TABLE "github_unclaimed_installation_callbacks" (
  "id" UUID PRIMARY KEY,
  "github_installation_id" TEXT,
  "setup_state_present" BOOLEAN NOT NULL,
  "status" TEXT NOT NULL,
  "first_seen_at" TIMESTAMPTZ(6) NOT NULL,
  "last_seen_at" TIMESTAMPTZ(6) NOT NULL,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "safe_metadata_json" JSONB NOT NULL
);

CREATE TABLE "github_installation_snapshots" (
  "id" UUID PRIMARY KEY,
  "integration_connection_id" UUID NOT NULL REFERENCES "integration_connections"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "github_installation_id" TEXT NOT NULL,
  "github_account_id" TEXT NOT NULL,
  "github_account_login" TEXT NOT NULL,
  "github_account_type" TEXT NOT NULL,
  "repository_selection" TEXT NOT NULL,
  "last_verified_at" TIMESTAMPTZ(6) NOT NULL
);

CREATE TABLE "github_repository_snapshots" (
  "id" UUID PRIMARY KEY,
  "integration_connection_id" UUID NOT NULL REFERENCES "integration_connections"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "github_repository_id" TEXT NOT NULL,
  "github_node_id" TEXT,
  "display_full_name" TEXT NOT NULL,
  "private" BOOLEAN NOT NULL,
  "archived" BOOLEAN NOT NULL,
  "last_verified_at" TIMESTAMPTZ(6) NOT NULL
);

CREATE UNIQUE INDEX "desktop_client_credentials_lookup_prefix_key"
  ON "desktop_client_credentials"("lookup_prefix");
CREATE UNIQUE INDEX "desktop_client_credentials_active_version_key"
  ON "desktop_client_credentials"("desktop_client_id", "token_version")
  WHERE "status" = 'active';
CREATE UNIQUE INDEX "desktop_client_credentials_rotation_request_key"
  ON "desktop_client_credentials"("desktop_client_id", "rotation_request_id")
  WHERE "rotation_request_id" IS NOT NULL;
CREATE UNIQUE INDEX "desktop_pairing_sessions_active_code_hash_key"
  ON "desktop_pairing_sessions"("pairing_code_hash")
  WHERE "status" = 'created';
CREATE UNIQUE INDEX "integration_connections_active_installation_key"
  ON "integration_connections"("provider", "provider_installation_id")
  WHERE "status" <> 'deleted';
CREATE UNIQUE INDEX "provider_account_snapshots_connection_account_key"
  ON "provider_account_snapshots"("integration_connection_id", "provider_account_id");
CREATE UNIQUE INDEX "provider_repository_availability_connection_repo_key"
  ON "provider_repository_availability"("integration_connection_id", "provider_repository_id");
CREATE UNIQUE INDEX "provider_repository_sync_cursors_connection_kind_key"
  ON "provider_repository_sync_cursors"("integration_connection_id", "provider", "cursor_kind");
CREATE UNIQUE INDEX "github_setup_sessions_active_state_hash_key"
  ON "github_setup_sessions"("setup_state_hash")
  WHERE "consumed_at" IS NULL;
CREATE UNIQUE INDEX "github_installation_claims_setup_installation_key"
  ON "github_installation_claims"("setup_session_id", "github_installation_id");
CREATE UNIQUE INDEX "github_installation_claims_active_continuation_hash_key"
  ON "github_installation_claims"("claim_continuation_token_hash")
  WHERE "claim_continuation_consumed_at" IS NULL;
CREATE UNIQUE INDEX "github_oauth_claim_sessions_active_state_hash_key"
  ON "github_oauth_claim_sessions"("oauth_state_hash")
  WHERE "consumed_at" IS NULL;
CREATE UNIQUE INDEX "github_installation_snapshots_connection_installation_key"
  ON "github_installation_snapshots"("integration_connection_id", "github_installation_id");
CREATE UNIQUE INDEX "github_repository_snapshots_connection_repo_key"
  ON "github_repository_snapshots"("integration_connection_id", "github_repository_id");

CREATE INDEX "workspaces_status_created_at_idx"
  ON "workspaces"("status", "created_at");
CREATE INDEX "desktop_clients_workspace_status_idx"
  ON "desktop_clients"("workspace_id", "status");
CREATE INDEX "desktop_client_credentials_client_status_idx"
  ON "desktop_client_credentials"("desktop_client_id", "status");
CREATE INDEX "desktop_pairing_sessions_workspace_status_exp_idx"
  ON "desktop_pairing_sessions"("workspace_id", "status", "expires_at");
CREATE INDEX "integration_connections_workspace_provider_status_idx"
  ON "integration_connections"("workspace_id", "provider", "status");
CREATE INDEX "provider_repository_availability_connection_available_idx"
  ON "provider_repository_availability"("integration_connection_id", "available");
CREATE INDEX "github_setup_sessions_workspace_client_status_exp_idx"
  ON "github_setup_sessions"("workspace_id", "desktop_client_id", "status", "expires_at");
CREATE INDEX "github_installation_claims_workspace_status_idx"
  ON "github_installation_claims"("workspace_id", "status");
CREATE INDEX "github_oauth_claim_sessions_claim_status_idx"
  ON "github_oauth_claim_sessions"("github_installation_claim_id", "status");
CREATE INDEX "github_unclaimed_callbacks_status_exp_idx"
  ON "github_unclaimed_installation_callbacks"("status", "expires_at");

CREATE TABLE github_action_requests (
  id uuid PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  integration_target_id uuid NOT NULL REFERENCES integration_targets(id) ON DELETE RESTRICT,
  action_type text NOT NULL,
  requested_by_subject_kind text NOT NULL,
  requested_by_subject_id text NOT NULL,
  asserted_by_desktop_client_id uuid NOT NULL,
  agent_id text NULL,
  agent_display_name text NOT NULL,
  agent_avatar_url text NULL,
  team_id text NULL,
  team_display_name text NULL,
  idempotency_key text NOT NULL,
  status text NOT NULL,
  external_content_ref_id uuid NOT NULL,
  external_content_integrity_hash text NOT NULL,
  github_delivery_id text NULL,
  github_check_run_id text NULL,
  github_url text NULL,
  content_shredded_at timestamptz NULL,
  safe_error_json jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX github_action_requests_workspace_idempotency_key
  ON github_action_requests(workspace_id, idempotency_key);

CREATE INDEX github_action_requests_workspace_status_created_idx
  ON github_action_requests(workspace_id, status, created_at);

CREATE INDEX github_action_requests_target_status_idx
  ON github_action_requests(integration_target_id, status);

CREATE INDEX github_action_requests_workspace_action_check_idx
  ON github_action_requests(workspace_id, action_type, github_check_run_id)
  WHERE github_check_run_id IS NOT NULL;

CREATE TABLE github_action_attempts (
  id uuid PRIMARY KEY,
  github_action_request_id uuid NOT NULL REFERENCES github_action_requests(id) ON DELETE RESTRICT,
  attempt_number integer NOT NULL,
  status text NOT NULL,
  started_at timestamptz NOT NULL,
  finished_at timestamptz NULL,
  safe_error_json jsonb NULL,
  github_status_code integer NULL,
  github_request_id text NULL
);

CREATE UNIQUE INDEX github_action_attempts_request_attempt_key
  ON github_action_attempts(github_action_request_id, attempt_number);

CREATE INDEX github_action_attempts_request_status_idx
  ON github_action_attempts(github_action_request_id, status);

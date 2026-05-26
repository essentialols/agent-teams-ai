CREATE TABLE outbox_events (
  id uuid PRIMARY KEY,
  event_type text NOT NULL,
  event_version integer NOT NULL,
  status text NOT NULL,
  aggregate_kind text NULL,
  aggregate_id text NULL,
  workspace_id text NULL,
  idempotency_key text NOT NULL,
  payload_json jsonb NOT NULL,
  content_ref_id uuid NULL,
  content_integrity_hash text NULL,
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 10,
  next_attempt_at timestamptz NOT NULL,
  locked_by text NULL,
  locked_until timestamptz NULL,
  claim_token text NULL,
  last_error_code text NULL,
  last_error_category text NULL,
  last_error_message text NULL,
  last_error_retryable boolean NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz NULL,
  dead_lettered_at timestamptz NULL,
  CONSTRAINT outbox_events_status_check CHECK (
    status IN ('pending', 'processing', 'completed', 'dead-lettered', 'cancelled')
  ),
  CONSTRAINT outbox_events_attempts_check CHECK (attempts >= 0),
  CONSTRAINT outbox_events_max_attempts_check CHECK (max_attempts > 0),
  CONSTRAINT outbox_events_attempts_max_check CHECK (attempts <= max_attempts),
  CONSTRAINT outbox_events_event_version_check CHECK (event_version > 0),
  CONSTRAINT outbox_events_processing_lock_check CHECK (
    (
      status = 'processing'
      AND locked_by IS NOT NULL
      AND locked_until IS NOT NULL
      AND claim_token IS NOT NULL
    )
    OR
    (
      status <> 'processing'
      AND locked_by IS NULL
      AND locked_until IS NULL
      AND claim_token IS NULL
    )
  ),
  CONSTRAINT outbox_events_completed_at_check CHECK (
    (status = 'completed') = (completed_at IS NOT NULL)
  ),
  CONSTRAINT outbox_events_dead_lettered_at_check CHECK (
    (status = 'dead-lettered') = (dead_lettered_at IS NOT NULL)
  ),
  CONSTRAINT outbox_events_content_ref_check CHECK (
    (content_ref_id IS NULL AND content_integrity_hash IS NULL)
    OR
    (content_ref_id IS NOT NULL AND content_integrity_hash IS NOT NULL)
  )
);

CREATE UNIQUE INDEX outbox_events_idempotency_key_key
  ON outbox_events (idempotency_key);
CREATE INDEX outbox_events_status_next_attempt_at_idx
  ON outbox_events (status, next_attempt_at);
CREATE INDEX outbox_events_processing_locked_until_idx
  ON outbox_events (locked_until)
  WHERE status = 'processing';
CREATE INDEX outbox_events_processing_claim_token_idx
  ON outbox_events (claim_token)
  WHERE status = 'processing';
CREATE INDEX outbox_events_workspace_created_at_idx
  ON outbox_events (workspace_id, created_at);
CREATE INDEX outbox_events_content_ref_id_idx
  ON outbox_events (content_ref_id);

CREATE TABLE external_action_contents (
  id uuid PRIMARY KEY,
  content_kind text NOT NULL,
  ciphertext bytea NULL,
  encrypted_data_key bytea NULL,
  data_key_algorithm text NOT NULL,
  content_encryption_algorithm text NOT NULL,
  content_nonce bytea NULL,
  content_auth_tag bytea NULL,
  data_key_nonce bytea NULL,
  data_key_auth_tag bytea NULL,
  ciphertext_sha256 text NOT NULL,
  key_ref text NOT NULL,
  expires_at timestamptz NOT NULL,
  deleted_at timestamptz NULL,
  shredded_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT external_action_contents_expires_check CHECK (expires_at > created_at),
  CONSTRAINT external_action_contents_shred_check CHECK (
    (
      shredded_at IS NULL
      AND ciphertext IS NOT NULL
      AND encrypted_data_key IS NOT NULL
      AND content_nonce IS NOT NULL
      AND content_auth_tag IS NOT NULL
      AND data_key_nonce IS NOT NULL
      AND data_key_auth_tag IS NOT NULL
    )
    OR
    (
      shredded_at IS NOT NULL
      AND ciphertext IS NULL
      AND encrypted_data_key IS NULL
      AND content_nonce IS NULL
      AND content_auth_tag IS NULL
      AND data_key_nonce IS NULL
      AND data_key_auth_tag IS NULL
    )
  )
);

CREATE INDEX external_action_contents_expires_at_idx
  ON external_action_contents (expires_at);
CREATE INDEX external_action_contents_deleted_at_idx
  ON external_action_contents (deleted_at);
CREATE INDEX external_action_contents_shredded_at_idx
  ON external_action_contents (shredded_at);

CREATE TABLE external_action_content_key_refs (
  key_ref text PRIMARY KEY,
  key_version integer NOT NULL,
  algorithm text NOT NULL,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  retired_at timestamptz NULL
);

CREATE TABLE dead_letter_events (
  id uuid PRIMARY KEY,
  outbox_event_id uuid NOT NULL UNIQUE,
  event_type text NOT NULL,
  event_version integer NOT NULL,
  final_error_json jsonb NOT NULL,
  attempts integer NOT NULL,
  payload_summary_json jsonb NOT NULL,
  content_ref_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_events (
  id uuid PRIMARY KEY,
  event_type text NOT NULL,
  actor_kind text NOT NULL,
  actor_id text NULL,
  workspace_id text NULL,
  subject_kind text NULL,
  subject_id text NULL,
  safe_metadata_json jsonb NOT NULL,
  correlation_id text NULL,
  request_id text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_events_workspace_created_at_idx
  ON audit_events (workspace_id, created_at);

CREATE TABLE distributed_locks (
  name text PRIMARY KEY,
  owner_id text NOT NULL,
  locked_until timestamptz NOT NULL,
  fencing_token bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

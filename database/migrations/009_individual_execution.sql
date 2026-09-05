-- Phase F: private individual execution with immutable prescribed snapshots and append-only actual history.
CREATE TABLE workout_sessions (
 id uuid PRIMARY KEY,
 actor_id text NOT NULL REFERENCES users(id),
 prescription_record_id uuid NOT NULL REFERENCES prescriptions(id),
 validation_record_id uuid NOT NULL REFERENCES prescription_validations(id),
 mode text NOT NULL CHECK(mode IN ('PRODUCTION','DEMO')),
 synthetic boolean NOT NULL,
 validation_status text NOT NULL CHECK(validation_status IN ('PASS','WARN')),
 entitlement_tier text NOT NULL CHECK(entitlement_tier IN ('BASE','PERFORMANCE','COMMAND')),
 prescription_snapshot jsonb NOT NULL CHECK(jsonb_typeof(prescription_snapshot)='object'),
 consumer_snapshot jsonb NOT NULL CHECK(jsonb_typeof(consumer_snapshot)='object'),
 request_idempotency_key text NOT NULL CHECK(length(request_idempotency_key) BETWEEN 8 AND 100),
 request_fingerprint text NOT NULL CHECK(request_fingerprint ~ '^[a-f0-9]{64}$'),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(actor_id,request_idempotency_key),
 CHECK((mode='DEMO' AND synthetic) OR (mode='PRODUCTION' AND NOT synthetic))
);
CREATE INDEX workout_sessions_actor_created ON workout_sessions(actor_id,created_at DESC,id);
CREATE TRIGGER workout_sessions_immutable BEFORE UPDATE OR DELETE ON workout_sessions FOR EACH ROW EXECUTE FUNCTION kb_immutable();
CREATE TRIGGER workout_sessions_no_truncate BEFORE TRUNCATE ON workout_sessions FOR EACH STATEMENT EXECUTE FUNCTION kb_immutable();

CREATE TABLE workout_session_state (
 session_id uuid PRIMARY KEY REFERENCES workout_sessions(id),
 actor_id text NOT NULL REFERENCES users(id),
 state text NOT NULL CHECK(state IN ('NOT_STARTED','IN_PROGRESS','PAUSED','COMPLETED','ABANDONED')),
 version integer NOT NULL DEFAULT 0 CHECK(version >= 0),
 started_at timestamptz,
 paused_at timestamptz,
 ended_at timestamptz,
 accumulated_ms bigint NOT NULL DEFAULT 0 CHECK(accumulated_ms >= 0),
 running_since timestamptz,
 current_line integer NOT NULL DEFAULT 0 CHECK(current_line >= 0),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK((state='NOT_STARTED' AND started_at IS NULL AND ended_at IS NULL AND running_since IS NULL) OR
       (state='IN_PROGRESS' AND started_at IS NOT NULL AND ended_at IS NULL AND running_since IS NOT NULL) OR
       (state='PAUSED' AND started_at IS NOT NULL AND ended_at IS NULL AND running_since IS NULL) OR
       (state IN ('COMPLETED','ABANDONED') AND started_at IS NOT NULL AND ended_at IS NOT NULL AND running_since IS NULL))
);
CREATE INDEX workout_session_state_actor ON workout_session_state(actor_id,state,updated_at DESC);
CREATE TRIGGER workout_session_state_no_delete BEFORE DELETE ON workout_session_state FOR EACH ROW EXECUTE FUNCTION kb_immutable();
CREATE TRIGGER workout_session_state_no_truncate BEFORE TRUNCATE ON workout_session_state FOR EACH STATEMENT EXECUTE FUNCTION kb_immutable();

CREATE TABLE workout_execution_events (
 sequence bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 id uuid NOT NULL UNIQUE,
 session_id uuid NOT NULL REFERENCES workout_sessions(id),
 actor_id text NOT NULL REFERENCES users(id),
 event_type text NOT NULL CHECK(event_type IN ('CREATED','STARTED','PAUSED','RESUMED','COMPLETED','ABANDONED','ACTUAL_RECORDED','SUBSTITUTED','SAFETY_STOPPED','POSITION_CHANGED')),
 session_version integer NOT NULL CHECK(session_version >= 0),
 idempotency_key text NOT NULL CHECK(length(idempotency_key) BETWEEN 8 AND 100),
 payload jsonb NOT NULL CHECK(jsonb_typeof(payload)='object'),
 recorded_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(actor_id,idempotency_key)
);
CREATE INDEX workout_execution_events_session ON workout_execution_events(session_id,sequence);
CREATE TRIGGER workout_execution_events_immutable BEFORE UPDATE OR DELETE ON workout_execution_events FOR EACH ROW EXECUTE FUNCTION kb_immutable();
CREATE TRIGGER workout_execution_events_no_truncate BEFORE TRUNCATE ON workout_execution_events FOR EACH STATEMENT EXECUTE FUNCTION kb_immutable();

CREATE TABLE workout_actuals (
 id uuid PRIMARY KEY,
 session_id uuid NOT NULL REFERENCES workout_sessions(id),
 actor_id text NOT NULL REFERENCES users(id),
 prescribed_line_index integer NOT NULL CHECK(prescribed_line_index >= 0),
 set_index integer CHECK(set_index >= 0),
 item_status text NOT NULL CHECK(item_status IN ('COMPLETED','SKIPPED','PARTIAL')),
 actual jsonb NOT NULL CHECK(jsonb_typeof(actual)='object'),
 substitution_id uuid,
 supersedes_actual_id uuid REFERENCES workout_actuals(id),
 idempotency_key text NOT NULL CHECK(length(idempotency_key) BETWEEN 8 AND 100),
 recorded_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(actor_id,idempotency_key)
);
CREATE INDEX workout_actuals_session ON workout_actuals(session_id,recorded_at,id);
CREATE TRIGGER workout_actuals_immutable BEFORE UPDATE OR DELETE ON workout_actuals FOR EACH ROW EXECUTE FUNCTION kb_immutable();
CREATE TRIGGER workout_actuals_no_truncate BEFORE TRUNCATE ON workout_actuals FOR EACH STATEMENT EXECUTE FUNCTION kb_immutable();

CREATE TABLE workout_substitutions (
 id uuid PRIMARY KEY,
 session_id uuid NOT NULL REFERENCES workout_sessions(id),
 actor_id text NOT NULL REFERENCES users(id),
 prescribed_line_index integer NOT NULL CHECK(prescribed_line_index >= 0),
 original_content_version text NOT NULL,
 replacement_content_version text NOT NULL,
 relationship_type text NOT NULL CHECK(relationship_type IN ('SUBSTITUTION','REGRESSION','PROGRESSION')),
 replacement_prescription_record_id uuid NOT NULL REFERENCES prescriptions(id),
 replacement_validation_record_id uuid NOT NULL REFERENCES prescription_validations(id),
 idempotency_key text NOT NULL CHECK(length(idempotency_key) BETWEEN 8 AND 100),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(actor_id,idempotency_key)
);
ALTER TABLE workout_actuals ADD CONSTRAINT workout_actuals_substitution_fk FOREIGN KEY(substitution_id) REFERENCES workout_substitutions(id);
CREATE TRIGGER workout_substitutions_immutable BEFORE UPDATE OR DELETE ON workout_substitutions FOR EACH ROW EXECUTE FUNCTION kb_immutable();
CREATE TRIGGER workout_substitutions_no_truncate BEFORE TRUNCATE ON workout_substitutions FOR EACH STATEMENT EXECUTE FUNCTION kb_immutable();

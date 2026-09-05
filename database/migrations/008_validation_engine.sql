-- Phase E: independent validation policy, sealed validator inputs and immutable results.
ALTER TABLE prescriptions
  ADD COLUMN validation_input bytea,
  ADD COLUMN artifact_fingerprint text CHECK(artifact_fingerprint ~ '^[a-f0-9]{64}$');

CREATE TABLE validation_policies (
 id uuid PRIMARY KEY,
 version text NOT NULL UNIQUE,
 status text NOT NULL CHECK(status IN ('TEST_ONLY','ACTIVE')),
 synthetic boolean NOT NULL,
 production_eligible boolean NOT NULL,
 definition jsonb NOT NULL CHECK(jsonb_typeof(definition)='object'),
 created_by text NOT NULL REFERENCES users(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK((status='TEST_ONLY' AND synthetic AND NOT production_eligible) OR (status='ACTIVE' AND NOT synthetic AND production_eligible))
);
CREATE TRIGGER validation_policy_immutable BEFORE UPDATE OR DELETE ON validation_policies FOR EACH ROW EXECUTE FUNCTION kb_immutable();
CREATE TRIGGER validation_policy_no_truncate BEFORE TRUNCATE ON validation_policies FOR EACH STATEMENT EXECUTE FUNCTION kb_immutable();

CREATE TABLE validation_policy_activations (
 sequence bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 policy_id uuid NOT NULL REFERENCES validation_policies(id),
 activated_by text NOT NULL REFERENCES users(id),
 reason text NOT NULL CHECK(length(reason) BETWEEN 3 AND 500),
 activated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER validation_policy_activation_immutable BEFORE UPDATE OR DELETE ON validation_policy_activations FOR EACH ROW EXECUTE FUNCTION kb_immutable();
CREATE TRIGGER validation_policy_activation_no_truncate BEFORE TRUNCATE ON validation_policy_activations FOR EACH STATEMENT EXECUTE FUNCTION kb_immutable();

CREATE TABLE prescription_validations (
 id uuid PRIMARY KEY,
 prescription_record_id uuid NOT NULL REFERENCES prescriptions(id),
 actor_id text NOT NULL REFERENCES users(id),
 policy_id uuid,
 policy_version text NOT NULL,
 engine_version text NOT NULL,
 status text NOT NULL CHECK(status IN ('PASS','WARN','REJECT')),
 codes text[] NOT NULL,
 input_fingerprint text NOT NULL CHECK(input_fingerprint ~ '^[a-f0-9]{64}$'),
 result jsonb NOT NULL CHECK(jsonb_typeof(result)='object'),
 validated_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(policy_id) REFERENCES validation_policies(id)
);
CREATE INDEX prescription_validations_history ON prescription_validations(prescription_record_id,validated_at,id);
CREATE TRIGGER prescription_validation_immutable BEFORE UPDATE OR DELETE ON prescription_validations FOR EACH ROW EXECUTE FUNCTION kb_immutable();
CREATE TRIGGER prescription_validation_no_truncate BEFORE TRUNCATE ON prescription_validations FOR EACH STATEMENT EXECUTE FUNCTION kb_immutable();

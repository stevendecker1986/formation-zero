-- Phase D: reviewed structures and separate immutable candidate-session history.
ALTER TABLE kb_entities DROP CONSTRAINT kb_entities_kind_check;
ALTER TABLE kb_entities ADD CONSTRAINT kb_entities_kind_check CHECK(kind IN ('SOURCE','SOURCE_VERSION','SOURCE_SECTION','CITATION','AUTHOR','QUALIFICATION','REVIEWER','EXERCISE','EQUIPMENT','RECOVERY','RESTRICTION','MEDIA_REQUIREMENT','MEDIA_ASSET','RIGHTS','RULE','REASON_CODE','RULE_SET','PRESCRIPTION_TEMPLATE'));
CREATE TABLE prescriptions (
 id uuid PRIMARY KEY,
 actor_id text NOT NULL REFERENCES users(id),
 generated_at timestamptz NOT NULL DEFAULT now(),
 mode text NOT NULL CHECK(mode IN ('TEST','PRODUCTION')),
 input_fingerprint text NOT NULL CHECK(input_fingerprint ~ '^[a-f0-9]{64}$'),
 material jsonb NOT NULL CHECK(jsonb_typeof(material)='object')
);
CREATE INDEX prescriptions_actor ON prescriptions(actor_id,generated_at);
CREATE TRIGGER prescription_immutable BEFORE UPDATE OR DELETE ON prescriptions FOR EACH ROW EXECUTE FUNCTION kb_immutable();
CREATE TRIGGER prescription_no_truncate BEFORE TRUNCATE ON prescriptions FOR EACH STATEMENT EXECUTE FUNCTION kb_immutable();

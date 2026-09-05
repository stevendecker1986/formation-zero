-- Rules reuse immutable knowledge versions and existing editorial grants.
ALTER TABLE kb_entities DROP CONSTRAINT kb_entities_kind_check;
ALTER TABLE kb_entities ADD CONSTRAINT kb_entities_kind_check CHECK(kind IN ('SOURCE','SOURCE_VERSION','SOURCE_SECTION','CITATION','AUTHOR','QUALIFICATION','REVIEWER','EXERCISE','EQUIPMENT','RECOVERY','RESTRICTION','MEDIA_REQUIREMENT','MEDIA_ASSET','RIGHTS','RULE','REASON_CODE','RULE_SET'));
CREATE TABLE rule_activations (
 sequence bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 rule_set_version uuid NOT NULL REFERENCES kb_versions(id),
 activated_by text NOT NULL REFERENCES users(id),
 activated_at timestamptz NOT NULL DEFAULT now(),
 reason text NOT NULL CHECK(length(reason) BETWEEN 1 AND 500)
);
CREATE TABLE rule_evaluations (
 id uuid PRIMARY KEY,
 evaluated_at timestamptz NOT NULL DEFAULT now(),
 actor_id text NOT NULL REFERENCES users(id),
 mode text NOT NULL CHECK(mode IN ('TEST','PRODUCTION')),
 rule_set_version uuid NOT NULL REFERENCES kb_versions(id),
 engine_version text NOT NULL,
 input_fingerprint text NOT NULL CHECK(input_fingerprint ~ '^[a-f0-9]{64}$'),
 provenance jsonb NOT NULL CHECK(jsonb_typeof(provenance)='object')
);
CREATE TRIGGER rule_activation_immutable BEFORE UPDATE OR DELETE ON rule_activations FOR EACH ROW EXECUTE FUNCTION kb_immutable();
CREATE TRIGGER rule_activation_no_truncate BEFORE TRUNCATE ON rule_activations FOR EACH STATEMENT EXECUTE FUNCTION kb_immutable();
CREATE TRIGGER rule_evaluation_immutable BEFORE UPDATE OR DELETE ON rule_evaluations FOR EACH ROW EXECUTE FUNCTION kb_immutable();
CREATE TRIGGER rule_evaluation_no_truncate BEFORE TRUNCATE ON rule_evaluations FOR EACH STATEMENT EXECUTE FUNCTION kb_immutable();
CREATE FUNCTION rule_activation_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM kb_versions v JOIN kb_entities e ON e.id=v.entity_id JOIN kb_states s ON s.version_id=v.id WHERE v.id=NEW.rule_set_version AND e.kind='RULE_SET' AND s.status='PUBLISHED' AND v.payload->'synthetic'='false'::jsonb) THEN RAISE EXCEPTION 'Invalid production rule set'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER rule_activation_guard BEFORE INSERT ON rule_activations FOR EACH ROW EXECUTE FUNCTION rule_activation_guard();
CREATE OR REPLACE FUNCTION kb_link_type() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE origin_kind text; target_kind text; expected text; BEGIN
 SELECT e.kind INTO origin_kind FROM kb_versions v JOIN kb_entities e ON e.id=v.entity_id WHERE v.id=NEW.version_id;
 SELECT e.kind INTO target_kind FROM kb_versions v JOIN kb_entities e ON e.id=v.entity_id WHERE v.id=NEW.target_id;
 expected:=CASE NEW.relation WHEN 'rules' THEN 'RULE' WHEN 'reason_code' THEN 'REASON_CODE' WHEN 'source' THEN CASE WHEN origin_kind='RESTRICTION' THEN 'SOURCE_SECTION' ELSE 'SOURCE' END WHEN 'source_version' THEN 'SOURCE_VERSION' WHEN 'section' THEN 'SOURCE_SECTION' WHEN 'author' THEN 'AUTHOR' WHEN 'person' THEN 'AUTHOR' WHEN 'rights' THEN 'RIGHTS' WHEN 'reviewer' THEN 'REVIEWER' WHEN 'media_requirement' THEN 'MEDIA_REQUIREMENT' WHEN 'citations' THEN 'CITATION' WHEN 'equipment' THEN 'EQUIPMENT' WHEN 'restrictions' THEN 'RESTRICTION' WHEN 'media_assets' THEN 'MEDIA_ASSET' WHEN 'RECOVERY' THEN 'RECOVERY' WHEN 'parent_exercise' THEN 'EXERCISE' WHEN 'recovery_exercise' THEN 'EXERCISE' WHEN 'REGRESSION' THEN 'EXERCISE' WHEN 'PROGRESSION' THEN 'EXERCISE' WHEN 'SUBSTITUTION' THEN 'EXERCISE' WHEN 'LOW_IMPACT' THEN 'EXERCISE' WHEN 'NO_EQUIPMENT' THEN 'EXERCISE' WHEN 'LIMITED_SPACE' THEN 'EXERCISE' WHEN 'UNIT_PT' THEN 'EXERCISE' WHEN 'FUNCTIONAL_RESTRICTION' THEN 'EXERCISE' END;
 IF expected IS NULL OR expected IS DISTINCT FROM target_kind THEN RAISE EXCEPTION 'Invalid knowledge reference type'; END IF;
 RETURN NEW;
END; $$;


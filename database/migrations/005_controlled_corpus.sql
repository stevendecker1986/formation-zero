-- Controlled import membership is immutable; edits create normal knowledge versions.
CREATE TABLE kb_corpus_members (
 corpus text NOT NULL CHECK(corpus='PHASE_B2_INITIAL'),
 member_key text NOT NULL,
 entity_id uuid NOT NULL REFERENCES kb_entities(id),
 initial_version_id uuid NOT NULL REFERENCES kb_versions(id),
 input_sha256 text NOT NULL CHECK(input_sha256 ~ '^[a-f0-9]{64}$'),
 batch integer NOT NULL CHECK(batch BETWEEN 0 AND 5),
 PRIMARY KEY(corpus,member_key), UNIQUE(corpus,entity_id)
);
CREATE TRIGGER kb_corpus_immutable BEFORE UPDATE OR DELETE ON kb_corpus_members FOR EACH ROW EXECUTE FUNCTION kb_immutable();
CREATE TRIGGER kb_corpus_no_truncate BEFORE TRUNCATE ON kb_corpus_members FOR EACH STATEMENT EXECUTE FUNCTION kb_immutable();

-- Knowledge metadata is isolated from account/profile, subscription and training data.
ALTER TABLE audit_events DROP CONSTRAINT audit_events_entity_type_check;
ALTER TABLE audit_events ADD CONSTRAINT audit_events_entity_type_check CHECK(entity_type IN ('ACCOUNT','KNOWLEDGE'));
CREATE SEQUENCE kb_code_sequence;
CREATE TABLE kb_entities (
 id uuid PRIMARY KEY, code text NOT NULL UNIQUE CHECK(code ~ '^FZ-[A-Z]+-[0-9]{6,}$'),
 kind text NOT NULL CHECK(kind IN ('SOURCE','SOURCE_VERSION','SOURCE_SECTION','CITATION','AUTHOR','QUALIFICATION','REVIEWER','EXERCISE','EQUIPMENT','RECOVERY','RESTRICTION','MEDIA_REQUIREMENT','MEDIA_ASSET','RIGHTS')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE kb_versions (
 id uuid PRIMARY KEY, entity_id uuid NOT NULL REFERENCES kb_entities(id), version integer NOT NULL CHECK(version>0),
 previous_version uuid REFERENCES kb_versions(id), title text NOT NULL CHECK(length(title) BETWEEN 1 AND 500),
 payload jsonb NOT NULL CHECK(jsonb_typeof(payload)='object'), created_by text NOT NULL REFERENCES users(id),
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(entity_id,version)
);
CREATE TABLE kb_states (
 version_id uuid PRIMARY KEY REFERENCES kb_versions(id), revision integer NOT NULL DEFAULT 0 CHECK(revision>=0),
 status text NOT NULL DEFAULT 'INGESTED' CHECK(status IN ('DISCOVERED','INGESTED','SOURCE_VERIFIED','TECHNICALLY_REVIEWED','SAFETY_REVIEWED','EDITORIALLY_REVIEWED','APPROVED','PUBLISHED','SUPERSEDED','RETIRED')),
 approved_by text REFERENCES users(id), published_at timestamptz,
 superseded_by uuid REFERENCES kb_versions(id), supersedes uuid REFERENCES kb_versions(id),
 retired_at timestamptz, retirement_reason text,
 CHECK((status='RETIRED')=(retired_at IS NOT NULL)),
 CHECK(status NOT IN ('PUBLISHED','SUPERSEDED') OR (published_at IS NOT NULL AND approved_by IS NOT NULL)),
 CHECK(status<>'SUPERSEDED' OR superseded_by IS NOT NULL),
 CHECK(status<>'RETIRED' OR length(retirement_reason)>0)
);
CREATE TABLE kb_links (
 version_id uuid NOT NULL REFERENCES kb_versions(id), relation text NOT NULL,
 target_id uuid NOT NULL REFERENCES kb_versions(id), PRIMARY KEY(version_id,relation,target_id), CHECK(version_id<>target_id)
);
CREATE INDEX kb_links_target ON kb_links(target_id);
CREATE TABLE kb_taxonomies (category text NOT NULL CHECK(category IN ('MOVEMENT','CAPABILITY')), name text NOT NULL, PRIMARY KEY(category,name));
CREATE TABLE kb_tags (
 version_id uuid NOT NULL REFERENCES kb_versions(id), category text NOT NULL, name text NOT NULL,
 is_primary boolean NOT NULL, FOREIGN KEY(category,name) REFERENCES kb_taxonomies(category,name), PRIMARY KEY(version_id,category,name)
);
CREATE UNIQUE INDEX kb_primary_tag ON kb_tags(version_id,category) WHERE is_primary;
CREATE TABLE kb_grants (
 user_id text NOT NULL REFERENCES users(id), permission text NOT NULL CHECK(permission IN ('CONTENT_EDITOR','TECHNICAL_REVIEWER','SAFETY_REVIEWER','EDITORIAL_REVIEWER','RIGHTS_REVIEWER','POLICY_REVIEWER','SPECIALTY_REVIEWER','PUBLISHER')),
 granted_by text NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,permission)
);
CREATE TABLE kb_reviews (
 sequence bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
 id uuid PRIMARY KEY, version_id uuid NOT NULL REFERENCES kb_versions(id), reviewer_id uuid NOT NULL REFERENCES kb_versions(id),
 reviewer_user_id text NOT NULL REFERENCES users(id), review_type text NOT NULL CHECK(review_type IN ('TECHNICAL','SAFETY','EDITORIAL','RIGHTS','POLICY','SPECIALTY')),
 decision text NOT NULL CHECK(decision IN ('APPROVE','REJECT','CHANGES_REQUIRED')), comments text NOT NULL CHECK(length(comments) BETWEEN 1 AND 2000),
 specialty text CHECK(specialty IN ('NUTRITION','SPORTS_MEDICINE','ENDURANCE','STRENGTH_CONDITIONING','FORCE_FITNESS','MCMAP','OTHER')),
 reviewed_at timestamptz NOT NULL DEFAULT now(), re_review_date date,
 CHECK((review_type='SPECIALTY')=(specialty IS NOT NULL)), CHECK(re_review_date IS NULL OR re_review_date>=reviewed_at::date)
);
CREATE INDEX kb_review_history ON kb_reviews(version_id,review_type,reviewed_at DESC);
CREATE INDEX kb_search ON kb_versions USING gin(to_tsvector('simple',title));
CREATE INDEX kb_status ON kb_states(status);

CREATE FUNCTION kb_immutable() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Knowledge history is immutable'; END; $$;
CREATE TRIGGER kb_entity_immutable BEFORE UPDATE OR DELETE ON kb_entities FOR EACH ROW EXECUTE FUNCTION kb_immutable();
CREATE TRIGGER kb_version_immutable BEFORE UPDATE OR DELETE ON kb_versions FOR EACH ROW EXECUTE FUNCTION kb_immutable();
CREATE TRIGGER kb_review_immutable BEFORE UPDATE OR DELETE ON kb_reviews FOR EACH ROW EXECUTE FUNCTION kb_immutable();
CREATE TRIGGER kb_link_immutable BEFORE UPDATE OR DELETE ON kb_links FOR EACH ROW EXECUTE FUNCTION kb_immutable();
CREATE TRIGGER kb_tag_immutable BEFORE UPDATE OR DELETE ON kb_tags FOR EACH ROW EXECUTE FUNCTION kb_immutable();
CREATE TRIGGER kb_state_no_delete BEFORE DELETE ON kb_states FOR EACH ROW EXECUTE FUNCTION kb_immutable();
CREATE TRIGGER kb_versions_no_truncate BEFORE TRUNCATE ON kb_versions FOR EACH STATEMENT EXECUTE FUNCTION kb_immutable();
CREATE TRIGGER kb_entities_no_truncate BEFORE TRUNCATE ON kb_entities FOR EACH STATEMENT EXECUTE FUNCTION kb_immutable();
CREATE TRIGGER kb_reviews_no_truncate BEFORE TRUNCATE ON kb_reviews FOR EACH STATEMENT EXECUTE FUNCTION kb_immutable();
CREATE TRIGGER kb_links_no_truncate BEFORE TRUNCATE ON kb_links FOR EACH STATEMENT EXECUTE FUNCTION kb_immutable();
CREATE TRIGGER kb_tags_no_truncate BEFORE TRUNCATE ON kb_tags FOR EACH STATEMENT EXECUTE FUNCTION kb_immutable();
CREATE TRIGGER kb_states_no_truncate BEFORE TRUNCATE ON kb_states FOR EACH STATEMENT EXECUTE FUNCTION kb_immutable();

CREATE FUNCTION kb_validate_version() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE k text; p jsonb; key text; val jsonb; prior kb_versions; BEGIN
 SELECT kind INTO k FROM kb_entities WHERE id=NEW.entity_id;
 p:=NEW.payload;
 IF NEW.version=1 AND NEW.previous_version IS NOT NULL THEN RAISE EXCEPTION 'Invalid lineage'; END IF;
 IF NEW.version>1 THEN
  SELECT * INTO prior FROM kb_versions WHERE id=NEW.previous_version;
  IF prior.id IS NULL OR prior.entity_id<>NEW.entity_id OR prior.version<>NEW.version-1 THEN RAISE EXCEPTION 'Invalid lineage'; END IF;
 END IF;
 IF k='EXERCISE' THEN
  IF NOT(p ?& ARRAY['demand_profile','formation_suitability','technical_complexity']) THEN RAISE EXCEPTION 'Missing exercise fields'; END IF;
  IF jsonb_typeof(p->'technical_complexity')<>'number' OR (p->>'technical_complexity')::numeric NOT BETWEEN 1 AND 5 OR (p->>'technical_complexity')::numeric<>trunc((p->>'technical_complexity')::numeric) THEN RAISE EXCEPTION 'Invalid complexity'; END IF;
  IF (SELECT count(*) FROM jsonb_object_keys(p->'demand_profile'))<>14 OR NOT((p->'demand_profile') ?& ARRAY['muscular_demand','cardiovascular_demand','neurological_demand','impact_demand','upper_body_demand','lower_body_demand','trunk_demand','grip_demand','axial_loading','eccentric_loading','technical_demand','running_interference','rucking_interference','recovery_cost']) THEN RAISE EXCEPTION 'Invalid demand profile'; END IF;
  IF (SELECT count(*) FROM jsonb_object_keys(p->'formation_suitability'))<>6 OR NOT((p->'formation_suitability') ?& ARRAY['Individual','Partner','Fire Team','Squad','Platoon','Company+']) THEN RAISE EXCEPTION 'Invalid suitability'; END IF;
  FOR key,val IN SELECT * FROM jsonb_each((p->'demand_profile')||(p->'formation_suitability')||jsonb_build_object('individual',p->'individual_suitability')) LOOP
   IF jsonb_typeof(val)<>'number' OR val::text::numeric NOT BETWEEN 0 AND 5 OR val::text::numeric<>trunc(val::text::numeric) THEN RAISE EXCEPTION 'Score outside 0 to 5'; END IF;
  END LOOP;
 END IF;
 IF k='RECOVERY' AND (jsonb_typeof(p->'demand')<>'number' OR (p->>'demand')::numeric NOT BETWEEN 0 AND 5) THEN RAISE EXCEPTION 'Invalid recovery demand'; END IF;
 IF k='MEDIA_REQUIREMENT' THEN
  IF p->'video_required' IS DISTINCT FROM 'false'::jsonb OR p->'rights_review_required' IS DISTINCT FROM 'true'::jsonb THEN RAISE EXCEPTION 'Invalid media gate'; END IF;
  IF NOT(p ?& ARRAY['minimum_images','recommended_images','maximum_images','required_views']) OR (p->>'minimum_images')::int<0 OR (p->>'maximum_images')::int>4 OR (p->>'minimum_images')::int>(p->>'recommended_images')::int OR (p->>'recommended_images')::int>(p->>'maximum_images')::int OR jsonb_array_length(p->'required_views')>(p->>'maximum_images')::int THEN RAISE EXCEPTION 'Invalid media count'; END IF;
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER kb_version_validate BEFORE INSERT ON kb_versions FOR EACH ROW EXECUTE FUNCTION kb_validate_version();

CREATE FUNCTION kb_guard_state() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE owner_entity uuid; target_entity uuid; BEGIN
 IF NEW.version_id<>OLD.version_id OR NEW.revision<>OLD.revision+1 THEN RAISE EXCEPTION 'Invalid state revision'; END IF;
 IF OLD.status IN ('RETIRED','SUPERSEDED') THEN RAISE EXCEPTION 'Terminal history'; END IF;
 IF OLD.status='PUBLISHED' AND (NEW.status NOT IN ('SUPERSEDED','RETIRED') OR NEW.approved_by IS DISTINCT FROM OLD.approved_by OR NEW.published_at IS DISTINCT FROM OLD.published_at) THEN RAISE EXCEPTION 'Published state protected'; END IF;
 IF NEW.superseded_by IS NOT NULL OR NEW.supersedes IS NOT NULL THEN
  SELECT entity_id INTO owner_entity FROM kb_versions WHERE id=NEW.version_id;
  SELECT entity_id INTO target_entity FROM kb_versions WHERE id=coalesce(NEW.superseded_by,NEW.supersedes);
  IF owner_entity IS DISTINCT FROM target_entity OR coalesce(NEW.superseded_by,NEW.supersedes)=NEW.version_id THEN RAISE EXCEPTION 'Invalid supersession'; END IF;
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER kb_state_guard BEFORE UPDATE ON kb_states FOR EACH ROW EXECUTE FUNCTION kb_guard_state();
CREATE FUNCTION kb_guard_attachment() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF EXISTS(SELECT 1 FROM kb_states WHERE version_id=NEW.version_id AND status IN ('APPROVED','PUBLISHED','SUPERSEDED','RETIRED')) THEN RAISE EXCEPTION 'Frozen attachments'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER kb_review_guard BEFORE INSERT ON kb_reviews FOR EACH ROW EXECUTE FUNCTION kb_guard_attachment();
CREATE TRIGGER kb_link_guard BEFORE INSERT ON kb_links FOR EACH ROW EXECUTE FUNCTION kb_guard_attachment();
CREATE TRIGGER kb_tag_guard BEFORE INSERT ON kb_tags FOR EACH ROW EXECUTE FUNCTION kb_guard_attachment();

INSERT INTO kb_taxonomies(category,name) VALUES
('MOVEMENT','Push'),
('MOVEMENT','Pull'),
('MOVEMENT','Squat'),
('MOVEMENT','Hinge'),
('MOVEMENT','Lunge'),
('MOVEMENT','Rotation'),
('MOVEMENT','Anti-Rotation'),
('MOVEMENT','Brace'),
('MOVEMENT','Carry'),
('MOVEMENT','Locomotion'),
('MOVEMENT','Crawl'),
('MOVEMENT','Ground-to-Standing'),
('MOVEMENT','Jump'),
('MOVEMENT','Land'),
('MOVEMENT','Throw'),
('MOVEMENT','Sprint'),
('MOVEMENT','Change of Direction'),
('MOVEMENT','Climb'),
('MOVEMENT','Drag'),
('MOVEMENT','Lift'),
('MOVEMENT','Aquatic'),
('CAPABILITY','Maximal Strength'),
('CAPABILITY','Relative Strength'),
('CAPABILITY','Strength Endurance'),
('CAPABILITY','Power'),
('CAPABILITY','Speed'),
('CAPABILITY','Acceleration'),
('CAPABILITY','Agility'),
('CAPABILITY','Aerobic Endurance'),
('CAPABILITY','Anaerobic Capacity'),
('CAPABILITY','Muscular Endurance'),
('CAPABILITY','Work Capacity'),
('CAPABILITY','Mobility'),
('CAPABILITY','Stability'),
('CAPABILITY','Coordination'),
('CAPABILITY','Balance'),
('CAPABILITY','Grip'),
('CAPABILITY','Running'),
('CAPABILITY','Rucking'),
('CAPABILITY','Load Carriage'),
('CAPABILITY','Aquatic Conditioning'),
('CAPABILITY','Tactical Conditioning'),
('CAPABILITY','Recovery'),
('CAPABILITY','Durability');

CREATE FUNCTION kb_link_type() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE origin_kind text; target_kind text; expected text; BEGIN
 SELECT e.kind INTO origin_kind FROM kb_versions v JOIN kb_entities e ON e.id=v.entity_id WHERE v.id=NEW.version_id;
 SELECT e.kind INTO target_kind FROM kb_versions v JOIN kb_entities e ON e.id=v.entity_id WHERE v.id=NEW.target_id;
 expected:=CASE NEW.relation WHEN 'source' THEN CASE WHEN origin_kind='RESTRICTION' THEN 'SOURCE_SECTION' ELSE 'SOURCE' END WHEN 'source_version' THEN 'SOURCE_VERSION' WHEN 'section' THEN 'SOURCE_SECTION' WHEN 'author' THEN 'AUTHOR' WHEN 'person' THEN 'AUTHOR' WHEN 'rights' THEN 'RIGHTS' WHEN 'reviewer' THEN 'REVIEWER' WHEN 'media_requirement' THEN 'MEDIA_REQUIREMENT' WHEN 'citations' THEN 'CITATION' WHEN 'equipment' THEN 'EQUIPMENT' WHEN 'restrictions' THEN 'RESTRICTION' WHEN 'media_assets' THEN 'MEDIA_ASSET' WHEN 'RECOVERY' THEN 'RECOVERY' WHEN 'parent_exercise' THEN 'EXERCISE' WHEN 'recovery_exercise' THEN 'EXERCISE' WHEN 'REGRESSION' THEN 'EXERCISE' WHEN 'PROGRESSION' THEN 'EXERCISE' WHEN 'SUBSTITUTION' THEN 'EXERCISE' WHEN 'LOW_IMPACT' THEN 'EXERCISE' WHEN 'NO_EQUIPMENT' THEN 'EXERCISE' WHEN 'LIMITED_SPACE' THEN 'EXERCISE' WHEN 'UNIT_PT' THEN 'EXERCISE' WHEN 'FUNCTIONAL_RESTRICTION' THEN 'EXERCISE' END;
 IF expected IS NULL OR expected IS DISTINCT FROM target_kind THEN RAISE EXCEPTION 'Invalid knowledge reference type'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER kb_link_type BEFORE INSERT ON kb_links FOR EACH ROW EXECUTE FUNCTION kb_link_type();

-- Run as migration owner after provisioning a login named fz_runtime through
-- your secret manager. Do not run this with the local superuser as runtime.
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO fz_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON users, user_profiles, auth_sessions, auth_identities, auth_verifications, auth_rate_limits, user_roles, subscription_accounts, request_limits, consumed_auth_tokens TO fz_runtime;
GRANT SELECT ON roles, subscription_entitlements, schema_migrations TO fz_runtime;
GRANT SELECT, INSERT ON audit_events TO fz_runtime;
REVOKE UPDATE, DELETE, TRUNCATE ON audit_events FROM fz_runtime;
GRANT SELECT, INSERT ON kb_entities, kb_versions, kb_links, kb_tags, kb_reviews TO fz_runtime;
GRANT SELECT, INSERT, UPDATE ON kb_states TO fz_runtime;
GRANT SELECT, INSERT, DELETE ON kb_grants TO fz_runtime;
GRANT SELECT ON kb_taxonomies TO fz_runtime;
GRANT USAGE, SELECT ON SEQUENCE kb_code_sequence, kb_reviews_sequence_seq TO fz_runtime;
REVOKE UPDATE, DELETE, TRUNCATE ON kb_entities, kb_versions, kb_links, kb_tags, kb_reviews FROM fz_runtime;
REVOKE DELETE, TRUNCATE ON kb_states FROM fz_runtime;
-- PostgreSQL requires an UPDATE privilege for row locks; the immutable trigger
-- rejects actual entity updates, including updates of id.
GRANT UPDATE(id) ON kb_entities TO fz_runtime;
-- Runtime has no DDL ownership; migration credentials never enter app containers.

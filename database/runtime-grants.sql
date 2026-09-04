-- Run as migration owner after provisioning a login named fz_runtime through
-- your secret manager. Do not run this with the local superuser as runtime.
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO fz_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON users, user_profiles, auth_sessions, auth_identities, auth_verifications, auth_rate_limits, user_roles, subscription_accounts, request_limits, consumed_auth_tokens TO fz_runtime;
GRANT SELECT ON roles, subscription_entitlements, schema_migrations TO fz_runtime;
GRANT SELECT, INSERT ON audit_events TO fz_runtime;
REVOKE UPDATE, DELETE, TRUNCATE ON audit_events FROM fz_runtime;
-- Runtime has no DDL ownership; migration credentials never enter app containers.

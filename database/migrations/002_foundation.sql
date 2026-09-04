CREATE TYPE fz_role AS ENUM ('USER','LEADER','COACH_FFI','FORMATION_ADMIN','PLATFORM_ADMIN');
CREATE TYPE fz_tier AS ENUM ('BASE','PERFORMANCE','COMMAND');
CREATE TABLE roles (name fz_role PRIMARY KEY);
INSERT INTO roles SELECT unnest(enum_range(NULL::fz_role));
CREATE TABLE user_profiles (user_id text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, display_name varchar(80) NOT NULL);
CREATE TABLE user_roles (user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE, role fz_role NOT NULL REFERENCES roles(name), PRIMARY KEY(user_id, role));
CREATE TABLE subscription_accounts (user_id text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, tier fz_tier NOT NULL DEFAULT 'BASE', updated_at timestamptz NOT NULL DEFAULT now());
-- Catalog, not per-user overrides. Seed is checked against the centralized resolver.
CREATE TABLE subscription_entitlements (tier fz_tier NOT NULL, capability text NOT NULL CHECK (capability IN ('CAN_USE_FULL_LIBRARY','CAN_USE_ADAPTIVE_PROGRAMMING','CAN_USE_READINESS_ENGINE','CAN_USE_ADVANCED_PROGRESS','CAN_USE_RUN_TRACKING','CAN_USE_RUCK_TRACKING','CAN_USE_UNIT_PT','CAN_USE_LIVE_PT','CAN_USE_FORMATION_ANALYTICS')), PRIMARY KEY(tier,capability));
CREATE FUNCTION initialize_account_foundation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 INSERT INTO user_profiles(user_id,display_name) VALUES (NEW.id, NEW.name);
 INSERT INTO user_roles(user_id,role) VALUES (NEW.id,'USER');
 INSERT INTO subscription_accounts(user_id,tier) VALUES (NEW.id,'BASE');
 RETURN NEW;
END;
$$;
CREATE TRIGGER account_foundation AFTER INSERT ON users FOR EACH ROW EXECUTE FUNCTION initialize_account_foundation();
CREATE TABLE audit_events (
 id uuid PRIMARY KEY, actor_id text NOT NULL, action text NOT NULL,
 entity_type text NOT NULL CHECK(entity_type = 'ACCOUNT'), entity_id text NOT NULL,
 occurred_at timestamptz NOT NULL DEFAULT now(), reason text NOT NULL,
 metadata jsonb NOT NULL DEFAULT '{}'::jsonb, request_id uuid NOT NULL
);
CREATE INDEX audit_events_entity_time ON audit_events(entity_id, occurred_at);
CREATE FUNCTION prevent_audit_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Audit events are append-only'; END;
$$;
CREATE TRIGGER immutable_audit BEFORE UPDATE OR DELETE OR TRUNCATE ON audit_events FOR EACH STATEMENT EXECUTE FUNCTION prevent_audit_mutation();
CREATE TABLE request_limits (key text PRIMARY KEY, count integer NOT NULL, expires_at timestamptz NOT NULL);
CREATE INDEX request_limits_expiry ON request_limits(expires_at);
CREATE TABLE consumed_auth_tokens (hash text PRIMARY KEY, expires_at timestamptz NOT NULL);
CREATE INDEX consumed_auth_tokens_expiry ON consumed_auth_tokens(expires_at);

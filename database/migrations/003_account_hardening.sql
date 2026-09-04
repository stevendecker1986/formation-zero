ALTER TABLE users ALTER COLUMN enabled SET DEFAULT true;
-- Enforce Phase A data minimization even if an internal library API is misused.
ALTER TABLE users ADD CONSTRAINT no_profile_image CHECK (image IS NULL);
ALTER TABLE auth_sessions ADD CONSTRAINT no_session_tracking CHECK ("ipAddress" IS NULL AND "userAgent" IS NULL);
ALTER TABLE auth_identities ADD CONSTRAINT credential_only CHECK ("providerId" = 'credential' AND "accessToken" IS NULL AND "refreshToken" IS NULL AND "idToken" IS NULL);
-- Serialize session creation against disable operations on the same user.
CREATE FUNCTION require_enabled_session_user() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE is_enabled boolean;
BEGIN
 SELECT enabled INTO is_enabled FROM users WHERE id = NEW."userId" FOR UPDATE;
 IF NOT COALESCE(is_enabled, false) THEN RAISE EXCEPTION 'Account unavailable'; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER enabled_session_user BEFORE INSERT ON auth_sessions FOR EACH ROW EXECUTE FUNCTION require_enabled_session_user();

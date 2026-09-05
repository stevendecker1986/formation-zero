# Validation status and codes

- `PASS`: every required check passed and there are no findings.
- `WARN`: only codes explicitly listed by the server-owned policy as nonblocking occurred.
- `REJECT`: any blocking finding, unapproved warning, malformed input, unavailable policy or missing evidence occurred.

Codes are stable, version 1 and `ACTIVE`. The registry in `packages/validation-engine/src/index.ts` owns code, category, severity, blocking behavior and separate internal/public explanations. Categories cover structure, safety, restrictions, policy, content, rights, dose, time, composition, demand, equipment, environment, readiness, load, phase, objective, relationships, supervision, provenance, explanation, contradictions and privacy. `WARN` cannot remove a blocking finding; rejection reasons include every block and any unapproved warning.

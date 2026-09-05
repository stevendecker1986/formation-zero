# Offline individual execution

Offline behavior begins only after an authenticated server has created an authorized session. The web client may retain one minimum consumer-safe active snapshot for at most 24 hours and a maximum of 100 idempotent state/actual commands. It excludes sealed inputs, restricted traces, credentials, tokens, and full actual-note history. Account changes, logout, terminal completion, abandonment, or expiry clear the snapshot. Browser storage is origin-scoped but not a secure secret store; the cached projection is therefore deliberately limited.

The native client keeps its active snapshot and bounded queue in process memory only. It does not persist private training data until a reviewed secure native storage design is adopted. App termination clears it.

Reconnect replays commands in order with their original idempotency keys and expected versions. A conflict stops synchronization and requires fresh server state. Offline clients cannot generate prescriptions, validate, select policy, elevate entitlement, authorize substitutions, or change prescribed values. No GPS or Live PT behavior exists.

# Session execution state

The server owns a deterministic optimistic-concurrency state machine:

`NOT_STARTED → IN_PROGRESS ↔ PAUSED → COMPLETED`

`IN_PROGRESS or PAUSED → ABANDONED`

Every command carries the expected session version and a user-scoped idempotency key. Invalid transitions and stale versions return safe conflicts. Terminal states cannot restart. Navigation changes only `current_line`; skipping creates an ACTUAL record and does not remove a prescribed line.

Elapsed timers store accumulated milliseconds and an absolute server start instant. Pause folds the elapsed interval into the accumulator; resume starts a new interval. Clients reconstruct elapsed display after foreground/background changes from those values. Wall-clock rollback clamps an interval to zero. Operating systems may suspend rendering or terminate an app, so timers are execution aids and are reconciled from server state when connectivity resumes.

# Prescribed versus actual

PRESCRIBED is the exact immutable Phase D artifact authorized by Phase E and the delivery gate. `workout_sessions.prescription_snapshot` and the linked prescription/validation rows cannot be updated or deleted.

ACTUAL is append-only actor-owned evidence linked to a prescribed line index. It can record completed, partial, or skipped status and applicable sets, reps, load, duration, distance, intervals, rounds, rest, perceived effort, private notes, and a server-authorized substitution reference. Corrections insert a new row with `supersedes_actual_id`; they never overwrite either prior actual evidence or the prescription.

Phase F does not infer medical facts from notes and does not calculate readiness or training load.

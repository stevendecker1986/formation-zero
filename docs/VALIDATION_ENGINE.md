# Independent validation engine

`@formation-zero/validation-engine` is the Phase E framework-free checker. It parses a saved candidate prescription and its exact sealed construction context, performs its own arithmetic and composition checks, invokes Phase C with the exact rules for a fresh constraint decision, and returns deterministic `PASS`, `WARN`, or `REJECT` material.

The API owns policy selection, current publication/rights evidence, fingerprints and persistence. It decrypts the construction context only inside the validation transaction. Validation never edits or replaces a prescription. Results are appended to `prescription_validations`; timestamps and database record IDs stay outside deterministic engine material.

Phase E validates supplied readiness, load and phase facts. It does not calculate those values. It does not construct workouts or choose alternatives.

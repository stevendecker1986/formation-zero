# Prescription time validation

Phase E recomputes work, inter-set/inter-round rest, setup, transition, item totals, section totals, buffer, session total and unused time from primitive dose values. It rejects negative values, rest below the authoritative minimum, slot-duration violations, arithmetic differences and recalculated sessions beyond the requested budget. It never imports Phase D's timing helper.

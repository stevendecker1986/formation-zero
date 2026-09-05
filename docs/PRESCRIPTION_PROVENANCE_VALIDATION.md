# Prescription provenance validation

Phase E compares exact prescription, rule-engine, rule-set, rule, reason, knowledge, template, content and training-date references. It recomputes domain-separated HMAC fingerprints for the request and sealed construction input, reconstructs the prescription ID, and verifies a separate final-artifact HMAC. The input envelope uses AES-256-GCM with a key derived from the server secret. Missing provenance, changed requests, changed artifacts and mismatched versions reject.

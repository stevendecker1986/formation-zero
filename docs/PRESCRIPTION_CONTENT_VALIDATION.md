# Prescription content validation

Test validation accepts only fixed synthetic content and a fixed synthetic policy. Production validation accepts only exact non-synthetic template/content versions whose status, current-version state, required reviews, transitive references, still media and rights remain eligible at validation time. The API resolves this evidence from PostgreSQL. Pending B2 records remain excluded and a no-session artifact caused by a pending B2 request is rejected with content evidence.

# Privacy and data classification

Phase A stores only minimal ACCOUNT data and infrastructure required to secure it. It is fitness software, not diagnosis, treatment, physical therapy, or rehabilitation, and never overrides provider restrictions.

| Domain                    | Phase A data                                                                                                         | Visibility                                                                     |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| ACCOUNT                   | Email, display name, verification/enabled status, user ID, role memberships, tier, timestamps                        | Authenticated owner through account API; trusted server and database operators |
| ACCOUNT authentication    | Salted password hash, expiring sessions, hashed reset identifiers, consumed-token HMACs                              | Server only; never account response/log                                        |
| ACCOUNT security          | Actor/entity IDs, action, reason code, safe role/tier/enabled metadata, request ID, time; short-lived HMAC rate keys | Server/operator only; append-oriented audit                                    |
| FITNESS                   | Not collected                                                                                                        | No schema or access                                                            |
| SENSITIVE_HEALTH_ADJACENT | Not collected                                                                                                        | No schema or access                                                            |
| LOCATION                  | Not collected                                                                                                        | No GPS/device permissions                                                      |
| FORMATION                 | Not collected                                                                                                        | No formations or membership model                                              |

Display name need not be a legal name. No rank, unit, billet, fitness measurement, medical detail, or raw card data is collected. Better Auth's optional image, provider-token, IP and user-agent fields are unused and constrained to NULL. HMAC IP/email throttle keys expire after one minute; expired records are cleaned by maintenance. Logs contain no emails or raw IP addresses. Browser cookies identify sessions and are not analytics cookies.

Private health/readiness data must never automatically become leader-visible in future phases. A role, COMMAND subscription, or capability never creates a resource permission. Source rights are separate from account privacy; UNKNOWN rights cannot be published. Future sharing, retention, deletion/export workflows, and mobile account collection require explicitly scoped design before implementation.

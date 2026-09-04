# Source provenance

SOURCE records identify issuing authority, title (`name`), type, locator/URL, publication number/date, provenance and notes. SOURCE_VERSION records pin edition/change identifier, effective/superseded dates, checksum and locator. Each registry edit also has an immutable FZ version envelope. SOURCE_SECTION pins a source-version UUID plus section code/title, page range, paragraph, normalized locator and short excerpt note. CITATION pins the section and records purpose/support type/notes; the envelope records creator/time. Multiple citations can support one expression.

Provenance lookup follows stored references through citation → section → source version → source. It does not search the web or ingest text. Source-version and citation reads expose derived verification status, reviewer, review time, latest decision and re-review date, never client-editable verification booleans. The proposed verification type is EDITORIAL (ADR 0012 pending).

OFFICIAL, OFFICIAL_DERIVED, FZ_DERIVED, FZ_ORIGINAL and SUPPORTING_EVIDENCE retain their original meanings. Derived/evidence content requires a source chain for publication. Government hosting or an OFFICIAL tag does not establish copyright status. Author credentials likewise establish neither source authority nor reproduction rights.

Only locators and bounded notes are intended here. No bulk Marine Corps material, ISSA courseware, production exercise library or final media is included. Controlled source acquisition, license evidence and professional verification belong to separately authorized Phase B2 work.

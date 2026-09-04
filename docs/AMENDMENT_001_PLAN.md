# Amendment 001 — repository audit and implementation plan

Baseline: clean `main`, a9248ac57431b0cbda40c60a99bd8bdf7ddc139b; Phase A complete with hosted CI evidence. Read the full supplied amendment before changes. Phase B remains unstarted.

1. Preserve the supplied directive and original raster board as immutable references. No approved vector or formally approved palette/font files were supplied.
2. Preserve auth, authorization, database schema, roles, 0/6/9 entitlement mapping, commercial gate and all regression checks. Existing profiles require no military affiliation.
3. Replace scattered blue/green placeholder styles in shared UI, web/admin layouts and mobile shell with semantic tokens in the existing UI package. Use system font fallbacks; add no third-party font/image dependencies.
4. Apply consistent, responsive, accessible typography, surfaces, fields, buttons and tier presentation to existing shells only. No nonfunctional training navigation, metrics or future feature mockups.
5. Document universal positioning, source/authorship/qualification/review/rights separation, future editorial metadata, neutral onboarding, flexible group hierarchy, brand rules and asset replacement. Record ADR 0009 and the language audit.
6. Validate color contrast and shell semantics, run the full existing Phase A suite including real migrations, tests, builds, scans, smoke and failure probes. Inspect rendered shells. Push to the existing authorized main branch and observe actual hosted CI before claiming completion.

## Contextual terminology audit (baseline)

Search: case-insensitive whole words Marine, Marines, USMC, military, rank, MOS, unit, branch, billet, DoD across maintained repository text; dependency metadata/licenses, generated output and immutable supplied directives are not product copy.

| Locations                                                       | Classification and disposition                                                                                                    |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| README; shared UI footer; mobile disclaimer                     | A: valid independent-product / USMC / DoD nonendorsement boundary; preserve while widening product description.                   |
| PRIVACY_DATA_CLASSIFICATION; ARCHITECTURE; PHASE_A_REPORT       | A: data-minimization and absent rank/unit/billet schema statements; preserve and extend prohibited affiliation requirements.      |
| ARCHITECTURE; OPEN_DECISIONS; ADR 0004; TESTING; PHASE_A_REPORT | B: Unit PT capability naming / tests / approved entitlements; preserve identifiers and mapping, clarify COMMAND serves any group. |
| ADR 0008; REPOSITORY_AUDIT                                      | A/B: source/provenance and prohibited premature policy implementation; preserve.                                                  |
| tests/foundations.test.ts                                       | A: rejected extra `rank` profile input; preserve the security test.                                                               |
| CHANGELOG; PHASE_A_REPORT; ADR 0007                             | Nonproduct homonyms: Git branch, unit tests; preserve.                                                                            |
| Original Phase A directive and new amendment                    | Immutable instructions/source history; retain all legitimate references verbatim.                                                 |

No C (incorrect generic user assumption) was found. D: blue/green placeholder styling is obsolete visual positioning and is replaced; generic “Independent fitness software” copy is expanded to the universal positioning. No valid military source/legal term is mechanically removed.

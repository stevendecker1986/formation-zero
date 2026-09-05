import { writeFile } from "node:fs/promises";
import { sources, checkedOn } from "../database/corpus/sources.js";
import { records, exercises, auditInputs } from "../database/corpus/records.js";
import { recovery } from "../database/corpus/recovery.js";
import { equipment } from "../database/corpus/equipment.js";
import { requiredReviews } from "@formation-zero/knowledge";
const table = (headers: string[], rows: unknown[][]) =>
  [
    headers.join(" | "),
    headers.map(() => "---").join(" | "),
    ...rows.map((r) =>
      r.map((v) => String(v ?? "Not stated").replaceAll("|", "/ ")).join(" | "),
    ),
  ].join("\n");
const write = (name: string, text: string) =>
  writeFile(`docs/${name}.md`, text + "\n");
const inputs = records();
const audit = auditInputs();
await write(
  "SOURCE_MANIFEST",
  `# Controlled B2 source manifest

Research checked on ${checkedOn} UTC. 26 official sources: 11 USMC and 15 USU/CHAMP/HPRC. The registry uses OFFICIAL to identify issuing provenance; original candidates are FZ_DERIVED, not official instruction. Source hierarchy follows the directive. Lower-level education never overrides an order or subsequent change.

CURRENT means the identified publisher resource/current official index was checked for the stated use; it is not permanent authority, scientific consensus or professional verification. Professional EDITORIAL verification remains UNVERIFIED for every source version. Source bytes were not archived; blank checksums are deliberate, not fabricated hashes. Web pages without stated publication dates retain null. Educational resources have no invented legal effective date.

Text research and media rights are separate: all 26 source rights records are UNKNOWN with commercial use false. No source photos, videos, manuals or proprietary courseware are imported. Principle notes below support category/context choices, not certification of every original instruction, score or safety claim.

## Registry

${table(
  [
    "Key / title",
    "Authority / type",
    "Version / number",
    "Publication / effective",
    "Currency",
    "Official locator and inspected section",
    "Principle / intended use",
    "Authority and rights limits",
  ],
  sources.map((s) => [
    s.key + " — " + s.title,
    s.authority + " / " + s.type,
    s.version,
    (s.published ?? "Not stated") +
      " / " +
      (s.effective ?? "Not stated / not applicable"),
    s.status,
    `[Official source](${s.url}); ${s.locator}`,
    s.principle,
    s.notes + " Rights UNKNOWN; media rights not inferred.",
  ]),
)}

## Supersession and boundaries

MCO 6100.13A ADMIN CH-5 is read with 613/25. MCO 6110.3A ADMIN CH-4 has affected evaluation provisions replaced by 066/26, itself corrected by 073/26. The first two messages are not treated as wholly cancelled. Registry statuses: 22 CURRENT, 1 AMENDED, 3 PARTIALLY_SUPERSEDED. No fully superseded or future-effective source is used to support a candidate. No water-survival content is populated, so the future October 2026 water-order transition is outside this corpus.

MCMAP appears as a boundary source only. SMIP identifies professional scope; it supplies no rehabilitation instructions. The old HPRC active-recovery article is limited to light activity/rest concepts: lactic-acid explanations, cold immersion and pain-tolerant rolling are expressly excluded. No stale sit-up-test article was included.

Before publication or later policy use, assigned reviewers must recheck controlling orders, updates and the exact cited passages. Policy records are registry context only; B2 implements no policy calculations.
`,
);
await write(
  "INITIAL_EXERCISE_CORPUS",
  `# Initial exercise corpus

Exactly 100 production-candidate entities in four batches of 25. Each batch was schema-validated before proceeding. All are INGESTED, FZ_DERIVED, UNKNOWN rights and pending TECHNICAL, SAFETY, EDITORIAL and RIGHTS review. Original instructions/cues/faults/cautions are checked in under database/corpus; citations support principle context only. Database-issued stable FZ codes remain attached to entities across editorial versions; import keys identify the same candidate across environments.

${table(
  [
    "Import key",
    "Batch",
    "Name",
    "Movement",
    "Capability",
    "Complexity",
    "Related candidate",
    "Source principle",
  ],
  exercises.map((e) => [
    e.key,
    e.batch,
    e.data.name,
    e.data.primary_movement,
    e.data.primary_capability,
    e.data.technical_complexity,
    e.prior ?? "None",
    e.sources.join(", "),
  ]),
)}

## Classification audit

${table(["Primary movement", "Count"], Object.entries(audit.movements))}

${table(["Primary capability", "Count"], Object.entries(audit.capabilities))}

Aquatic is intentionally absent: no supervised water environment is assumed. Zero counts are reported, not filled with unsafe or redundant material. Scores use the existing 0–5 scale and complexity 1–5. They are provisional editorial judgments, not measured workload. Each record includes a rationale and cautions; professional reviewers must assess these ratings.

Variants such as floor/incline/knee push-ups, loaded/unloaded lunges and lateral/forward crawls have distinct mechanics and explicit lineage. Aliases are empty rather than invented. Relationships are editorial alternatives, not automatic safe substitutions. No Phase C selection or prescription logic exists.
`,
);
await write(
  "INITIAL_RECOVERY_CORPUS",
  `# Initial recovery corpus

Exactly 30 production-candidate entities. All INGESTED / FZ_DERIVED / UNKNOWN rights, with TECHNICAL, SAFETY, EDITORIAL and RIGHTS pending. General education only; no clinical nutrition, diagnosis, rehabilitation, supplement protocol or fixed dosing. Educational duration fields explicitly avoid prescription.

${table(
  ["Key", "Name", "Category", "Principle source", "Original draft"],
  recovery.map((r) => [r.key, r.name, r.category, r.source, r.instructions]),
)}
`,
);
await write(
  "EQUIPMENT_CATALOG",
  `# Justified B2 equipment

16 catalog entries, each referenced by the corpus. Bodyweight and ordinary surroundings use an empty equipment list; no artificial equipment entry is added. Walls, safe floor/lanes and support surfaces are site conditions identified in instructions. No brand, vendor or endorsement implied.

${table(
  [
    "Key",
    "Name",
    "Category",
    "Mobility",
    "Quantity",
    "Exercise references",
    "Recovery references",
  ],
  equipment.map(([key, name, category, mobility, quantity]) => [
    key,
    name,
    category,
    mobility,
    quantity,
    exercises
      .filter((e) => e.equipment.includes(key))
      .map((e) => e.key)
      .join(", "),
    recovery
      .filter((r) => r.equipment.includes(key))
      .map((r) => r.key)
      .join(", "),
  ]),
)}
`,
);
await write(
  "MEDIA_PRODUCTION_BACKLOG",
  `# B2 media production backlog

100 still-sequence requirements; zero production assets generated or imported. Minimum 3 stills each; ${exercises.filter((e) => e.media.recommended_images === 3).length} sequences recommend 3 views and ${exercises.filter((e) => e.media.recommended_images === 4).length} recommend 4. All require technical media and rights review. Video required is false for all; ${exercises.filter((e) => e.media.video_recommended).length} recommend optional video because timing/coordination is harder to show. Photography remains future authorized work.

${table(
  [
    "Exercise",
    "Required views",
    "Motion complexity",
    "Optional video recommended",
  ],
  exercises.map((e) => [
    e.key + " — " + e.data.name,
    (e.media.required_views as string[]).join(", "),
    e.media.motion_complexity,
    e.media.video_recommended,
  ]),
)}

Future production must establish creator/subject permissions, ownership, license, storage, captions and qualified technical review through the existing media/rights gates. These are pending requirements, not completed approvals.
`,
);
await write(
  "CONTENT_REVIEW_BACKLOG",
  `# B2 review backlog

510 imported records; zero review events or approvals. All ${inputs.reduce((n, r) => n + requiredReviews(r.kind, r.data.provenance).length, 0)} required review-type slots are pending. 26 SOURCE records are DISCOVERED; other 484 records are INGESTED. No candidate is PUBLISHED. A backlog is a derived queue, not fabricated review history.

${table(
  ["Kind", "Records", "Required types"],
  [...new Set(inputs.map((r) => r.kind))].map((k) => {
    const rows = inputs.filter((r) => r.kind === k);
    return [
      k,
      rows.length,
      requiredReviews(k, rows[0]!.data.provenance).join(", "),
    ];
  }),
)}

All 156 rights records are UNKNOWN, commercial use false. Source factual research, original draft ownership and future image licensing are distinct decisions. All 130 candidate approvals remain blocked by rights, professional reviews and source verification; all 100 exercises also lack required still assets. Independent final approver rules remain enforced.

Founder metadata records the owner-reported ISSA Certified Personal Trainer and ISSA Specialist in Bodybuilding credentials without identifiers, dates or invented verification. Qualification records remain INACTIVE/UNVERIFIED pending evidence. Draft preparation is attributed to Codex-assisted Formation Zero work, not falsely to a qualified founder or reviewer. No ISSA courseware or endorsement is present.

Use CMS corpus filter PHASE_B2_INITIAL, collection and PENDING review filters. Recheck source currency, assess every instruction and classification, record real review decisions, then produce rights-cleared media only under separate authorization. Nutrition and complex movements may need appropriately qualified specialists; none have been impersonated.
`,
);
console.log(JSON.stringify(audit, null, 2));

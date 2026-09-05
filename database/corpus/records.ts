import {
  type Kind,
  type Payload,
  MOVEMENTS,
  CAPABILITIES,
  parsePayload,
} from "@formation-zero/knowledge";
import { sources, checkedOn } from "./sources.js";
import { batch1 } from "./exercises.js";
import { batch2 } from "./batch2.js";
import { batch3 } from "./batch3.js";
import { batch4 } from "./batch4.js";
import { recovery } from "./recovery.js";
import { equipment } from "./equipment.js";
export const exercises = [...batch1, ...batch2, ...batch3, ...batch4];
export type RecordInput = {
  key: string;
  kind: Kind;
  batch: number;
  data: Payload;
};
const ref = (key: string) => `@${key}`;
export function records(): RecordInput[] {
  const result: RecordInput[] = [];
  const add = (key: string, kind: Kind, data: Payload, batch = 0) => {
    result.push({ key, kind, data, batch });
    return ref(key);
  };
  const rights = (key: string, owner: string, source: string) =>
    add(`rights-${key}`, "RIGHTS", {
      name: `Rights review — ${key}`,
      notes:
        "UNKNOWN. Research access is not commercial clearance. No embedded media license or professional approval inferred.",
      classification: "UNKNOWN",
      rights_holder: owner,
      creator: owner,
      source,
      license: "Pending rights assessment; no commercial license recorded",
      commercial_use_allowed: false,
      modification_allowed: false,
      attribution_required: true,
      permission_reference: "",
    });
  const author = add("draft-author", "AUTHOR", {
    name: "Formation Zero — Codex-assisted draft preparation",
    author_role: "Machine-assisted draft preparation for owner review",
    public_affiliation: "Formation Zero",
    platform_user_id: null,
    active: true,
    notes:
      "No professional qualification, human authorship approval or endorsement asserted.",
  });
  const founder = add("founder", "AUTHOR", {
    name: "Formation Zero founder",
    author_role: "Founder; owner-reported qualifications",
    public_affiliation: "Formation Zero",
    platform_user_id: null,
    active: true,
    notes:
      "Identity/display attribution requires owner confirmation before publication. Not falsely assigned as author or reviewer of machine-generated drafts.",
  });
  for (const [key, name] of [
    ["cpt", "ISSA Certified Personal Trainer"],
    ["bodybuilding", "ISSA Specialist in Bodybuilding"],
  ])
    add(`qualification-${key}`, "QUALIFICATION", {
      name,
      person: founder,
      credential_name: name,
      issuing_organization: "ISSA",
      credential_identifier: "",
      status: "INACTIVE",
      issued_date: null,
      expiration_date: null,
      notes:
        "Owner-reported in authoritative B2 directive. Supporting evidence not supplied; TECHNICAL verification pending. INACTIVE prevents claiming an active verified credential. No endorsement or content-reproduction rights.",
    });
  for (const s of sources) {
    const r = rights(`source-${s.key}`, s.authority, s.url);
    const source = add(`source-${s.key}`, "SOURCE", {
      name: s.title,
      issuing_authority: s.authority,
      source_type: s.type,
      source_url: s.url,
      publication_number: s.number,
      publication_date: s.published,
      provenance: "OFFICIAL",
      rights: r,
      notes: s.notes,
    });
    const version = add(`source-version-${s.key}`, "SOURCE_VERSION", {
      name: `${s.title} — ${s.version}`,
      source,
      version_identifier: s.version,
      effective_date: s.effective,
      superseded_date: null,
      change_identifier: s.number,
      checksum: "",
      locator: s.url,
      currency_observation: {
        status: s.status,
        checked_on: checkedOn,
        evidence_url: s.url,
        scope:
          s.type === "ARTICLE"
            ? "Current publisher educational resource; not policy authority"
            : "Official index and identified change chain",
        notes: s.notes,
      },
      notes:
        "Codex retrieved official source and inspected the stated locator. This observation is not EDITORIAL verification; review remains pending. No source bytes or media copied.",
    });
    const section = add(`section-${s.key}`, "SOURCE_SECTION", {
      name: `${s.title} — principle locator`,
      source_version: version,
      section_code: s.key,
      paragraph_locator: s.locator,
      normalized_locator: s.url,
      excerpt_note: s.principle,
      notes: "Original concise principle note; not a verbatim excerpt.",
    });
    add(`citation-${s.key}`, "CITATION", {
      name: `Principle citation — ${s.key}`,
      section,
      purpose: s.principle,
      support_type:
        "Principle context only; original instructions and provisional classifications require independent review",
      notes:
        "Does not certify technique, dosing, safety or rights of the candidate.",
    });
  }
  for (const [key, name, category, mobility, quantity_semantics] of equipment)
    add(`equipment-${key}`, "EQUIPMENT", {
      name,
      category,
      mobility,
      quantity_semantics,
      aliases: [],
      provenance: "FZ_ORIGINAL",
      notes:
        "Included only because at least one B2 candidate references it. Equipment setup and manufacturer limits require review.",
    });
  for (const e of exercises) {
    const media = add(`media-${e.key}`, "MEDIA_REQUIREMENT", e.media, e.batch);
    const r = rights(
      e.key,
      "Formation Zero — ownership review pending",
      "Original Codex-assisted draft; no source media imported",
    );
    const secondary =
      e.data.primary_movement === "Carry"
        ? ["Locomotion", "Brace"]
        : e.data.primary_movement === "Throw"
          ? ["Rotation"]
          : [];
    add(
      e.key,
      "EXERCISE",
      {
        ...e.data,
        secondary_movements: secondary,
        author,
        rights: r,
        provenance: "FZ_DERIVED",
        citations: e.sources.map((s) => ref(`citation-${s}`)),
        equipment: e.equipment.map((k) => ref(`equipment-${k}`)),
        media_requirement: media,
        parent_exercise: e.prior ? ref(e.prior) : null,
        relationships: e.prior
          ? [
              {
                type: "SUBSTITUTION",
                target: ref(e.prior),
                notes:
                  "Related editorial alternative, not an automatic safe substitution or prescription. Compare each candidate's cautions and equipment.",
              },
            ]
          : [],
      },
      e.batch,
    );
  }
  for (const r of recovery)
    add(
      r.key,
      "RECOVERY",
      {
        name: r.name,
        notes:
          "Original Codex-assisted general education draft. All professional reviews pending. No clinical treatment, individualized nutrition or automatic recovery prescription.",
        author,
        rights: rights(
          r.key,
          "Formation Zero — ownership review pending",
          "Original Codex-assisted draft",
        ),
        provenance: "FZ_DERIVED",
        citations: [ref(`citation-${r.source}`)],
        equipment: r.equipment.map((k) => ref(`equipment-${k}`)),
        category: r.category,
        purpose: r.name,
        typical_use: r.instructions,
        demand: r.demand,
        intensity: r.demand
          ? "Easy, comfortable movement"
          : "Education or rest; no exertion target",
        duration_guidance:
          "No fixed duration prescribed. Choose a comfortable opportunity; qualified review pending.",
        body_area: "Whole person",
        relationships: [
          {
            target_type: (MOVEMENTS as readonly string[]).includes(r.target)
              ? "MOVEMENT"
              : "CAPABILITY",
            target: r.target,
            notes: "Editorial association only; no selection rule.",
          },
        ],
      },
      5,
    );
  return result;
}
export function resolveRefs(value: unknown, ids: Map<string, string>): unknown {
  if (typeof value === "string" && value.startsWith("@")) {
    const id = ids.get(value.slice(1));
    if (!id) throw new Error(`Unresolved reference ${value}`);
    return id;
  }
  if (Array.isArray(value)) return value.map((v) => resolveRefs(v, ids));
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, resolveRefs(v, ids)]),
    );
  return value;
}
export function auditInputs(input = records()) {
  const ids = new Map<string, string>(),
    names = new Set<string>();
  for (const [index, r] of input.entries()) {
    if (ids.has(r.key)) throw new Error(`Duplicate key ${r.key}`);
    const name = `${r.kind}:${String(r.data.name)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")}`;
    if (names.has(name)) throw new Error(`Duplicate name ${name}`);
    names.add(name);
    parsePayload(r.kind, resolveRefs(r.data, ids));
    ids.set(
      r.key,
      `10000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    );
  }
  for (const kind of ["EXERCISE", "RECOVERY"]) {
    const count = input.filter((r) => r.kind === kind).length;
    if (count !== (kind === "EXERCISE" ? 100 : 30))
      throw new Error(`Wrong ${kind} count ${count}`);
  }
  for (let b = 1; b <= 4; b++)
    if (
      input.filter((r) => r.kind === "EXERCISE" && r.batch === b).length !== 25
    )
      throw new Error(`Wrong batch ${b}`);
  const used = new Set([
    ...exercises.flatMap((e) => e.equipment),
    ...recovery.flatMap((r) => r.equipment),
  ]);
  for (const [key] of equipment)
    if (!used.has(key)) throw new Error(`Unused equipment ${key}`);
  return {
    records: input.length,
    exercises: 100,
    recovery: 30,
    batches: [25, 25, 25, 25],
    equipment: equipment.length,
    sources: sources.length,
    media_requirements: 100,
    production_media: 0,
    movements: Object.fromEntries(
      MOVEMENTS.map((m) => [
        m,
        exercises.filter((e) => e.data.primary_movement === m).length,
      ]),
    ),
    capabilities: Object.fromEntries(
      CAPABILITIES.map((m) => [
        m,
        exercises.filter((e) => e.data.primary_capability === m).length,
      ]),
    ),
  };
}

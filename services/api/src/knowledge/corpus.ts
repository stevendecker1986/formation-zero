import type pg from "pg";
import { requiredReviews, type Payload } from "@formation-zero/knowledge";
import { access, type Actor, type Version } from "./store.js";
import { transaction } from "../db.js";
const fields = new Set([
  "name",
  "aliases",
  "summary",
  "instructions",
  "coaching_cues",
  "common_faults",
  "cautions",
  "classification_rationale",
  "provenance",
  "citations",
  "equipment",
  "primary_movement",
  "secondary_movements",
  "primary_capability",
  "secondary_capabilities",
  "technical_complexity",
  "demand_profile",
  "formation_suitability",
  "individual_suitability",
  "scaling_available",
  "restrictions",
  "media_requirement",
  "media_assets",
  "parent_exercise",
  "variant",
  "relationships",
  "category",
  "purpose",
  "typical_use",
  "demand",
  "intensity",
  "duration_guidance",
  "body_area",
  "issuing_authority",
  "source_type",
  "source_url",
  "publication_number",
  "publication_date",
  "source",
  "source_version",
  "version_identifier",
  "effective_date",
  "superseded_date",
  "change_identifier",
  "locator",
  "currency_observation",
  "section",
  "section_code",
  "page_start",
  "page_end",
  "paragraph_locator",
  "excerpt_note",
  "normalized_locator",
  "support_type",
  "mobility",
  "quantity_semantics",
  "media_requirement_type",
  "minimum_images",
  "recommended_images",
  "maximum_images",
  "required_views",
  "motion_complexity",
  "video_recommended",
  "video_required",
  "technical_media_review_required",
  "rights_review_required",
  "classification",
  "commercial_use_allowed",
  "modification_allowed",
  "attribution_required",
]);
function count(values: string[]) {
  return values.reduce<Record<string, number>>((out, v) => {
    out[v] = (out[v] ?? 0) + 1;
    return out;
  }, {});
}
export async function inspectCorpus(pool: pg.Pool, actor: Actor) {
  return transaction(pool, async (c) => {
    await access(c, actor);
    const rows = (
      await c.query<
        Version & { member_key: string; batch: number; review_events: number }
      >(
        `SELECT v.*,e.code,e.kind,s.status,s.revision,cm.member_key,cm.batch,(SELECT count(*)::int FROM kb_reviews r WHERE r.version_id=v.id) review_events FROM kb_corpus_members cm JOIN kb_entities e ON e.id=cm.entity_id JOIN LATERAL (SELECT * FROM kb_versions WHERE entity_id=e.id ORDER BY version DESC LIMIT 1) v ON true JOIN kb_states s ON s.version_id=v.id WHERE cm.corpus='PHASE_B2_INITIAL' ORDER BY cm.member_key`,
      )
    ).rows;
    const content = rows.filter(
      (v) => !["AUTHOR", "QUALIFICATION", "REVIEWER"].includes(v.kind),
    );
    const exercise = content.filter((v) => v.kind === "EXERCISE"),
      recovery = content.filter((v) => v.kind === "RECOVERY");
    return {
      corpus: "PHASE_B2_INITIAL",
      notice:
        "Editorial inspection only. Research observations and review-event counts do not constitute verification or publication approval.",
      counts: {
        kinds: count(rows.map((v) => v.kind)),
        lifecycle: count(rows.map((v) => v.status)),
        rights: count(
          content
            .filter((v) => v.kind === "RIGHTS")
            .map((v) => String(v.payload.classification)),
        ),
        exercise_batches: count(exercise.map((v) => String(v.batch))),
        recovery_categories: count(
          recovery.map((v) => String(v.payload.category)),
        ),
        primary_movements: count(
          exercise.map((v) => String(v.payload.primary_movement)),
        ),
        primary_capabilities: count(
          exercise.map((v) => String(v.payload.primary_capability)),
        ),
        citation_coverage: {
          exercises: exercise.filter(
            (v) => (v.payload.citations as string[]).length > 0,
          ).length,
          recovery: recovery.filter(
            (v) => (v.payload.citations as string[]).length > 0,
          ).length,
        },
        review_events: rows.reduce((n, v) => n + v.review_events, 0),
      },
      records: content.map((v) => ({
        key: v.member_key,
        id: v.id,
        code: v.code,
        kind: v.kind,
        version: v.version,
        status: v.status,
        batch: v.batch,
        required_review_types: requiredReviews(v.kind, v.payload.provenance),
        review_event_count: v.review_events,
        payload: Object.fromEntries(
          Object.entries(v.payload).filter(([k]) => fields.has(k)),
        ) as Payload,
      })),
    };
  });
}

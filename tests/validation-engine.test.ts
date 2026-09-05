import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { prescribe } from "@formation-zero/prescription-engine";
import { fixture } from "@formation-zero/prescription-engine/fixtures";
import { syntheticRule } from "@formation-zero/rule-engine/fixtures";
import {
  CATEGORIES,
  keyedFingerprint,
  validate,
  type ValidationInput,
} from "@formation-zero/validation-engine";

const secret = "synthetic-phase-e-secret";
const clone = <T>(value: T): T => structuredClone(value);

test("validator package has no Phase D construction dependency", async () => {
  const manifest = JSON.parse(
    await readFile("packages/validation-engine/package.json", "utf8"),
  );
  assert.equal(
    manifest.dependencies["@formation-zero/prescription-engine"],
    undefined,
  );
  for (const file of ["src/index.ts", "src/schemas.ts"])
    assert.equal(
      (await readFile("packages/validation-engine/" + file, "utf8")).includes(
        "@formation-zero/prescription-engine",
      ),
      false,
    );
});

function signedInput(
  objective: Parameters<typeof fixture>[0] = "GENERAL_READINESS",
  alter?: (value: ReturnType<typeof fixture>) => void,
) {
  const construction = fixture(objective);
  alter?.(construction);
  const prescription = prescribe(construction);
  assert.equal(prescription.outcome, "CANDIDATE_SESSION");
  assert.ok(prescription.provenance);
  prescription.provenance.request_fingerprint = keyedFingerprint(
    secret,
    construction.request,
  );
  prescription.provenance.material_fingerprint = keyedFingerprint(
    secret,
    construction,
  );
  prescription.prescription_id =
    "FZ-RX-" + prescription.provenance.material_fingerprint;
  if (prescription.internal.base) {
    prescription.internal.base.input_hash = keyedFingerprint(
      secret,
      prescription.internal.base.input_hash,
    );
    prescription.internal.base.evaluation_id =
      "FZ-EVAL-" +
      keyedFingerprint(secret, prescription.internal.base.evaluation_id);
  }
  const input: ValidationInput = {
    ...construction,
    prescription,
    policy: {
      version_id: "SYNTHETIC-E-POLICY:1",
      version: "SYNTHETIC-E-POLICY-V1",
      status: "TEST_ONLY",
      synthetic: true,
      production_eligible: false,
      allowed_prescription_engines: ["1.0.0"],
      allowed_rule_engines: ["1.0.0"],
      approved_nonblocking_codes: ["FZ-VAL-STRUCTURE-090"],
    },
    authority: {
      template: { published: false, production_eligible: false },
      content: Object.fromEntries(
        construction.candidates.map((candidate) => [
          candidate.content.content_version,
          {
            published: false,
            production_eligible: false,
            rights_eligible: false,
            reviews_eligible: false,
            current_for_new_use: true,
          },
        ]),
      ),
    },
    stored_input_fingerprint: "",
    stored_artifact_fingerprint: "",
  };
  return resign(input);
}

function resign(input: ValidationInput) {
  const construction = {
    request: input.request,
    candidates: input.candidates,
    template: input.template,
    rules: input.rules,
    rule_set_version: input.rule_set_version,
    knowledge_version: input.knowledge_version,
  };
  input.stored_input_fingerprint = keyedFingerprint(secret, construction);
  if (input.prescription.provenance) {
    input.prescription.provenance.request_fingerprint = keyedFingerprint(
      secret,
      input.request,
    );
    input.prescription.provenance.material_fingerprint =
      input.stored_input_fingerprint;
    input.prescription.prescription_id =
      "FZ-RX-" + input.stored_input_fingerprint;
  }
  input.stored_artifact_fingerprint = keyedFingerprint(
    secret,
    input.prescription,
    "formation-zero-prescription-artifact-v1",
  );
  return input;
}

function selected(input: ValidationInput, index = 0) {
  const line = input.prescription.session!.lines[index]!;
  return {
    line,
    candidate: input.candidates.find(
      (candidate) => candidate.content.content_version === line.content_version,
    )!,
  };
}

test("independent validation PASS/WARN, determinism and all-category execution", () => {
  const input = signedInput();
  const first = validate(input, secret);
  const second = validate(clone(input), secret);
  assert.ok(["PASS", "WARN"].includes(first.status));
  assert.deepEqual(first, second);
  assert.deepEqual(first.checks_executed, [...CATEGORIES]);
  assert.equal(first.rejection_reasons.length, 0);
  if (first.status === "WARN")
    assert.deepEqual(first.warnings, ["FZ-VAL-STRUCTURE-090"]);
});

test("golden constrained, relationship, recovery, warning and shuffled-input scenarios", () => {
  const warning = validate(
    signedInput(
      "GENERAL_READINESS",
      (x) => (x.request.duration_seconds = 1200),
    ),
    secret,
  );
  assert.equal(warning.status, "WARN");
  assert.deepEqual(warning.warnings, ["FZ-VAL-STRUCTURE-090"]);
  for (const readiness of ["YELLOW", "ORANGE"])
    assert.ok(
      ["PASS", "WARN"].includes(
        validate(
          signedInput("GENERAL_READINESS", (x) => {
            x.request.facts["readiness.state"] = readiness;
          }),
          secret,
        ).status,
      ),
    );
  assert.ok(
    ["PASS", "WARN"].includes(
      validate(
        signedInput("RECOVERY", (x) => {
          x.request.facts["readiness.state"] = "RED";
        }),
        secret,
      ).status,
    ),
  );
  const substitution = signedInput("GENERAL_READINESS", (x) => {
    x.request.relationship_requests = [
      {
        from_version: "SYNTHETIC-D:loaded-push:1",
        type: "SUBSTITUTION",
      },
    ];
  });
  assert.ok(
    substitution.prescription.session!.lines.some((line) =>
      line.selection_reasons.includes("EXPLICIT_RELATIONSHIP"),
    ),
  );
  assert.ok(["PASS", "WARN"].includes(validate(substitution, secret).status));
  const shuffled = signedInput("GENERAL_READINESS", (x) => {
    x.candidates.reverse();
    x.rules.reverse();
    x.template.slots.reverse();
    for (const candidate of x.candidates)
      candidate.metadata.dose_options.reverse();
  });
  assert.ok(["PASS", "WARN"].includes(validate(shuffled, secret).status));
});

test("30 adversarial mutations independently REJECT with stable codes", async (t) => {
  const mutations: [
    string,
    string,
    (input: ValidationInput) => void,
    boolean?,
  ][] = [
    [
      "1 insert Phase C-blocked exercise",
      "FZ-VAL-SAFETY-001",
      (x) => {
        x.request.facts["safety.pain"] = true;
        selected(x).candidate.content.tags = [
          ...(selected(x).candidate.content.tags ?? []),
          "progression",
        ];
      },
    ],
    [
      "2 insert unpublished B2-shaped exercise",
      "FZ-VAL-CONTENT-001",
      (x) => production(x, "published"),
    ],
    [
      "3 alter content version",
      "FZ-VAL-CONTENT-001",
      (x) => (selected(x).line.content_version = "altered-version"),
    ],
    [
      "4 alter rule-set reference",
      "FZ-VAL-PROVENANCE-001",
      (x) => (x.rule_set_version = "altered-rule-set"),
    ],
    [
      "5 tamper fingerprinted request",
      "FZ-VAL-PROVENANCE-002",
      (x) => (x.prescription.provenance!.request_fingerprint = "0".repeat(64)),
      false,
    ],
    [
      "6 exceed time budget",
      "FZ-VAL-TIME-002",
      (x) => (x.request.duration_seconds = 1),
    ],
    [
      "7 remove required rest",
      "FZ-VAL-TIME-003",
      (x) => (selected(x, 1).line.dose.rest_seconds = 0),
    ],
    [
      "8 negative rest",
      "FZ-VAL-TIME-003",
      (x) => (selected(x).line.dose.rest_seconds = -1),
    ],
    [
      "9 exceed intensity cap",
      "FZ-VAL-DOSE-002",
      (x) => {
        x.request.facts["readiness.state"] = "ORANGE";
        selected(x).line.dose.intensity.level = 3;
      },
    ],
    [
      "10 exceed volume cap",
      "FZ-VAL-DEMAND-001",
      (x) => {
        selected(x, 3).candidate.content.demand.lower_body_demand = 4;
        x.rules.push(
          syntheticRule(
            900,
            6,
            { op: "EXISTS", path: "candidate.status" },
            [{ type: "MODIFY_LIMIT", key: "lower_body", value: 1 }],
            "MODIFICATION",
          ),
        );
      },
    ],
    [
      "11 unavailable equipment",
      "FZ-VAL-EQUIPMENT-001",
      (x) => (selected(x).candidate.content.equipment = ["SYNTHETIC-MISSING"]),
    ],
    [
      "12 overhead under restriction",
      "FZ-VAL-RESTRICTION-001",
      (x) => {
        selected(x).candidate.content.tags = [
          ...(selected(x).candidate.content.tags ?? []),
          "overhead",
        ];
        x.request.facts["restrictions.overhead_allowed"] = false;
      },
    ],
    [
      "13 jumping under high-impact restriction",
      "FZ-VAL-RESTRICTION-001",
      (x) => {
        selected(x).candidate.content.movement = "Jump";
        selected(x).candidate.content.demand.impact_demand = 4;
        x.request.facts["restrictions.high_impact_allowed"] = false;
      },
    ],
    [
      "14 strenuous work under RED",
      "FZ-VAL-READINESS-001",
      (x) => {
        selected(x).candidate.content.intensity = 4;
        selected(x).line.dose.intensity.level = 4;
        x.request.facts["readiness.state"] = "RED";
      },
    ],
    [
      "15 ignore ORANGE cap",
      "FZ-VAL-READINESS-001",
      (x) => {
        selected(x).line.dose.intensity.level = 3;
        x.request.facts["readiness.state"] = "ORANGE";
      },
    ],
    [
      "16 invalid substitution direction",
      "FZ-VAL-RELATIONSHIP-001",
      (x) => (selected(x).line.selection_reasons = ["EXPLICIT_RELATIONSHIP"]),
    ],
    [
      "17 substitution needs unavailable equipment",
      "FZ-VAL-EQUIPMENT-001",
      (x) => {
        selected(x).line.selection_reasons = ["EXPLICIT_RELATIONSHIP"];
        selected(x).candidate.content.equipment = ["SYNTHETIC-MISSING"];
      },
    ],
    [
      "18 prohibited duplicate item",
      "FZ-VAL-MOVEMENT-001",
      (x) =>
        x.prescription.session!.lines.push(
          clone(x.prescription.session!.lines[0]!),
        ),
    ],
    [
      "19 remove required primary section",
      "FZ-VAL-STRUCTURE-002",
      (x) => {
        const i = x.prescription.session!.lines.findIndex(
          (l) => l.section === "PRIMARY",
        );
        x.prescription.session!.lines.splice(i, 1);
      },
    ],
    [
      "20 corrupt objective-template pairing",
      "FZ-VAL-OBJECTIVE-001",
      (x) => (x.template.objective = "RECOVERY"),
    ],
    [
      "21 mismatch public rationale",
      "FZ-VAL-EXPLAIN-001",
      (x) => (x.prescription.public_rationale = "Forged rationale"),
    ],
    [
      "22 remove provenance field",
      "FZ-VAL-PROVENANCE-001",
      (x) => {
        delete x.prescription.provenance;
      },
    ],
    [
      "23 tamper saved prescription after validation",
      "FZ-VAL-PROVENANCE-002",
      (x) => (x.prescription.session!.total_seconds += 1),
      false,
    ],
    [
      "24 client-forged PASS",
      "FZ-VAL-STRUCTURE-001",
      (x) => Object.assign(x, { validation_status: "PASS" }),
    ],
    [
      "25 client-forged validation policy version",
      "FZ-VAL-POLICY-AVAILABLE-001",
      (x) => {
        x.policy.synthetic = false;
        x.policy.status = "ACTIVE";
      },
    ],
    [
      "26 retired exact content ref",
      "FZ-VAL-RIGHTS-001",
      (x) => {
        production(x, "rights_eligible");
        inputAuthority(x).current_for_new_use = false;
      },
    ],
    [
      "27 missing required recovery",
      "FZ-VAL-READINESS-001",
      (x) => (x.request.facts["readiness.state"] = "RED"),
    ],
    [
      "28 malformed interval math",
      "FZ-VAL-TIME-001",
      (x) => {
        selected(x).line.dose.volume = {
          kind: "INTERVALS",
          rounds: 3,
          work_seconds: 20,
        };
      },
    ],
    [
      "29 stated total differs from independent total",
      "FZ-VAL-TIME-001",
      (x) => (x.prescription.session!.total_seconds += 1),
    ],
    [
      "30 supervision-required without supervision",
      "FZ-VAL-SUPERVISION-001",
      (x) => {
        selected(x).candidate.content.supervision_required = true;
        x.request.facts["formation.supervised"] = false;
      },
    ],
  ];
  assert.equal(mutations.length, 30);
  for (const [name, code, mutate, shouldResign = true] of mutations)
    await t.test(name, () => {
      const input = signedInput();
      mutate(input);
      if (shouldResign) resign(input);
      const result = validate(input, secret);
      assert.equal(result.status, "REJECT");
      assert.ok(
        result.codes.includes(code),
        `${name}: ${result.codes.join(",")}`,
      );
    });
});

function production(
  input: ValidationInput,
  failed: "rights_eligible" | "published",
) {
  input.request.mode = "PRODUCTION";
  input.policy = {
    ...input.policy,
    version_id: "policy-production-1",
    version: "PRODUCTION-E-1",
    status: "ACTIVE",
    synthetic: false,
    production_eligible: true,
  };
  input.template.synthetic = false;
  input.template.production_eligible = true;
  input.authority.template = { published: true, production_eligible: true };
  for (const candidate of input.candidates) {
    candidate.content.synthetic = false;
    candidate.content.status = "PUBLISHED";
    candidate.content.production_eligible = true;
    input.authority.content[candidate.content.content_version] = {
      published: true,
      production_eligible: true,
      rights_eligible: true,
      reviews_eligible: true,
      current_for_new_use: true,
    };
  }
  const version = selected(input).line.content_version;
  input.authority.content[version]![failed] = false;
  if (failed === "published")
    selected(input).candidate.content.status = "APPROVED";
}

function inputAuthority(input: ValidationInput) {
  return input.authority.content[selected(input).line.content_version]!;
}

test("no-session and unknown policy fail closed without repair", () => {
  const noSession = signedInput();
  noSession.prescription.session = null;
  noSession.prescription.outcome = "NO_SAFE_PRESCRIPTION";
  resign(noSession);
  assert.equal(validate(noSession, secret).status, "REJECT");
  const policy = signedInput();
  policy.policy.allowed_prescription_engines = ["future"];
  assert.ok(validate(policy, secret).codes.includes("FZ-VAL-PROVENANCE-001"));
});

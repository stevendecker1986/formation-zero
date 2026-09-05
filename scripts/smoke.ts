import { seedRules } from "../database/seeds/rules.js";
import {
  baselineFacts,
  syntheticCandidate,
} from "@formation-zero/rule-engine/fixtures";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { testHarness } from "../tests/helpers.js";
import { template } from "@formation-zero/knowledge/templates";
import { importCorpus } from "../database/corpus/import.js";
const h = await testHarness({
  webOrigin: "http://localhost:3100",
  adminOrigin: "http://localhost:3101",
});
const children: ChildProcess[] = [];
const builtApiOrigin = "http://127.0.0.1:4100";
async function startBuiltApi() {
  const child = spawn(process.execPath, ["dist/api/start.js"], {
    env: {
      ...process.env,
      ...Object.fromEntries(
        Object.entries(h.config).map(([key, value]) => [key, String(value)]),
      ),
      PORT: "4100",
    },
    stdio: "pipe",
    windowsHide: true,
  });
  children.push(child);
  let output = "";
  child.stdout?.on("data", (chunk) => {
    output += String(chunk);
  });
  child.stderr?.on("data", (chunk) => {
    output += String(chunk);
  });
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      if ((await fetch(`${builtApiOrigin}/health`)).status === 200) return;
    } catch {
      /* wait for listener */
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
    if (child.exitCode !== null) throw new Error(`Built API failed: ${output}`);
  }
  throw new Error(`Built API startup timed out: ${output}`);
}
async function startClient(app: string, port: number) {
  const child = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "start",
      `apps/${app}`,
      "-p",
      String(port),
    ],
    {
      env: {
        ...process.env,
        API_ORIGIN: builtApiOrigin,
        WEB_ORIGIN: `http://localhost:${port}`,
        ADMIN_ORIGIN: `http://localhost:${port}`,
      },
      stdio: "pipe",
      windowsHide: true,
    },
  );
  children.push(child);
  let startup = "";
  child.stdout?.on("data", (chunk) => {
    startup += String(chunk);
  });
  child.stderr?.on("data", (chunk) => {
    startup += String(chunk);
  });
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const response = await fetch(
        `http://localhost:${port}${app === "admin" ? "/admin" : ""}`,
      );
      if (response.status === 200) return;
    } catch {
      /* bounded startup wait */
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (child.exitCode !== null)
      throw new Error(`Client failed to start: ${startup}`);
  }
  throw new Error(`Client startup timed out: ${startup}`);
}
try {
  assert.equal((await h.request("/health")).status, 200);
  const password = "Synthetic-Smoke-Password-91!";
  const id = await h.register("smoke@example.invalid", password);
  const user = await h.login("smoke@example.invalid", password);
  assert.equal(user.response.status, 200);
  assert.equal(
    (await h.request("/api/v1/account", undefined, user.cookie)).status,
    200,
  );
  assert.equal(
    (await h.request("/api/v1/admin", undefined, user.cookie)).status,
    403,
  );
  await startBuiltApi();
  assert.equal(
    (
      await fetch(`${builtApiOrigin}/api/v1/account`, {
        headers: { cookie: user.cookie },
      })
    ).status,
    200,
  );
  await startClient("web", 3100);
  await startClient("admin", 3101);
  const home = await (await fetch("http://localhost:3100")).text();
  assert.match(home, /Readiness Starts Here/);
  const proxyLogin = await fetch(
    "http://localhost:3100/api/account/auth/login",
    {
      method: "POST",
      headers: {
        origin: "http://localhost:3100",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: "smoke@example.invalid", password }),
    },
  );
  assert.equal(proxyLogin.status, 200);
  assert.match(proxyLogin.headers.get("set-cookie") ?? "", /HttpOnly/);
  const proxyCookie = proxyLogin.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
  assert.equal(
    (
      await fetch("http://localhost:3100/api/account/account", {
        headers: { cookie: proxyCookie },
      })
    ).status,
    200,
  );
  const trainingPage = await (
    await fetch("http://localhost:3100/training")
  ).text();
  assert.match(trainingPage, /Execute the authorized plan/);
  const phaseFRequest = await fetch(
    "http://localhost:3100/api/training/sessions",
    {
      method: "POST",
      headers: {
        origin: "http://localhost:3100",
        "Content-Type": "application/json",
        cookie: proxyCookie,
      },
      body: JSON.stringify({
        idempotency_key: "phase-f-built-smoke-001",
        demo: true,
        training_date: "2026-09-05",
        objective: "GENERAL_READINESS",
        duration_seconds: 2700,
        equipment: { available: [], unsafe: [] },
        space: "STANDARD",
        restrictions: {},
        preferences: [],
        candidate_scope: [],
      }),
    },
  );
  assert.equal(phaseFRequest.status, 201, await phaseFRequest.clone().text());
  const phaseFSession = await phaseFRequest.json();
  assert.equal(phaseFSession.state, "NOT_STARTED");
  assert.match(phaseFSession.consumer_snapshot.label, /SYNTHETIC DEMO/);
  assert.equal(JSON.stringify(phaseFSession).includes('"internal"'), false);
  const phaseFStart = await fetch(
    `http://localhost:3100/api/training/sessions/${phaseFSession.id}/transitions`,
    {
      method: "POST",
      headers: {
        origin: "http://localhost:3100",
        "Content-Type": "application/json",
        cookie: proxyCookie,
      },
      body: JSON.stringify({
        action: "START",
        expected_version: 0,
        idempotency_key: "phase-f-built-start-001",
      }),
    },
  );
  assert.equal(phaseFStart.status, 200, await phaseFStart.clone().text());
  assert.equal((await phaseFStart.json()).state, "IN_PROGRESS");
  console.log(
    "Phase F built web/API smoke passed: authenticated demo delivery, consumer-safe snapshot and server-owned start.",
  );
  assert.equal(
    (
      await fetch("http://localhost:3100/api/account/auth/logout", {
        method: "POST",
        headers: {
          origin: "https://attacker.invalid",
          "Content-Type": "application/json",
          cookie: proxyCookie,
        },
        body: "{}",
      })
    ).status,
    403,
  );
  const denied = await (
    await fetch("http://localhost:3101/admin", {
      headers: { cookie: user.cookie },
    })
  ).text();
  assert.match(denied, /Access denied/);
  assert.ok(!denied.includes("Server authorization verified"));
  const kbDenied = await fetch(
    "http://localhost:3101/admin/api/knowledge/records",
    { headers: { cookie: user.cookie } },
  );
  assert.equal(kbDenied.status, 403, await kbDenied.clone().text());
  await h.pool.query("INSERT INTO user_roles(user_id,role) VALUES($1,$2)", [
    id,
    "PLATFORM_ADMIN",
  ]);
  await h.pool.query(
    "INSERT INTO audit_events(id,actor_id,action,entity_type,entity_id,reason,metadata,request_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
    [
      randomUUID(),
      "test-bootstrap",
      "role.granted",
      "ACCOUNT",
      id,
      "LOCAL_FIXTURE",
      "{}",
      randomUUID(),
    ],
  );
  assert.equal(
    (await h.request("/api/v1/admin", undefined, user.cookie)).status,
    200,
  );
  const allowed = await (
    await fetch("http://localhost:3101/admin", {
      headers: { cookie: user.cookie },
    })
  ).text();
  assert.match(allowed, /Server authorization verified/);
  const anonymous = await (await fetch("http://localhost:3101/admin")).text();
  assert.ok(!anonymous.includes("Server authorization verified"));
  const knowledge = "http://localhost:3101/admin/api/knowledge/";
  const headers = {
    cookie: user.cookie,
    origin: "http://localhost:3101",
    "Content-Type": "application/json",
  };
  assert.equal(
    (
      await fetch(knowledge + "records", {
        method: "POST",
        headers,
        body: JSON.stringify({
          kind: "EQUIPMENT",
          data: template("EQUIPMENT"),
        }),
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await fetch(knowledge + "grants", {
        method: "POST",
        headers,
        body: JSON.stringify({
          user_id: id,
          permission: "CONTENT_EDITOR",
          enabled: true,
        }),
      })
    ).status,
    200,
  );
  const cms = await (
    await fetch("http://localhost:3101/admin/knowledge", { headers })
  ).text();
  assert.match(cms, /Knowledge workspace/);
  assert.match(cms, /Rule engine administration/);
  assert.match(cms, /Prescription engine testing/);
  assert.match(cms, /Run independent validation/);
  const fixtureResponse = await fetch(knowledge + "prescription-fixtures", {
    headers,
  });
  assert.equal(fixtureResponse.status, 200);
  const prescriptionFixture = await fixtureResponse.json();
  const prescriptionResponse = await fetch(knowledge + "prescriptions", {
    method: "POST",
    headers,
    body: JSON.stringify({
      mode: "TEST",
      catalog_version: prescriptionFixture.catalog_version,
      context: prescriptionFixture.default_context,
    }),
  });
  assert.equal(
    prescriptionResponse.status,
    200,
    await prescriptionResponse.clone().text(),
  );
  const prescription = await prescriptionResponse.json();
  assert.equal(prescription.material.outcome, "CANDIDATE_SESSION");
  assert.equal(
    (
      await fetch(knowledge + "prescriptions/" + prescription.record_id, {
        headers,
      })
    ).status,
    200,
  );
  const validationResponse = await fetch(
    knowledge + "prescription-validations",
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        prescription_record_id: prescription.record_id,
      }),
    },
  );
  assert.equal(
    validationResponse.status,
    201,
    await validationResponse.clone().text(),
  );
  const validation = await validationResponse.json();
  assert.ok(["PASS", "WARN"].includes(validation.material.status));
  assert.equal(
    (
      await fetch(
        knowledge + "prescription-validations/" + validation.record_id,
        { headers },
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await fetch(
        knowledge + "prescriptions/" + prescription.record_id + "/delivery",
        { headers },
      )
    ).status,
    409,
  );
  const validationFixtures = await (
    await fetch(knowledge + "validation-fixtures", { headers })
  ).json();
  assert.equal(validationFixtures.scenarios.length, 30);
  assert.equal((await fetch(knowledge + "prescription-fixtures")).status, 401);
  console.log(
    "Phase E built CMS smoke passed: independent validation/history, 30 adversarial fixtures, test delivery denial and anonymous denial.",
  );
  const ruleSet = await seedRules(h.pool, "TEST");
  const ruleCandidate = Object.fromEntries(
    Object.entries(syntheticCandidate()).filter(
      ([key]) =>
        ![
          "synthetic",
          "production_eligible",
          "status",
          "content_version",
        ].includes(key),
    ),
  );
  const evaluated = await fetch(knowledge + "rule-evaluations", {
    method: "POST",
    headers,
    body: JSON.stringify({
      mode: "TEST",
      rule_set_version: ruleSet,
      as_of: "2026-09-05",
      facts: baselineFacts,
      candidates: [ruleCandidate],
    }),
  });
  assert.equal(evaluated.status, 200, await evaluated.clone().text());
  assert.equal((await evaluated.json()).material.results[0].eligible, true);
  const activation = await fetch(knowledge + "rule-activations", {
    method: "POST",
    headers,
    body: JSON.stringify({
      rule_set_version: ruleSet,
      reason: "Synthetic activation must fail",
    }),
  });
  assert.equal(activation.status, 403);
  assert.equal((await fetch(knowledge + "rule-activations")).status, 401);
  console.log(
    "Phase C built CMS smoke passed: synthetic constraint evaluation, production activation denial and anonymous denial.",
  );
  await importCorpus(h.pool);
  assert.match(cms, /Export B2 corpus/);
  const corpusResponse = await fetch(knowledge + "corpus", { headers });
  assert.equal(corpusResponse.status, 200);
  const corpus = await corpusResponse.json();
  assert.equal(corpus.counts.kinds.EXERCISE, 100);
  assert.equal(corpus.counts.kinds.RECOVERY, 30);
  const candidates = await (
    await fetch(
      knowledge +
        "records?corpus=PHASE_B2_INITIAL&kind=EXERCISE&q=Wall%20push-up",
      { headers },
    )
  ).json();
  assert.equal(candidates.length, 1);
  const candidate = await (
    await fetch(knowledge + "versions/" + candidates[0].id, { headers })
  ).json();
  assert.equal(candidate.payload.name, "Wall push-up");
  const edit = await fetch(
    knowledge + "versions/" + candidate.id + "/versions",
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        expected_version: 1,
        data: {
          ...candidate.payload,
          notes: "Disposable built-CMS smoke edit",
        },
      }),
    },
  );
  assert.equal(edit.status, 201, await edit.clone().text());
  const edited = await edit.json();
  assert.equal(
    (
      await (
        await fetch(knowledge + "versions/" + edited.id, { headers })
      ).json()
    ).history.length,
    2,
  );
  assert.equal((await fetch(knowledge + "corpus")).status, 401);
  console.log(
    "B2 built CMS smoke passed: real corpus import, 100/30 export, filtered read, immutable edit/history and anonymous export denial.",
  );
  const created = await fetch(knowledge + "records", {
    method: "POST",
    headers,
    body: JSON.stringify({ kind: "EQUIPMENT", data: template("EQUIPMENT") }),
  });
  assert.equal(created.status, 201, await created.clone().text());
  const record = await created.json();
  assert.equal(
    (await fetch(knowledge + "versions/" + record.id, { headers })).status,
    200,
  );
  assert.equal(
    (
      await fetch(knowledge + "records", {
        method: "POST",
        headers: { ...headers, origin: "https://attacker.invalid" },
        body: "{}",
      })
    ).status,
    403,
  );
  assert.equal((await fetch(knowledge + "grants")).status, 401);
  console.log(
    "Phase B built CMS smoke passed: authorization, separate grants, SSR workspace, proxy create/read, origin rejection and anonymous denial.",
  );
  console.log(
    "Smoke passed: API health, register/verify/login/account, USER denied admin, PLATFORM_ADMIN allowed API and built admin shell, built web response.",
  );
} finally {
  for (const child of children) {
    if (child.exitCode === null) {
      const exited = once(child, "exit");
      child.kill();
      await exited;
    }
  }
  await h.close();
}

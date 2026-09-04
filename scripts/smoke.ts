import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { testHarness } from "../tests/helpers.js";
import { template } from "@formation-zero/knowledge/templates";
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
  assert.equal(kbDenied.status, 403);
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

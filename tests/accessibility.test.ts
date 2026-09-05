import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("F web and mobile execution surfaces expose accessibility contracts", async () => {
  const web = await readFile("apps/web/app/training/page.tsx", "utf8");
  const mobile = await readFile("apps/mobile/App.tsx", "utf8");
  const css = await readFile("packages/ui/src/theme.css", "utf8");
  const tokens = await readFile("packages/ui/src/tokens.ts", "utf8");
  assert.match(web, /aria-live="polite"/);
  assert.match(web, /role="timer"/);
  assert.match(web, /aria-label="Session controls"/);
  assert.match(web, /No approved image is available/);
  assert.match(mobile, /accessibilityLiveRegion="polite"/);
  assert.match(mobile, /accessibilityRole="button"/);
  assert.match(mobile, /accessibilityLabel=\{`Elapsed/);
  assert.match(mobile, /No approved image is available/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(tokens, /target: (?:4[4-9]|[5-9]\d)/);
});

test("F training presentation follows the restrained brand boundary", async () => {
  const sources =
    `${await readFile("apps/web/app/training/page.tsx", "utf8")}\n${await readFile("apps/mobile/App.tsx", "utf8")}`.toLowerCase();
  for (const prohibited of [
    "camouflage",
    "skull",
    "crosshair",
    "classified",
    "gaming hud",
    "neon",
  ])
    assert.equal(sources.includes(prohibited), false);
});

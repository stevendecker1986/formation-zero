import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const config = JSON.parse(await readFile("apps/mobile/app.json", "utf8")) as {
  expo: {
    android: { permissions: string[]; blockedPermissions: string[] };
    ios: { infoPlist: Record<string, unknown> };
  };
};
assert.deepEqual(config.expo.android.permissions, []);
for (const name of [
  "ACCESS_FINE_LOCATION",
  "ACCESS_COARSE_LOCATION",
  "ACCESS_BACKGROUND_LOCATION",
  "CAMERA",
  "RECORD_AUDIO",
  "READ_EXTERNAL_STORAGE",
  "WRITE_EXTERNAL_STORAGE",
  "POST_NOTIFICATIONS",
  "BODY_SENSORS",
  "ACTIVITY_RECOGNITION",
  "SYSTEM_ALERT_WINDOW",
  "VIBRATE",
])
  assert.ok(
    config.expo.android.blockedPermissions.includes(
      `android.permission.${name}`,
    ),
  );
assert.ok(
  !Object.keys(config.expo.ios.infoPlist).some((key) =>
    /Location|Health|Camera|Microphone|Motion/.test(key),
  ),
);
const source = await readFile("apps/mobile/App.tsx", "utf8");
assert.ok(!/requestPermissions|requestAuthorization/.test(source));
const publicVariables = [...source.matchAll(/process\.env\.([A-Z0-9_]+)/g)].map(
  (match) => match[1],
);
assert.deepEqual(publicVariables.sort(), [
  "EXPO_PUBLIC_API_ORIGIN",
  "EXPO_PUBLIC_WEB_ORIGIN",
]);
console.log(
  "Mobile permission/config boundary passed: no requested sensitive permissions or client secrets.",
);

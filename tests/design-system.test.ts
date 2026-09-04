import { test } from "node:test";
import assert from "node:assert/strict";
import { tokens } from "@formation-zero/ui/tokens";

function luminance(hex: string) {
  const channels = [1, 3, 5].map((offset) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
}
function contrast(a: string, b: string) {
  const [low, high] = [luminance(a), luminance(b)].sort((x, y) => x - y);
  return (high! + 0.05) / (low! + 0.05);
}
test("semantic text, action and focus colors remain readable on their surfaces", () => {
  const c = tokens.color;
  for (const background of [
    c.backgroundPrimary,
    c.backgroundSecondary,
    c.surfacePrimary,
    c.surfaceElevated,
  ]) {
    for (const foreground of [
      c.textPrimary,
      c.textSecondary,
      c.textMuted,
      c.brandText,
      c.stateSuccess,
      c.stateWarning,
      c.stateDanger,
      c.stateInfo,
    ]) {
      assert.ok(
        contrast(foreground, background) >= 4.5,
        `${foreground} on ${background}`,
      );
    }
    for (const foreground of [c.borderDefault, c.focus])
      assert.ok(contrast(foreground, background) >= 3);
  }
  for (const background of [
    c.brandAccent,
    c.brandAccentHover,
    c.brandAccentActive,
  ]) {
    assert.ok(contrast(c.onAccent, background) >= 4.5);
    assert.ok(contrast(c.focus, background) >= 3);
  }
});

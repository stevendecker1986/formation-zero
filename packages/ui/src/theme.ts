import type { CSSProperties } from "react";
import { tokens } from "./tokens";
const unitless = new Set([
  "zIndex",
  "typography.lineBody",
  "typography.lineHeading",
]);
export const themeStyle: CSSProperties = Object.fromEntries(
  Object.entries(tokens).flatMap(([group, values]) =>
    Object.entries(values).map(([key, value]) => {
      const name = `--fz-${group}-${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
      const unit =
        unitless.has(group) || unitless.has(`${group}.${key}`)
          ? ""
          : group === "motion"
            ? "ms"
            : "px";
      return [name, typeof value === "number" ? `${value}${unit}` : value];
    }),
  ),
);

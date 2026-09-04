import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";
interface LockEntry {
  version?: string;
  dev?: boolean;
  optional?: boolean;
  license?: string;
  link?: boolean;
}
const lock = JSON.parse(await readFile("package-lock.json", "utf8")) as {
  packages: Record<string, LockEntry>;
};
const accepted = new Set([
  "MIT",
  "MIT-0",
  "ISC",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "0BSD",
  "CC0-1.0",
  "Unlicense",
  "BlueOak-1.0.0",
  "Python-2.0",
  "CC-BY-4.0",
  "CC-BY-3.0",
  "(MIT OR Apache-2.0)",
  "(MIT AND Zlib)",
  "(MIT OR CC0-1.0)",
  "(Apache-2.0 OR MIT)",
  "(BSD-2-Clause OR MIT OR Apache-2.0)",
  "(BSD-2-Clause OR MIT)",
  "(MIT AND BSD-3-Clause)",
  "(BSD-3-Clause OR GPL-2.0)",
]);
const inventory: {
  name: string;
  version: string;
  license: string;
  scope: string;
  commercialCompatibility: string;
  notice: string;
  noticeSha256: string | null;
}[] = [];
const problems: string[] = [];
const allNotices: string[] = [];
for (const [path, entry] of Object.entries(lock.packages)) {
  if (!path.includes("node_modules/") || entry.link) continue;
  let pkg: {
    name: string;
    version: string;
    license?: string | { type: string };
  };
  let installed = true;
  try {
    pkg = JSON.parse(
      await readFile(join(path, "package.json"), "utf8"),
    ) as typeof pkg;
  } catch {
    if (entry.optional && entry.version) {
      installed = false;
      pkg = {
        name: path.split("node_modules/").at(-1)!,
        version: entry.version,
        license: entry.license,
      };
    } else {
      throw new Error(`Missing installed package: ${path}`);
    }
  }
  const license =
    typeof pkg.license === "string"
      ? pkg.license
      : (pkg.license?.type ?? entry.license ?? "UNKNOWN");
  const notices = (installed ? await readdir(path) : []).filter((file) =>
    /^(LICEN[CS]E|COPYING|NOTICE)(\.|$)/i.test(file),
  );
  const notice = notices.length
    ? notices.map((file) => join(path, file).replaceAll("\\", "/")).join("; ")
    : installed
      ? "Package metadata only; see package repository"
      : "Optional platform package: lockfile metadata reviewed; collect notices on target-platform install";
  const noticeText = (
    await Promise.all(notices.map((file) => readFile(join(path, file), "utf8")))
  ).join("\n");
  const mpl = license === "MPL-2.0" && pkg.name.startsWith("lightningcss");
  const lgpl =
    pkg.name.startsWith("@img/sharp-") &&
    [
      "LGPL-3.0-or-later",
      "Apache-2.0 AND LGPL-3.0-or-later",
      "Apache-2.0 AND LGPL-3.0-or-later AND MIT",
    ].includes(license);
  const compatible = accepted.has(license) || mpl || lgpl;
  if (!compatible) problems.push(`${pkg.name}@${pkg.version}: ${license}`);
  if (noticeText)
    allNotices.push(
      `===== ${pkg.name}@${pkg.version} (${license}) =====\n${noticeText}`,
    );
  inventory.push({
    name: pkg.name,
    version: pkg.version,
    license,
    scope: `${entry.dev ? "development" : "production/transitive"}${installed ? "" : " (optional, other platform)"}`,
    commercialCompatibility: mpl
      ? "File-level copyleft; preserve notices and provide covered source if distributing. See DEPENDENCY_LICENSING.md."
      : lgpl
        ? "Server/build use reviewed; redistribution requires LGPL source/relinking compliance. See DEPENDENCY_LICENSING.md."
        : compatible
          ? "Permissive option selected; retain upstream license and attribution notices"
          : "REVIEW REQUIRED",
    notice,
    noticeSha256: noticeText
      ? createHash("sha256").update(noticeText).digest("hex")
      : null,
  });
}
await mkdir("docs", { recursive: true });
await writeFile(
  "docs/DEPENDENCY_LICENSES.json",
  JSON.stringify(
    inventory.sort(
      (a, b) =>
        a.name.localeCompare(b.name) || a.version.localeCompare(b.version),
    ),
    null,
    2,
  ) + "\n",
);
await writeFile("docs/THIRD_PARTY_NOTICES.txt", allNotices.join("\n\n") + "\n");
if (problems.length)
  throw new Error(`Unresolved licenses:\n${problems.join("\n")}`);
console.log(
  `Reviewed ${inventory.length} locked dependency entries and installed notices; no unresolved licenses for Phase A. Conditional obligations documented.`,
);

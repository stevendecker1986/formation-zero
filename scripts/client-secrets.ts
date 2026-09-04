import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseEnv } from "node:util";
let env: Record<string, string | undefined> = process.env;
try {
  env = { ...env, ...parseEnv(await readFile(".env", "utf8")) };
} catch {
  /* Clean CI injects server values without a file. */
}
const needles = [
  "AUTH_SECRET",
  "DATABASE_URL",
  "SMTP_URL",
  ...["AUTH_SECRET", "DATABASE_URL", "SMTP_URL"]
    .map((key) => env[key])
    .filter((value): value is string => Boolean(value && value.length >= 16)),
];
async function inspect(directory: string): Promise<number> {
  let count = 0;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) count += await inspect(path);
    else if (entry.isFile()) {
      const bytes = await readFile(path);
      if (needles.some((needle) => bytes.includes(Buffer.from(needle))))
        throw new Error(`Server config detected in public artifact: ${path}`);
      count++;
    }
  }
  return count;
}
let count = 0;
for (const directory of [
  "apps/web/.next/static",
  "apps/admin/.next/static",
  "apps/mobile/dist",
])
  count += await inspect(directory);
console.log(`Client artifact secret boundary passed: ${count} files checked.`);

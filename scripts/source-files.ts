import { readdir } from "node:fs/promises";
import { join } from "node:path";
const ignored = new Set([
  "node_modules",
  ".git",
  ".next",
  ".expo",
  ".local",
  "dist",
  "coverage",
  "validation-artifacts",
  "android",
  "ios",
]);
export async function sourceFiles(directory = "."): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (
      ignored.has(entry.name) ||
      (entry.name.startsWith(".env") && entry.name !== ".env.example") ||
      entry.name.endsWith(".tsbuildinfo")
    )
      continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await sourceFiles(path)));
    else if (entry.isFile()) files.push(path);
  }
  return files.sort();
}

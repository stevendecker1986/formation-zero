import { readFile } from "node:fs/promises";
import { sourceFiles } from "./source-files.js";
const patterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bgh[pousr]_[a-zA-Z0-9]{30,}\b/,
  /\bsk_live_[a-zA-Z0-9]{20,}\b/,
  /postgres(?:ql)?:\/\/[^\s:]+:[^\s@${<>]+@/,
];
const violations: string[] = [];
for (const path of await sourceFiles()) {
  if (path.endsWith(".env.example") || path.endsWith("package-lock.json"))
    continue;
  const content = await readFile(path, "utf8");
  if (patterns.some((pattern) => pattern.test(content))) violations.push(path);
  if (
    /(?:apps[\\/](?:web|admin|mobile)|packages[\\/]ui)/.test(path) &&
    /(?:NEXT_PUBLIC|EXPO_PUBLIC)_[A-Z_]*(?:SECRET|PASSWORD|DATABASE|TOKEN)/.test(
      content,
    )
  )
    violations.push(path);
}
if (violations.length)
  throw new Error(`Potential secrets found in: ${violations.join(", ")}`);
console.log(
  "Secret scan passed: source credential patterns and public-variable boundary.",
);

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

const key = (secret: string) =>
  createHash("sha256")
    .update("formation-zero-validation-input-v1:" + secret)
    .digest();

export function sealValidationInput(secret: string, value: unknown) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(secret), iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([Buffer.from([1]), iv, cipher.getAuthTag(), ciphertext]);
}

export function openValidationInput(secret: string, value: Buffer) {
  if (value.length < 30 || value[0] !== 1)
    throw new Error("INVALID_VALIDATION_INPUT_ENVELOPE");
  const iv = value.subarray(1, 13);
  const tag = value.subarray(13, 29);
  const ciphertext = value.subarray(29);
  const decipher = createDecipheriv("aes-256-gcm", key(secret), iv);
  decipher.setAuthTag(tag);
  return JSON.parse(
    Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString(
      "utf8",
    ),
  ) as unknown;
}

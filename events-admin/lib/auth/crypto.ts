import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

// Encrypts each AdminUser.totpSecret at rest so a database dump/leak alone
// doesn't hand over every admin's MFA seed — decrypted only in-memory at
// verification time, never logged.
const ALGORITHM = "aes-256-gcm";
const SCRYPT_SALT = "events-admin-totp-secret-v1";

function deriveKey(): Buffer {
  const secret = process.env.TOTP_ENCRYPTION_KEY;
  if (!secret || secret.length < 32) {
    throw new Error("TOTP_ENCRYPTION_KEY must be set to a string of at least 32 characters");
  }
  return scryptSync(secret, SCRYPT_SALT, 32);
}

export function encryptSecret(plaintext: string): string {
  const key = deriveKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv, authTag, ciphertext].map((buf) => buf.toString("base64")).join(".");
}

export function decryptSecret(encoded: string): string {
  const [ivB64, tagB64, dataB64] = encoded.split(".");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Malformed encrypted TOTP secret");
  }
  const key = deriveKey();
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const plaintext = Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]);
  return plaintext.toString("utf8");
}

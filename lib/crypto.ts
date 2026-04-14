import "server-only";
import crypto from "crypto";
import type { EncryptedCalendarTokens } from "./types";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  const keyHex = process.env.CALENDAR_TOKEN_ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error("CALENDAR_TOKEN_ENCRYPTION_KEY is not set");
  }
  const key = Buffer.from(keyHex, "hex");
  if (key.length !== 32) {
    throw new Error(
      "CALENDAR_TOKEN_ENCRYPTION_KEY must be a 32-byte hex string (64 hex chars)"
    );
  }
  return key;
}

export function encryptTokens(plaintext: string): EncryptedCalendarTokens {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  const combined = Buffer.concat([ciphertext, authTag]);
  return {
    encrypted: combined.toString("base64"),
    iv: iv.toString("base64"),
  };
}

export function decryptTokens(tokens: EncryptedCalendarTokens): string {
  const key = getKey();
  const iv = Buffer.from(tokens.iv, "base64");
  const combined = Buffer.from(tokens.encrypted, "base64");
  const ciphertext = combined.subarray(0, combined.length - AUTH_TAG_LENGTH);
  const authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}

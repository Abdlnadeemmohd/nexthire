import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

/**
 * Password Hashing Utility using Node.js native crypto scrypt.
 * Format: salt:hash (hex encoded)
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

export function verifyPassword(password: string, combinedHash: string): boolean {
  try {
    const [salt, keyHex] = combinedHash.split(":");
    if (!salt || !keyHex) return false;
    
    const keyBuffer = Buffer.from(keyHex, "hex");
    const derivedKey = scryptSync(password, salt, 64);
    
    return timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

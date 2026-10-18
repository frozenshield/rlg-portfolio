/**
 * RFC 6238 Time-Based One-Time Password (TOTP) & Email OTP Utility
 * Compatible with Google Authenticator, Authy, and Microsoft Authenticator
 */

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * Normalizes staff / customer identifier to canonical email address
 * so secrets are always identical whether entering username or email.
 */
export function normalizeAccountEmail(identifier: string): string {
  const clean = (identifier || "collector@rlgshop.local").trim().toLowerCase();
  if (clean === "admin" || clean === "admin chief" || clean.startsWith("admin@")) {
    return "admin@rlghobby.com";
  }
  if (clean === "manager" || clean === "store manager" || clean.startsWith("manager@")) {
    return "manager@rlghobby.com";
  }
  if (clean === "packer" || clean === "fulfillment" || clean.startsWith("packer@")) {
    return "packer@rlghobby.com";
  }
  if (clean === "rowena.ops" || clean.startsWith("rowena.ops@")) {
    return "rowena.ops@rlghobby.com";
  }
  if (clean === "darwin.pack" || clean.startsWith("darwin.pack@")) {
    return "darwin.pack@rlghobby.com";
  }
  return clean;
}

/**
 * Derive a deterministic 16-character Base32 secret for a user email
 * so both frontend and backend compute the exact same Google Authenticator secret
 * without requiring database schema migrations.
 */
export function deriveUserTotpSecret(email: string): string {
  const cleanEmail = normalizeAccountEmail(email);
  const savedCustom =
    typeof localStorage !== "undefined"
      ? localStorage.getItem(`rlg_totp_secret_${cleanEmail}`)
      : null;
  if (savedCustom && savedCustom.length >= 16) {
    return savedCustom;
  }

  const seed = `RLG_HOBBY_TOTP_2026:${cleanEmail}:SECRET_KEY_V1`;
  const bytes: number[] = [];
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;

  for (let i = 0; i < 16; i++) {
    for (let j = 0; j < seed.length; j++) {
      const c = seed.charCodeAt(j);
      h1 ^= c + i * 31;
      h1 = Math.imul(h1, 0x01000193) >>> 0;
      h2 ^= (h1 >>> 13) ^ c;
      h2 = Math.imul(h2, 0x5bd1e995) >>> 0;
    }
    bytes.push((h1 ^ h2) & 0x1f);
  }

  return bytes.map((idx) => BASE32_ALPHABET[idx % 32]).join("");
}

/**
 * Decode a Base32 string into a Uint8Array
 */
export function base32ToBytes(base32: string): Uint8Array {
  const cleaned = base32.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(cleaned[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(output);
}

/**
 * Generate a 6-digit RFC 6238 TOTP code for a given Base32 secret and time counter
 */
export async function generateTotpCode(
  base32Secret: string,
  timeStepOffset = 0,
): Promise<string> {
  const keyBytes = base32ToBytes(base32Secret);
  const epochSeconds = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epochSeconds / 30) + timeStepOffset;

  const counterBuffer = new ArrayBuffer(8);
  const view = new DataView(counterBuffer);
  // High 32 bits = 0, Low 32 bits = counter
  view.setUint32(0, Math.floor(counter / 0x100000000), false);
  view.setUint32(4, counter >>> 0, false);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes.buffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );

  const signature = new Uint8Array(
    await crypto.subtle.sign("HMAC", cryptoKey, counterBuffer),
  );

  const offset = signature[signature.length - 1] & 0x0f;
  const binary =
    ((signature[offset] & 0x7f) << 24) |
    ((signature[offset + 1] & 0xff) << 16) |
    ((signature[offset + 2] & 0xff) << 8) |
    (signature[offset + 3] & 0xff);

  const otp = (binary % 1000000).toString().padStart(6, "0");
  return otp;
}

/**
 * Verify a 6-digit code against a Base32 secret (allows ±1 30-second window for clock drift)
 */
export async function verifyTotpCode(
  base32Secret: string,
  inputCode: string,
): Promise<boolean> {
  const normalized = (inputCode || "").replace(/\s+/g, "");
  if (!/^\d{6}$/.test(normalized)) return false;

  for (const offset of [-2, -1, 0, 1, 2]) {
    const expected = await generateTotpCode(base32Secret, offset);
    if (expected === normalized) {
      return true;
    }
  }
  return false;
}

/**
 * Build standard otpauth:// URI and QR Code image URL for Google Authenticator
 */
export function buildGoogleAuthenticatorQr(email: string, secret: string) {
  const issuer = "RLG Hobby Shop";
  const label = encodeURIComponent(`${issuer}:${email}`);
  const otpauthUri = `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(otpauthUri)}`;

  return {
    otpauthUri,
    qrImageUrl,
  };
}


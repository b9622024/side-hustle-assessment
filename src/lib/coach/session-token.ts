import { createHmac, timingSafeEqual } from "node:crypto";

const SESSION_DURATION_SECONDS = 60 * 60 * 8;

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createCoachSessionToken(secret: string, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(now / 1000) + SESSION_DURATION_SECONDS })).toString("base64url");
  return `${payload}.${signature(payload, secret)}`;
}

export function verifyCoachSessionToken(token: string | undefined, secret: string, now = Date.now()) {
  if (!token) return false;
  const [payload, suppliedSignature, extra] = token.split(".");
  if (!payload || !suppliedSignature || extra) return false;
  const expectedSignature = signature(payload, secret);
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return false;
  try {
    const value = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { exp?: unknown };
    return typeof value.exp === "number" && value.exp > Math.floor(now / 1000);
  } catch {
    return false;
  }
}

export function passwordsMatch(supplied: string, expected: string) {
  const suppliedHash = createHmac("sha256", "coach-password-comparison").update(supplied).digest();
  const expectedHash = createHmac("sha256", "coach-password-comparison").update(expected).digest();
  return timingSafeEqual(suppliedHash, expectedHash);
}

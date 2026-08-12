import { describe, expect, it } from "vitest";
import { createCoachSessionToken, passwordsMatch, verifyCoachSessionToken } from "../src/lib/coach/session-token";

const secret = "a-secure-test-secret-that-is-at-least-32-characters";
const now = Date.parse("2026-08-12T00:00:00.000Z");

describe("coach session security", () => {
  it("accepts a fresh signed token", () => {
    expect(verifyCoachSessionToken(createCoachSessionToken(secret, now), secret, now)).toBe(true);
  });

  it("rejects tampered, malformed, and expired tokens", () => {
    const token = createCoachSessionToken(secret, now);
    expect(verifyCoachSessionToken(`${token}x`, secret, now)).toBe(false);
    expect(verifyCoachSessionToken("not-a-token", secret, now)).toBe(false);
    expect(verifyCoachSessionToken(token, secret, now + 9 * 60 * 60 * 1000)).toBe(false);
  });

  it("compares passwords without plain string equality", () => {
    expect(passwordsMatch("correct horse battery staple", "correct horse battery staple")).toBe(true);
    expect(passwordsMatch("incorrect", "correct horse battery staple")).toBe(false);
  });
});

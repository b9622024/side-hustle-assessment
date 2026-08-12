import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createCoachSessionToken, verifyCoachSessionToken } from "./session-token";

export const COACH_COOKIE = "side_hustle_coach_session";

function sessionSecret() {
  const secret = process.env.COACH_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("COACH_AUTH_NOT_CONFIGURED");
  return secret;
}

export function coachPassword() {
  const password = process.env.COACH_ADMIN_PASSWORD;
  if (!password || password.length < 12) throw new Error("COACH_AUTH_NOT_CONFIGURED");
  return password;
}

export async function isCoachAuthenticated() {
  const token = (await cookies()).get(COACH_COOKIE)?.value;
  try { return verifyCoachSessionToken(token, sessionSecret()); }
  catch { return false; }
}

export async function requireCoach() {
  if (!await isCoachAuthenticated()) redirect("/coach/login");
}

export async function setCoachSession() {
  (await cookies()).set(COACH_COOKIE, createCoachSessionToken(sessionSecret()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 8,
    path: "/coach",
  });
}

export async function clearCoachSession() {
  (await cookies()).set(COACH_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", maxAge: 0, path: "/coach" });
}

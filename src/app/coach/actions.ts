"use server";

import { redirect } from "next/navigation";
import { clearCoachSession, coachPassword, setCoachSession } from "../../lib/coach/auth";
import { passwordsMatch } from "../../lib/coach/session-token";

export async function loginCoach(formData: FormData) {
  const supplied = String(formData.get("password") ?? "");
  let expected: string;
  try { expected = coachPassword(); }
  catch { redirect("/coach/login?error=config"); }
  if (!passwordsMatch(supplied, expected)) redirect("/coach/login?error=invalid");
  await setCoachSession();
  redirect("/coach");
}

export async function logoutCoach() {
  await clearCoachSession();
  redirect("/coach/login");
}

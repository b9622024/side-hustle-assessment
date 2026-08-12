import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { validateInput } from "../../../scoring/engine";
import type { AssessmentInput } from "../../../scoring/types";

export async function POST(request: Request) {
  try {
    const body = await request.json() as AssessmentInput;
    if (!body.birthPlace?.trim()) return NextResponse.json({ error: "INVALID_BIRTH_PLACE" }, { status: 400 });
    validateInput(body);
    const date = new Date();
    const datePart = `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}${String(date.getUTCDate()).padStart(2, "0")}`;
    const suffix = randomBytes(3).toString("hex").toUpperCase();
    return NextResponse.json({ reportId: `SH-${datePart}-${suffix}` }, { status: 201 });
  } catch (error) {
    const knownError = error instanceof Error && /^(INVALID_|Unexpected end)/.test(error.message);
    return NextResponse.json({ error: knownError ? "INVALID_ASSESSMENT_INPUT" : "ASSESSMENT_SUBMIT_FAILED" }, { status: knownError ? 400 : 500 });
  }
}

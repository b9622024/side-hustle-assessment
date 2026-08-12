import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { validateInput } from "../../../scoring/engine";
import type { AssessmentInput } from "../../../scoring/types";
import { calculateBasicAstrologyProfile } from "../../../astrology/basic-profile";
import { buildClientReport, calculateAssessmentScoring } from "../../../report/build-client-report";
import { saveAssessmentReport } from "../../../persistence/save-assessment-report";

export async function POST(request: Request) {
  try {
    const body = await request.json() as AssessmentInput;
    if (!body.birthPlace?.trim()) return NextResponse.json({ error: "INVALID_BIRTH_PLACE" }, { status: 400 });
    validateInput(body);
    const date = new Date();
    const datePart = `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}${String(date.getUTCDate()).padStart(2, "0")}`;
    const suffix = randomBytes(3).toString("hex").toUpperCase();
    const reportId = `SH-${datePart}-${suffix}`;
    const generatedAt = date.toISOString();
    const astrology = calculateBasicAstrologyProfile(body.birthDate);
    const clientReport = buildClientReport({ reportId, assessment: body, astrology, generatedAt });
    const scoring = calculateAssessmentScoring(body, astrology);
    const { persisted } = await saveAssessmentReport({ assessment: body, astrology, scoring, clientReport });
    return NextResponse.json({ reportId, persisted }, { status: 201 });
  } catch (error) {
    const knownError = error instanceof Error && /^(INVALID_|Unexpected end)/.test(error.message);
    const databaseUnavailable = error instanceof Error && error.message === "DATABASE_NOT_CONFIGURED";
    return NextResponse.json(
      { error: knownError ? "INVALID_ASSESSMENT_INPUT" : databaseUnavailable ? "ASSESSMENT_STORAGE_UNAVAILABLE" : "ASSESSMENT_SUBMIT_FAILED" },
      { status: knownError ? 400 : databaseUnavailable ? 503 : 500 },
    );
  }
}

import { config } from "../scoring/config";
import type { AssessmentInput, ScoringResult } from "../scoring/types";
import type { AstrologyProfile, ClientReportData } from "../report/types";
import { databaseIsConfigured, getSupabaseAdmin } from "../lib/supabase/admin";
import { buildDiagnosticProfile } from "../diagnostic/profile";

export interface AssessmentArtifacts {
  assessment: AssessmentInput;
  astrology: AstrologyProfile;
  scoring: ScoringResult;
  clientReport: ClientReportData;
}

export async function saveAssessmentReport(artifacts: AssessmentArtifacts): Promise<{ persisted: boolean }> {
  if (!databaseIsConfigured()) {
    if (process.env.NODE_ENV === "production") throw new Error("DATABASE_NOT_CONFIGURED");
    return { persisted: false };
  }

  const { error } = await getSupabaseAdmin().rpc("save_assessment_with_report", {
    p_assessment: {
      report_id: artifacts.clientReport.report.id,
      display_name: artifacts.assessment.displayName,
      birth_date: artifacts.assessment.birthDate,
      birth_time: artifacts.assessment.birthTime ?? "",
      birth_place: artifacts.assessment.birthPlace,
      business_status: artifacts.assessment.businessStatus,
      answers: artifacts.assessment.answers,
      diagnostic_profile: artifacts.assessment.diagnostic ? buildDiagnosticProfile(artifacts.assessment.diagnostic) : null,
      astrology_profile: artifacts.astrology,
      scoring_snapshot: artifacts.scoring,
      scoring_version: config.meta.scoring_engine_version,
    },
    p_report: {
      report_id: artifacts.clientReport.report.id,
      report_data: artifacts.clientReport,
      generated_at: artifacts.clientReport.report.generatedAt,
    },
  });
  if (error) throw new Error("DATABASE_SAVE_FAILED", { cause: error });
  return { persisted: true };
}

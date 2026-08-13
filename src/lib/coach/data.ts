import "server-only";
import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "../supabase/admin";
import type { Answers, AstrologyScoringInput, BusinessStatus, ScoringResult } from "../../scoring/types";
import type { AstrologyProfile, ClientReportData } from "../../report/types";
import type { ConsultationSetting } from "../../consultation/settings";

export const COACH_PAGE_SIZE = 50;

export interface CoachAssessmentRow {
  id: number;
  report_id: string;
  display_name: string;
  birth_date: string;
  birth_time: string | null;
  birth_place: string;
  business_status: BusinessStatus;
  created_at: string;
  updated_at?: string;
  consultation_setting?: ConsultationSetting | null;
  scoring_snapshot: ScoringResult;
}

export interface CoachAssessmentDetail extends CoachAssessmentRow {
  answers: Answers;
  astrology_profile: (AstrologyScoringInput & { sun: AstrologyScoringInput["sun"] & { sign: string } }) | AstrologyProfile;
  scoring_version: string;
  client_reports: Array<{ report_data: ClientReportData }>;
}

function safeSearch(value: string) {
  return value.trim().replace(/[%_,.()]/g, "").slice(0, 80);
}

export async function listCoachAssessments(page: number, query: string) {
  const from = (page - 1) * COACH_PAGE_SIZE;
  const search = safeSearch(query);
  let request = getSupabaseAdmin()
    .from("assessments")
    .select("id,report_id,display_name,birth_date,birth_time,birth_place,business_status,created_at,scoring_snapshot", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + COACH_PAGE_SIZE - 1);
  if (search) request = request.or(`display_name.ilike.%${search}%,report_id.ilike.%${search}%`);
  const { data, count, error } = await request;
  if (error) throw new Error("COACH_LIST_QUERY_FAILED", { cause: error });
  return { rows: (data ?? []) as CoachAssessmentRow[], total: count ?? 0, search };
}

export async function getCoachAssessment(reportId: string) {
  if (!/^SH-\d{8}-[A-F0-9]{6}$/.test(reportId)) notFound();
  const { data, error } = await getSupabaseAdmin()
    .from("assessments")
    .select("id,report_id,display_name,birth_date,birth_time,birth_place,business_status,answers,astrology_profile,scoring_snapshot,scoring_version,consultation_setting,created_at,updated_at,client_reports(report_data)")
    .eq("report_id", reportId)
    .maybeSingle();
  if (error) throw new Error("COACH_REPORT_QUERY_FAILED", { cause: error });
  if (!data) notFound();
  return data as CoachAssessmentDetail;
}

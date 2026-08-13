import { describe, expect, it } from "vitest";
import { buildFullAssessmentJson, serializeFullAssessmentJson } from "../src/report/build-coach-export";
import { initializeConsultationSetting, normalizeConsultationSetting, offerForGoal } from "../src/consultation/settings";
import { scoreAssessment } from "../src/scoring/engine";
import { config } from "../src/scoring/config";
import type { Answers, BusinessStatus, Route } from "../src/scoring/types";
import type { CoachAssessmentDetail } from "../src/lib/coach/data";

function record(routeIndex = 0): CoachAssessmentDetail {
  const route = (["A", "B", "C", "D"] as Route[])[routeIndex] ?? "A";
  const golden = config.golden_cases.find((candidate) => candidate.expected.system_route === route);
  if (!golden) throw new Error(`MISSING_ROUTE_FIXTURE_${route}`);
  const answers = golden.input.answers as Answers;
  const businessStatus = golden.input.business_status as BusinessStatus;
  const scoring = scoreAssessment({ displayName: "Phase 5", birthDate: "1989-01-17", birthTime: "11:45", birthPlace: "台南市", businessStatus, answers });
  return { id: 1, report_id: "SH-20260814-ABC123", display_name: "Phase 5", birth_date: "1989-01-17", birth_time: "11:45:00", birth_place: "台南市", business_status: businessStatus, created_at: "2026-08-14T00:00:00.000Z", updated_at: "2026-08-14T00:00:00.000Z", answers, astrology_profile: { sun: { sign: "摩羯座", element: "EARTH", modality: "CARDINAL" } }, scoring_snapshot: scoring, scoring_version: "side-hustle-scoring-v2-rc1", consultation_setting: null, client_reports: [] } as CoachAssessmentDetail;
}

describe("Phase 5 consultation settings", () => {
  it("keeps unsaved legacy assessments null in the canonical serializer", () => {
    const exported = buildFullAssessmentJson(record());
    expect(exported.client_journey).toBeNull();
    expect(exported.consultation_context).toBeNull();
    expect(exported.selected_offer).toBeNull();
    expect(exported.backup_offer).toBeNull();
    expect(exported.coach_notes).toBeNull();
  });

  it("initializes existing_business only from the initial business status", () => {
    expect(initializeConsultationSetting("ACTIVE").client_journey.existing_business).toBe(true);
    expect(initializeConsultationSetting("STABLE").client_journey.existing_business).toBe(true);
    expect(initializeConsultationSetting("NONE").client_journey.existing_business).toBe(false);
    const saved = initializeConsultationSetting("ACTIVE"); saved.client_journey.existing_business = false;
    expect(normalizeConsultationSetting(saved).client_journey.existing_business).toBe(false);
  });

  it("forces selected_offer null for ANALYSIS_ONLY without touching an explicitly enabled backup", () => {
    const setting = initializeConsultationSetting("NONE");
    setting.selected_offer = offerForGoal("HEALTH_BUSINESS");
    setting.backup_offer = offerForGoal("THREE_DAY_TRIAL");
    const normalized = normalizeConsultationSetting(setting);
    expect(normalized.selected_offer).toBeNull();
    expect(normalized.backup_offer?.offer_type).toBe("THREE_DAY_TRIAL");
  });

  it("round-trips a custom offer through save, reopen, refresh, copy and download state", () => {
    const original = initializeConsultationSetting("NONE");
    original.consultation_context.primary_goal = "CUSTOM_OFFER";
    original.selected_offer = { ...offerForGoal("CUSTOM_OFFER"), offer_name: "測試服務", description: "自訂服務內容", duration: "4週", price: { currency: "TWD", amount: 12800, display: "" }, cta: "邀請客戶確認是否希望進一步了解", notes: "保留彈性" };
    original.coach_notes = "只保存 plain text"; original.consultation_context.coach_notes = original.coach_notes;
    const persisted = normalizeConsultationSetting(JSON.parse(JSON.stringify(original)));
    const reopened = normalizeConsultationSetting(JSON.parse(JSON.stringify(persisted)));
    const refreshed = normalizeConsultationSetting(JSON.parse(JSON.stringify(reopened)));
    expect(refreshed.selected_offer).toEqual(expect.objectContaining({ offer_name: "測試服務", description: "自訂服務內容", duration: "4週", cta: "邀請客戶確認是否希望進一步了解" }));
    expect(refreshed.selected_offer?.price).toEqual({ currency: "TWD", amount: 12800, display: "新台幣12,800元" });
    const assessment = record(); assessment.consultation_setting = refreshed;
    expect(JSON.parse(serializeFullAssessmentJson(assessment))).toEqual(buildFullAssessmentJson(assessment));
  });

  it("keeps Angel Plan and Three Day Trial as independent objects", () => {
    const setting = initializeConsultationSetting("NONE");
    setting.consultation_context.primary_goal = "ANGEL_PLAN";
    setting.selected_offer = offerForGoal("ANGEL_PLAN"); setting.backup_offer = offerForGoal("THREE_DAY_TRIAL");
    setting.selected_offer.offer_name = "Angel Plan 主要";
    expect(setting.backup_offer.offer_name).toBe("三天體驗");
    setting.backup_offer.price.amount = 999;
    expect(setting.selected_offer.price.amount).toBeNull();
  });

  it.each([
    [0, "ANALYSIS_ONLY"], [0, "HEALTH_BUSINESS"], [1, "CUSTOM_OFFER"], [2, "AI_MARKETING_SERVICE"], [3, "CONSULTING_SERVICE"],
  ] as const)("allows route case %i with goal %s without changing scoring", (routeIndex, goal) => {
    const assessment = record(routeIndex); const before = JSON.stringify(assessment.scoring_snapshot);
    const setting = initializeConsultationSetting(assessment.business_status); setting.consultation_context.primary_goal = goal;
    setting.selected_offer = goal === "ANALYSIS_ONLY" ? null : offerForGoal(goal);
    assessment.consultation_setting = normalizeConsultationSetting(setting);
    const exported = buildFullAssessmentJson(assessment);
    expect(exported.routing.system_route).toBe((["A", "B", "C", "D"] as Route[])[routeIndex]);
    expect(exported.consultation_context?.primary_goal).toBe(goal);
    expect(JSON.stringify(assessment.scoring_snapshot)).toBe(before);
  });
});

import { describe, expect, it } from "vitest";
import { buildDiagnosticProfile, type ActionStageCode, type BottleneckCode, type DiagnosticProfile, type MotivationCode } from "../src/diagnostic/profile";
import { buildDiagnosticInterpretation } from "../src/diagnostic/interpretation";
import { scoreAssessment } from "../src/scoring/engine";
import type { Route, ScoringResult, SideHustleType } from "../src/scoring/types";

const answers = { Q1: "A", Q2: "B", Q3: "A", Q4: "B", Q5: "A", Q6: "B", Q7: "B", Q8: "B", Q9: "A", Q10: "B" } as const;

function profile(motivation: MotivationCode, status: ActionStageCode, bottlenecks: BottleneckCode[] = []) {
  return buildDiagnosticProfile({ motivationCode: motivation, currentStatusV2: status, bottleneckAnswers: bottlenecks, bottleneckOtherText: bottlenecks.includes("OTHER") ? "其他問題" : undefined });
}

function legacyProfile(): DiagnosticProfile {
  return {
    schema_version: "2.2.0-rc1",
    motivation: { question_id: "Q11", code: "SIDE_HUSTLE_STUCK", label: "已經開始副業，但發展不如預期" },
    current_status: { question_id: "Q12", code: "OFFER_EXISTS", label: "已經有商品、服務或商城" },
    bottlenecks: { question_id: "Q13", applicable: true, selected: [{ code: "TRAFFIC", label: "不知道去哪裡找客戶" }], other_text: null },
  };
}

function scoring(overrides: { readiness?: number; businessFit?: number; route?: Route; primary?: SideHustleType; secondary?: SideHustleType; capital?: number; capitalForceD?: boolean } = {}): ScoringResult {
  const base = scoreAssessment({ displayName: "測試", birthDate: "1990-01-01", businessStatus: "NONE", answers });
  const primary = overrides.primary ?? base.rankedTypes[0]!.type;
  const secondary = overrides.secondary ?? base.rankedTypes.find((item) => item.type !== primary)!.type;
  const rankedTypes = [{ type: primary, score: primary === "CAPITAL_ALLOCATOR" ? overrides.capital ?? 4.2 : 4.2 }, { type: secondary, score: 3.8 }, ...base.rankedTypes.filter((item) => item.type !== primary && item.type !== secondary)];
  return {
    ...base,
    readiness: { ...base.readiness, score: overrides.readiness ?? 3.9 },
    businessFit: { ...base.businessFit, score: overrides.businessFit ?? 3.7 },
    route: overrides.route ?? "B",
    rankedTypes,
    finalTypes: { ...base.finalTypes, ...(primary === "CAPITAL_ALLOCATOR" ? { CAPITAL_ALLOCATOR: overrides.capital ?? 4.2 } : {}) },
    scoringTrace: { ...base.scoringTrace, force_d_trace: { ...base.scoringTrace.force_d_trace, matched: Boolean(overrides.capitalForceD), capital_low_service_system: Boolean(overrides.capitalForceD) } },
  };
}

describe("V2.2 Phase B diagnostic interpretation", () => {
  it("Case 1: stable existing business and a new route ready to test do not conflict", () => {
    const result = buildDiagnosticInterpretation(profile("CAREER_EXIT", "READY_TO_TEST"), scoring({ route: "C" }), "STABLE")!;
    expect(result.diagnostic_stage).toBe("CAREER_TRANSITION_TESTING_READY");
    expect(result.coach_summary).toMatchObject({ business_status: "STABLE", action_stage: "READY_TO_TEST", diagnostic_stage: "CAREER_TRANSITION_TESTING_READY" });
    expect(result.conversation_strategy.opening_focus).toContain("現有副業或事業");
  });

  it("Case 2: no existing business and ready to start means zero-to-one launch", () => {
    const result = buildDiagnosticInterpretation(profile("SECOND_INCOME", "READY_TO_START"), scoring({ route: "B" }), "NONE")!;
    expect(result.diagnostic_stage).toBe("SECOND_INCOME_STARTING");
    expect(result.coach_summary).toMatchObject({ business_status: "NONE", action_stage: "READY_TO_START" });
  });

  it("Case 3: stable existing business and a new route in progress do not conflict", () => {
    const result = buildDiagnosticInterpretation(profile("BUILD_OWN_BUSINESS", "IN_PROGRESS", ["TIME"]), scoring({ route: "C" }), "STABLE")!;
    expect(result.diagnostic_stage).toBe("BUSINESS_GROWTH_IN_PROGRESS");
    expect(result.bottleneck_profile.primary_code).toBe("TIME");
    expect(result.next_step_route).toBe("EXISTING_BUSINESS_GROWTH");
  });

  it("Case 4: career exit while only exploring does not encourage resignation", () => {
    const result = buildDiagnosticInterpretation(profile("CAREER_EXIT", "EXPLORING_ONLY"), scoring({ route: "A" }), "NONE")!;
    expect(result.diagnostic_stage).toBe("CAREER_TRANSITION_EXPLORING");
    expect(result.next_step_route).toBe("CAREER_EXPLORATION");
    expect(result.not_recommended).toContain("不建議因為工作不開心就立即裸辭");
  });

  it("Case 5: career exit ready to test uses a low-risk transition", () => {
    const result = buildDiagnosticInterpretation(profile("CAREER_EXIT", "READY_TO_TEST"), scoring({ route: "A" }), "NONE")!;
    expect(result.diagnostic_stage).toBe("CAREER_TRANSITION_TESTING_READY");
    expect(result.next_step_route).toBe("CAREER_EXPLORATION");
    expect(result.conversation_strategy.avoid).toContain("不要一開始鼓勵離職");
  });

  it("keeps second-income exploration as a direction diagnosis", () => {
    const result = buildDiagnosticInterpretation(profile("SECOND_INCOME", "EXPLORING_ONLY"), scoring({ route: "B", readiness: 3.9, businessFit: 3.4, primary: "SYSTEM_OPERATOR", secondary: "CONTENT_INFLUENCER" }), "NONE")!;
    expect(result.diagnostic_stage).toBe("SECOND_INCOME_EXPLORING");
    expect(result.bottleneck_profile.primary_code).toBe("DIRECTION");
    expect(result.next_step_route).toBe("FOUNDATIONAL_ACTION");
    expect(result.health_business_recommendation).toBe("ONLY_IF_INTERESTED");
  });

  it("keeps Q13 independent for an in-progress route", () => {
    const result = buildDiagnosticInterpretation(profile("SIDE_HUSTLE_STUCK", "IN_PROGRESS", ["TRAFFIC", "PROSPECTING"]), scoring(), "ACTIVE")!;
    expect(result.diagnostic_stage).toBe("BUSINESS_GROWTH_IN_PROGRESS");
    expect(result.bottleneck_profile).toMatchObject({ primary_code: "TRAFFIC", secondary_code: "PROSPECTING", source: "USER_REPORTED" });
    expect(result.next_step_route).toBe("CLIENT_ACQUISITION");
  });

  it("keeps conversion next-step precedence", () => {
    const result = buildDiagnosticInterpretation(profile("BUILD_OWN_BUSINESS", "IN_PROGRESS", ["CONVERSION"]), scoring(), "ACTIVE")!;
    expect(result.next_step_route).toBe("CONVERSION_FIRST");
  });

  it("Case 6: capital force-D route", () => {
    const result = buildDiagnosticInterpretation(profile("FUTURE_SECURITY", "READY_TO_START"), scoring({ route: "D", primary: "CAPITAL_ALLOCATOR", capital: 4.3, capitalForceD: true }), "NONE")!;
    expect(result.next_step_route).toBe("CAPITAL_ROUTE");
    expect(result.health_business_recommendation).toBe("NOT_RECOMMENDED");
  });

  it("Case 7: skill/service route", () => {
    const result = buildDiagnosticInterpretation(profile("SECOND_INCOME", "READY_TO_START"), scoring({ route: "D", primary: "PROFESSIONAL_SKILL", secondary: "CONSULTING_SERVICE", businessFit: 3.1 }), "NONE")!;
    expect(result.next_step_route).toBe("SKILL_SERVICE");
  });

  it("returns null for legacy assessments without diagnostic data", () => {
    expect(buildDiagnosticInterpretation(null, scoring())).toBeNull();
  });

  it("keeps inferred bottlenecks clearly marked", () => {
    const result = buildDiagnosticInterpretation(profile("SELF_EXPLORATION", "EXPLORING_ONLY"), scoring(), "NONE")!;
    expect(result.bottleneck_profile.source).toBe("INFERRED");
    expect(result.client_sections.bottleneck.inferred).toBe(true);
    expect(result.client_sections.bottleneck.interpretation).toContain("較可能");
  });

  it("reads legacy current status without rewriting it", () => {
    const result = buildDiagnosticInterpretation(legacyProfile(), scoring(), "STABLE")!;
    expect(result.diagnostic_stage).toBe("TRAFFIC_BOTTLENECK");
    expect(result.legacy_current_status).toEqual({ code: "OFFER_EXISTS", label: "已經有商品、服務或商城" });
    expect(result.coach_summary.action_stage).toBe("OFFER_EXISTS");
  });
});

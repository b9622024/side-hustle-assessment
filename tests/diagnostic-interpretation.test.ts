import { describe, expect, it } from "vitest";
import { buildDiagnosticProfile, type BottleneckCode, type CurrentStatusCode, type MotivationCode } from "../src/diagnostic/profile";
import { buildDiagnosticInterpretation } from "../src/diagnostic/interpretation";
import { scoreAssessment } from "../src/scoring/engine";
import type { Route, ScoringResult, SideHustleType } from "../src/scoring/types";

const answers = { Q1: "A", Q2: "B", Q3: "A", Q4: "B", Q5: "A", Q6: "B", Q7: "B", Q8: "B", Q9: "A", Q10: "B" } as const;

function profile(motivation: MotivationCode, status: CurrentStatusCode, bottlenecks: BottleneckCode[] = []) {
  return buildDiagnosticProfile({ motivationCode: motivation, currentStatusV2: status, bottleneckAnswers: bottlenecks, bottleneckOtherText: bottlenecks.includes("OTHER") ? "其他問題" : undefined });
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
  it("Case 1: second-income exploration", () => {
    const result = buildDiagnosticInterpretation(profile("SECOND_INCOME", "NOT_STARTED"), scoring({ route: "B", readiness: 3.9, businessFit: 3.4, primary: "SYSTEM_OPERATOR", secondary: "CONTENT_INFLUENCER" }))!;
    expect(result.diagnostic_stage).toBe("EXPLORATION");
    expect(result.bottleneck_profile.primary_code).toBe("DIRECTION");
    expect(result.next_step_route).toBe("FOUNDATIONAL_ACTION");
    expect(result.health_business_recommendation).toBe("ONLY_IF_INTERESTED");
  });

  it("Case 2: career exit takes stage and next-step precedence", () => {
    const result = buildDiagnosticInterpretation(profile("CAREER_EXIT", "RESEARCHING"), scoring({ route: "A" }))!;
    expect(result.diagnostic_stage).toBe("CAREER_TRANSITION_WATCHING");
    expect(result.next_step_route).toBe("CAREER_EXPLORATION");
    expect(result.health_business_recommendation).toBe("EXPLORE_GENTLY");
  });

  it("Case 3: traffic and prospecting", () => {
    const result = buildDiagnosticInterpretation(profile("SIDE_HUSTLE_STUCK", "OFFER_EXISTS", ["TRAFFIC", "PROSPECTING"]), scoring())!;
    expect(result.diagnostic_stage).toBe("TRAFFIC_BOTTLENECK");
    expect(result.bottleneck_profile).toMatchObject({ primary_code: "TRAFFIC", secondary_code: "PROSPECTING", source: "USER_REPORTED" });
    expect(result.next_step_route).toBe("CLIENT_ACQUISITION");
  });

  it("Case 4: conversion precedes traffic and growth", () => {
    const result = buildDiagnosticInterpretation(profile("BUILD_OWN_BUSINESS", "CUSTOMERS_EXIST", ["CONVERSION"]), scoring())!;
    expect(result.diagnostic_stage).toBe("CONVERSION_BOTTLENECK");
    expect(result.next_step_route).toBe("CONVERSION_FIRST");
  });

  it("Case 5: established business growth", () => {
    const result = buildDiagnosticInterpretation(profile("BUILD_OWN_BUSINESS", "BUSINESS_ESTABLISHED", ["GROWTH_DIRECTION", "TIME"]), scoring({ route: "C" }))!;
    expect(result.diagnostic_stage).toBe("GROWTH_STAGE");
    expect(result.bottleneck_profile).toMatchObject({ primary_code: "TIME", secondary_code: "GROWTH_DIRECTION" });
    expect(result.next_step_route).toBe("EXISTING_BUSINESS_GROWTH");
    expect(result.health_business_recommendation).toBe("NOT_PRIMARY");
  });

  it("Case 6: capital force-D route", () => {
    const result = buildDiagnosticInterpretation(profile("FUTURE_SECURITY", "READY_TO_START"), scoring({ route: "D", primary: "CAPITAL_ALLOCATOR", capital: 4.3, capitalForceD: true }))!;
    expect(result.next_step_route).toBe("CAPITAL_ROUTE");
    expect(result.health_business_recommendation).toBe("NOT_RECOMMENDED");
  });

  it("Case 7: skill/service route", () => {
    const result = buildDiagnosticInterpretation(profile("SECOND_INCOME", "READY_TO_START"), scoring({ route: "D", primary: "PROFESSIONAL_SKILL", secondary: "CONSULTING_SERVICE", businessFit: 3.1 }))!;
    expect(result.next_step_route).toBe("SKILL_SERVICE");
  });

  it("returns null for legacy assessments without diagnostic data", () => {
    expect(buildDiagnosticInterpretation(null, scoring())).toBeNull();
  });

  it("keeps inferred bottlenecks clearly marked", () => {
    const result = buildDiagnosticInterpretation(profile("SELF_EXPLORATION", "NOT_STARTED"), scoring())!;
    expect(result.bottleneck_profile.source).toBe("INFERRED");
    expect(result.client_sections.bottleneck.inferred).toBe(true);
    expect(result.client_sections.bottleneck.interpretation).toContain("較可能");
  });
});

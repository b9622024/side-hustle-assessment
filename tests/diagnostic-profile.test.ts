import { describe, expect, it } from "vitest";
import { buildDiagnosticProfile, type DiagnosticInput } from "../src/diagnostic/profile";
import { scoreAssessment } from "../src/scoring/engine";

const base = {
  displayName: "Diagnostic Regression", birthDate: "1989-01-17", birthTime: "11:45", birthPlace: "台南市", businessStatus: "NONE" as const,
  answers: { Q1: "A", Q2: "B", Q3: "C", Q4: "D", Q5: "A", Q6: "B", Q7: "C", Q8: "D", Q9: "A", Q10: "B" } as const,
};

const cases: Array<[string, DiagnosticInput, boolean, string[]]> = [
  ["A exploring only", { motivationCode: "SECOND_INCOME", currentStatusV2: "EXPLORING_ONLY", bottleneckAnswers: [] }, false, []],
  ["B ready to test", { motivationCode: "CAREER_EXIT", currentStatusV2: "READY_TO_TEST", bottleneckAnswers: [] }, false, []],
  ["C ready to start", { motivationCode: "BUILD_OWN_BUSINESS", currentStatusV2: "READY_TO_START", bottleneckAnswers: [] }, false, []],
  ["D in progress", { motivationCode: "SIDE_HUSTLE_STUCK", currentStatusV2: "IN_PROGRESS", bottleneckAnswers: ["TRAFFIC", "PROSPECTING"] }, true, ["TRAFFIC", "PROSPECTING"]],
  ["E other text", { motivationCode: "SIDE_HUSTLE_STUCK", currentStatusV2: "IN_PROGRESS", bottleneckAnswers: ["OTHER"], bottleneckOtherText: "不知道怎麼定價" }, true, ["OTHER"]],
];

describe("V2.2 diagnostic profile", () => {
  it.each(cases)("builds Case %s", (_, input, applicable, codes) => {
    const profile = buildDiagnosticProfile(input);
    expect(profile.schema_version).toBe("2.2.1-q12-hotfix");
    expect(profile.bottlenecks.applicable).toBe(applicable);
    expect(profile.bottlenecks.selected.map((item) => item.code)).toEqual(codes);
    if (input.bottleneckAnswers.includes("OTHER")) expect(profile.bottlenecks.other_text).toBe("不知道怎麼定價");
  });

  it("rejects hidden stale Q13 data for Case E", () => {
    expect(() => buildDiagnosticProfile({ motivationCode: "SECOND_INCOME", currentStatusV2: "READY_TO_TEST", bottleneckAnswers: ["CONTENT", "TIME"] })).toThrow("INAPPLICABLE_DIAGNOSTIC_BOTTLENECK");
  });

  it("rejects more than two bottlenecks", () => {
    expect(() => buildDiagnosticProfile({ motivationCode: "SIDE_HUSTLE_STUCK", currentStatusV2: "IN_PROGRESS", bottleneckAnswers: ["TRAFFIC", "CONTENT", "TIME"] })).toThrow("INVALID_DIAGNOSTIC_BOTTLENECK_COUNT");
  });

  it("does not change any formal scoring output", () => {
    const before = scoreAssessment(base);
    const after = scoreAssessment({ ...base, diagnostic: { motivationCode: "SIDE_HUSTLE_STUCK", currentStatusV2: "IN_PROGRESS", bottleneckAnswers: ["TRAFFIC", "PROSPECTING"] } });
    expect(after).toEqual(before);
  });
});

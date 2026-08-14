import { describe, expect, it } from "vitest";
import { calculateBasicAstrologyProfile } from "../src/astrology/basic-profile";
import { resolveBirthPlace, TAIWAN_LOCATIONS } from "../src/astrology/locations";
import { buildClientReport } from "../src/report/build-client-report";
import { config } from "../src/scoring/config";
import type { Answers, BusinessStatus } from "../src/scoring/types";

const golden = config.golden_cases[0]!;
const assessment = { displayName: "嘉義測試", birthDate: "1989-01-17", birthTime: "11:45", birthPlace: "嘉義縣", businessStatus: golden.input.business_status as BusinessStatus, answers: golden.input.answers as Answers };

describe("Phase 4.1 location and numerology hotfix", () => {
  it("provides an exact selector entry for all 22 Taiwan counties and cities", () => {
    expect(TAIWAN_LOCATIONS).toHaveLength(22);
    expect(new Set(TAIWAN_LOCATIONS.map((item) => item.canonical_name)).size).toBe(22);
  });

  it("resolves 嘉義縣 independently from 嘉義市 and uses it for Ascendant", () => {
    expect(resolveBirthPlace("嘉義縣")).toEqual(expect.objectContaining({ canonical_name: "嘉義縣", latitude: 23.4518, longitude: 120.2555, timezone: "Asia/Taipei", resolution_status: "RESOLVED" }));
    const profile = calculateBasicAstrologyProfile(assessment.birthDate, assessment.birthTime, assessment.birthPlace);
    expect(profile.calculation.birth_place).toEqual(expect.objectContaining({ canonical_name: "嘉義縣", latitude: 23.4518, longitude: 120.2555 }));
    expect(profile.calculation.location_resolved).toBe(true);
    expect(profile.ascendant?.calculation_status).toBe("calculated_from_exact_time_and_location");
  });

  it("safely excludes Ascendant for unresolved overseas input", () => {
    const profile = calculateBasicAstrologyProfile("1989-01-17", "11:45", "日本東京");
    expect(profile.calculation.birth_place?.resolution_status).toBe("UNRESOLVED");
    expect(profile.calculation.precision).toBe("SUN_MOON");
    expect(profile.ascendant).toBeUndefined();
    expect(profile.data_completeness.excluded_points).toContain("ascendant");
  });

  it("exposes numerology counts, repeated digits and missing digits from report data", () => {
    const astrology = calculateBasicAstrologyProfile(assessment.birthDate, assessment.birthTime, assessment.birthPlace);
    const report = buildClientReport({ reportId: "HOTFIX-TEST", assessment, astrology });
    expect(report.numerology.digitDistribution).toHaveLength(9);
    expect(report.numerology.repeatedDigits).toEqual(["1", "9"]);
    expect(report.numerology.missingDigits).toEqual(["2", "3", "4", "5", "6", "7", "8"]);
  });
});

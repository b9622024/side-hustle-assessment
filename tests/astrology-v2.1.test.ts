import { describe, expect, it } from "vitest";
import config from "../src/scoring/config/side-hustle-scoring-v2-rc1.json";
import matrix from "../src/astrology/config/astrology-affinity-v2.1.0.json";
import { calculateAstrologyTypeLayer } from "../src/astrology/type-affinity";
import { scoreAssessment } from "../src/scoring/engine";
import { SIDE_HUSTLE_TYPES, type Answers, type AstrologyElement, type AstrologyModality, type BusinessStatus } from "../src/scoring/types";
import type { AstrologyPlacement, AstrologyProfile } from "../src/report/types";

const SIGNS = [
  ["ARIES", "牡羊座", "FIRE", "CARDINAL"], ["TAURUS", "金牛座", "EARTH", "FIXED"],
  ["GEMINI", "雙子座", "AIR", "MUTABLE"], ["CANCER", "巨蟹座", "WATER", "CARDINAL"],
  ["LEO", "獅子座", "FIRE", "FIXED"], ["VIRGO", "處女座", "EARTH", "MUTABLE"],
  ["LIBRA", "天秤座", "AIR", "CARDINAL"], ["SCORPIO", "天蠍座", "WATER", "FIXED"],
  ["SAGITTARIUS", "射手座", "FIRE", "MUTABLE"], ["CAPRICORN", "摩羯座", "EARTH", "CARDINAL"],
  ["AQUARIUS", "水瓶座", "AIR", "FIXED"], ["PISCES", "雙魚座", "WATER", "MUTABLE"],
] as const;

function placement(index: number): AstrologyPlacement {
  const [code, name, element, modality] = SIGNS[index]!;
  return { sign: name, sign_code: code, sign_name: name, longitude: index * 30 + 15, element: element as AstrologyElement, modality: modality as AstrologyModality, calculation_status: "golden_fixture" };
}

function profile(sunIndex: number, moonIndex = sunIndex, ascendantIndex = sunIndex): AstrologyProfile {
  const sun = placement(sunIndex); const moon = placement(moonIndex); const ascendant = placement(ascendantIndex);
  const element_distribution = { FIRE: 0, EARTH: 0, AIR: 0, WATER: 0 }; const modality_distribution = { CARDINAL: 0, FIXED: 0, MUTABLE: 0 };
  for (const [point, weight] of [[sun, 0.4], [moon, 0.35], [ascendant, 0.25]] as const) { element_distribution[point.element] += weight; modality_distribution[point.modality] += weight; }
  return { sun, moon, ascendant, element_distribution, modality_distribution, data_completeness: { birth_time_known: true, included_points: ["sun", "moon", "ascendant"], excluded_points: [], normalized_weights: { sun: 0.4, moon: 0.35, ascendant: 0.25 } }, calculation: { engine: "astronomy-engine", engine_version: "2.1.19", timezone: "Asia/Taipei", precision: "SUN_MOON_ASCENDANT", location_resolved: true } };
}

const goldenCases = config.golden_cases;
const baseAssessment = { displayName: "Golden", birthDate: "1990-01-01", birthTime: "12:00", birthPlace: "台北市" } as const;

describe("Astrology V2.1 isolation and boundaries", () => {
  it("keeps all formal Phase 2 outputs identical across four element-dominant profiles", () => {
    const golden = goldenCases[6]!;
    const scoring = scoreAssessment({ ...baseAssessment, businessStatus: golden.input.business_status as BusinessStatus, answers: golden.input.answers as Answers });
    const before = JSON.stringify(scoring);
    for (const signIndex of [0, 9, 6, 3]) {
      const layer = calculateAstrologyTypeLayer(scoring, profile(signIndex));
      expect(JSON.stringify(scoring)).toBe(before);
      expect(layer.formal_primary_type).toBe(scoring.rankedTypes[0]!.type);
      expect(layer.formal_secondary_type).toBe(scoring.rankedTypes[1]!.type);
      for (const type of SIDE_HUSTLE_TYPES) expect(layer.types[type].formal_type_score).toBe(scoring.finalTypes[type]);
    }
  });

  it("bounds all 12 × 12 × 12 point combinations to ±0.25", () => {
    const golden = goldenCases[0]!;
    const scoring = scoreAssessment({ ...baseAssessment, businessStatus: golden.input.business_status as BusinessStatus, answers: golden.input.answers as Answers });
    for (let sun = 0; sun < 12; sun += 1) for (let moon = 0; moon < 12; moon += 1) for (let ascendant = 0; ascendant < 12; ascendant += 1) {
      const layer = calculateAstrologyTypeLayer(scoring, profile(sun, moon, ascendant));
      for (const type of SIDE_HUSTLE_TYPES) {
        expect(layer.types[type].astrology_type_affinity).toBeGreaterThanOrEqual(-1);
        expect(layer.types[type].astrology_type_affinity).toBeLessThanOrEqual(1);
        expect(layer.types[type].astrology_modifier).toBeGreaterThanOrEqual(-0.25);
        expect(layer.types[type].astrology_modifier).toBeLessThanOrEqual(0.25);
        expect(layer.types[type].final_report_type_score).toBeGreaterThanOrEqual(1);
        expect(layer.types[type].final_report_type_score).toBeLessThanOrEqual(5);
      }
    }
  });

  it("uses a complete machine-readable matrix with valid contribution ranges", () => {
    expect(matrix.meta.version).toBe("astrology-affinity-v2.1.0");
    for (const row of [...Object.values(matrix.element_matrix), ...Object.values(matrix.modality_matrix)]) {
      expect(Object.keys(row).sort()).toEqual([...SIDE_HUSTLE_TYPES].sort());
      for (const value of Object.values(row)) expect(value).toBeGreaterThanOrEqual(-1);
    }
  });

  it("keeps G01-G10 formal ranks stable across all 1,728 astrology combinations", () => {
    for (const golden of goldenCases.slice(0, 10)) {
      const scoring = scoreAssessment({ ...baseAssessment, businessStatus: golden.input.business_status as BusinessStatus, answers: golden.input.answers as Answers });
      const before = JSON.stringify(scoring);
      for (let sun = 0; sun < 12; sun += 1) for (let moon = 0; moon < 12; moon += 1) for (let ascendant = 0; ascendant < 12; ascendant += 1) {
        const layer = calculateAstrologyTypeLayer(scoring, profile(sun, moon, ascendant));
        expect(layer.formal_primary_type).toBe(scoring.rankedTypes[0]!.type);
        expect(layer.formal_secondary_type).toBe(scoring.rankedTypes[1]!.type);
        if (scoring.typeState === "CLEAR") expect(layer.report_primary_type).toBe(layer.formal_primary_type);
      }
      expect(JSON.stringify(scoring)).toBe(before);
    }
  });
});

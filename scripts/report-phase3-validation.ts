import config from "../src/scoring/config/side-hustle-scoring-v2-rc1.json";
import matrix from "../src/astrology/config/astrology-affinity-v2.1.0.json";
import { calculateAstrologyTypeLayer } from "../src/astrology/type-affinity";
import { scoreAssessment } from "../src/scoring/engine";
import { SIDE_HUSTLE_TYPES, type Answers, type AstrologyElement, type AstrologyModality, type BusinessStatus } from "../src/scoring/types";
import type { AstrologyPlacement, AstrologyProfile } from "../src/report/types";

const SIGNS = [
  ["ARIES", "牡羊座", "FIRE", "CARDINAL"], ["TAURUS", "金牛座", "EARTH", "FIXED"], ["GEMINI", "雙子座", "AIR", "MUTABLE"],
  ["CANCER", "巨蟹座", "WATER", "CARDINAL"], ["LEO", "獅子座", "FIRE", "FIXED"], ["VIRGO", "處女座", "EARTH", "MUTABLE"],
  ["LIBRA", "天秤座", "AIR", "CARDINAL"], ["SCORPIO", "天蠍座", "WATER", "FIXED"], ["SAGITTARIUS", "射手座", "FIRE", "MUTABLE"],
  ["CAPRICORN", "摩羯座", "EARTH", "CARDINAL"], ["AQUARIUS", "水瓶座", "AIR", "FIXED"], ["PISCES", "雙魚座", "WATER", "MUTABLE"],
] as const;

function placement(index: number): AstrologyPlacement {
  const [code, name, element, modality] = SIGNS[index]!;
  return { sign: name, sign_code: code, sign_name: name, longitude: index * 30 + 15, element: element as AstrologyElement, modality: modality as AstrologyModality, calculation_status: "simulation_fixture" };
}
function profile(sunIndex: number, moonIndex = sunIndex, ascendantIndex = sunIndex): AstrologyProfile {
  const sun = placement(sunIndex); const moon = placement(moonIndex); const ascendant = placement(ascendantIndex);
  const element_distribution = { FIRE: 0, EARTH: 0, AIR: 0, WATER: 0 }; const modality_distribution = { CARDINAL: 0, FIXED: 0, MUTABLE: 0 };
  for (const [point, weight] of [[sun, 0.4], [moon, 0.35], [ascendant, 0.25]] as const) { element_distribution[point.element] += weight; modality_distribution[point.modality] += weight; }
  return { sun, moon, ascendant, element_distribution, modality_distribution, data_completeness: { birth_time_known: true, included_points: ["sun", "moon", "ascendant"], excluded_points: [], normalized_weights: { sun: 0.4, moon: 0.35, ascendant: 0.25 } }, calculation: { engine: "astronomy-engine", engine_version: "2.1.19", timezone: "Asia/Taipei", precision: "SUN_MOON_ASCENDANT", location_resolved: true } };
}

const base = { displayName: "Validation", birthDate: "1990-01-01", birthTime: "12:00", birthPlace: "台北市" } as const;
const elementGolden = { FIRE: 0, EARTH: 9, AIR: 6, WATER: 3 } as const;
let globalModifierMin = Infinity; let globalModifierMax = -Infinity; let regressions = 0;

const requestedGoldenCases = config.golden_cases.slice(0, 10);
const goldenResults = requestedGoldenCases.map((golden) => {
  const scoring = scoreAssessment({ ...base, businessStatus: golden.input.business_status as BusinessStatus, answers: golden.input.answers as Answers });
  const before = JSON.stringify(scoring);
  let reportPrimaryChanged = 0; let reportTopTwoChanged = 0; let formalChanged = 0;
  for (let sun = 0; sun < 12; sun += 1) for (let moon = 0; moon < 12; moon += 1) for (let ascendant = 0; ascendant < 12; ascendant += 1) {
    const layer = calculateAstrologyTypeLayer(scoring, profile(sun, moon, ascendant));
    if (layer.formal_primary_type !== scoring.rankedTypes[0]!.type || layer.formal_secondary_type !== scoring.rankedTypes[1]!.type) formalChanged += 1;
    if (layer.report_primary_type !== layer.formal_primary_type) reportPrimaryChanged += 1;
    if (layer.astrology_rank_adjustment) reportTopTwoChanged += 1;
    for (const type of SIDE_HUSTLE_TYPES) { globalModifierMin = Math.min(globalModifierMin, layer.types[type].astrology_modifier); globalModifierMax = Math.max(globalModifierMax, layer.types[type].astrology_modifier); }
  }
  if (JSON.stringify(scoring) !== before) regressions += 1;
  return { id: golden.id, answers: golden.input.answers_compact, formal_primary: scoring.rankedTypes[0]!.type, formal_secondary: scoring.rankedTypes[1]!.type, type_state: scoring.typeState, combinations: 1728, formal_rank_changes: formalChanged, report_primary_changes: reportPrimaryChanged, report_primary_change_rate: reportPrimaryChanged / 1728, report_top_two_adjustments: reportTopTwoChanged, report_top_two_adjustment_rate: reportTopTwoChanged / 1728 };
});

const behaviorCase = config.golden_cases[6]!;
const baseScoring = scoreAssessment({ ...base, businessStatus: behaviorCase.input.business_status as BusinessStatus, answers: behaviorCase.input.answers as Answers });
const elementGoldenResults = Object.entries(elementGolden).map(([element, signIndex]) => {
  const layer = calculateAstrologyTypeLayer(baseScoring, profile(signIndex));
  return { element, signs: [layer.astrology_scoring_trace.source_points.map((point) => profile(signIndex)[point]!.sign_name).join(" / ")], formal_type_final: baseScoring.finalTypes, type_percentile: baseScoring.scoringTrace.type_percentile, display_fit_index: baseScoring.scoringTrace.display_fit_index, readiness: baseScoring.readiness.score, business_fit: baseScoring.businessFit.score, risk_flags: baseScoring.riskFlags.map((flag) => flag.id), route: baseScoring.route, astrology_type_affinity: layer.astrology_scoring_trace.astrology_type_affinity, astrology_modifier: layer.astrology_scoring_trace.astrology_modifier, final_report_type_score: layer.astrology_scoring_trace.final_report_type_score, report_primary_type: layer.report_primary_type };
});

const report = {
  matrix: { version: matrix.meta.version, component_weights: matrix.component_weights, point_weights: matrix.point_weights, element_matrix: matrix.element_matrix, modality_matrix: matrix.modality_matrix },
  element_golden_cases: elementGoldenResults,
  rank_stability: goldenResults,
  rank_stability_summary: {
    total_cases: goldenResults.length * 1728,
    formal_rank_changes: goldenResults.reduce((sum, item) => sum + item.formal_rank_changes, 0),
    report_primary_changes: goldenResults.reduce((sum, item) => sum + item.report_primary_changes, 0),
    report_primary_change_rate: goldenResults.reduce((sum, item) => sum + item.report_primary_changes, 0) / (goldenResults.length * 1728),
    clear_report_primary_change_rate: goldenResults.filter((item) => item.type_state === "CLEAR").reduce((sum, item) => sum + item.report_primary_changes, 0) / (goldenResults.filter((item) => item.type_state === "CLEAR").length * 1728),
  },
  modifier_boundary: { combinations_per_golden: 1728, observed_min: globalModifierMin, observed_max: globalModifierMax, required_min: -0.25, required_max: 0.25, passed: globalModifierMin >= -0.25 && globalModifierMax <= 0.25 },
  regression: { scoring_objects_changed: regressions, passed: regressions === 0, protected_fields: ["formal_behavior_dimension_v2", "routing_behavior_dimension_v2", "formal_type_final", "formal_primary_type", "formal_secondary_type", "type_state", "type_percentile", "display_fit_index", "readiness", "business_fit", "risk_flags", "route"] },
};
console.log(JSON.stringify(report, null, 2));

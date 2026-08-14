import { config } from "../scoring/config";
import { calculateLifePath } from "../scoring/engine";
import { calculateAstrologyTypeLayer } from "../astrology/type-affinity";
import type { CoachAssessmentDetail } from "../lib/coach/data";
import { SIDE_HUSTLE_TYPES, type Dimension, type QuestionId, type SideHustleType } from "../scoring/types";
import type { AstrologyLayerResult, AstrologyPlacement, AstrologyProfile } from "./types";
import { resolveBirthPlace } from "../astrology/locations";
import { buildDiagnosticInterpretation } from "../diagnostic/interpretation";

const MASTER_NUMBERS = [11, 22, 33] as const;
const PERCENTILE_REFERENCE_VERSION = "side-hustle-v2-rc1-theoretical-reference-1.0.0";
const ASTROLOGY_VERSION = "astrology-affinity-v2.1.0";
const POINT_KEYS = ["sun", "moon", "ascendant"] as const;
const BASE_WEIGHTS = { sun: 0.4, moon: 0.35, ascendant: 0.25 } as const;
type PointKey = typeof POINT_KEYS[number];
type UnknownRecord = Record<string, unknown>;

function reduceNumber(value: number) {
  let current = value;
  while (current > 9 && !MASTER_NUMBERS.includes(current as 11 | 22 | 33)) current = String(current).split("").reduce((total, digit) => total + Number(digit), 0);
  return current;
}

function numerologyProfile(birthDate: string) {
  const digitCounts = Object.fromEntries(Array.from({ length: 9 }, (_, index) => [String(index + 1), 0])) as Record<string, number>;
  for (const digit of birthDate.replaceAll("-", "").split("")) if (digit !== "0") digitCounts[digit] = (digitCounts[digit] ?? 0) + 1;
  const lifePath = calculateLifePath(birthDate);
  return {
    life_path_number: lifePath, birthday_number: reduceNumber(Number(birthDate.slice(8, 10))), digit_counts: digitCounts,
    repeated_digits: Object.entries(digitCounts).filter(([, count]) => count > 1).map(([digit, count]) => ({ digit: Number(digit), count })),
    missing_digits: Object.entries(digitCounts).filter(([, count]) => count === 0).map(([digit]) => Number(digit)),
    is_master_number: MASTER_NUMBERS.includes(lifePath as 11 | 22 | 33), role: ["interpretation", "cross_analysis", "birth_profile_display"],
  };
}

function isPlacement(value: unknown): value is AstrologyPlacement {
  if (!value || typeof value !== "object") return false;
  const point = value as UnknownRecord;
  return typeof point.sign === "string" && typeof point.element === "string" && typeof point.modality === "string";
}

function normalizePlacement(value: unknown, point: PointKey) {
  if (!isPlacement(value)) return { calculation_status: point === "ascendant" ? "unavailable_location" : "unavailable_birth_data", included: false };
  return { ...value, sign_code: value.sign_code ?? null, sign_name: value.sign_name ?? value.sign, longitude: typeof value.longitude === "number" ? value.longitude : null, calculation_status: value.calculation_status ?? "legacy_profile_preserved", included: true };
}

function normalizeAstrologyProfile(raw: CoachAssessmentDetail["astrology_profile"]): AstrologyProfile | null {
  if (!isPlacement(raw?.sun)) return null;
  const available = POINT_KEYS.filter((key) => isPlacement(raw[key]));
  const total = available.reduce((sum, key) => sum + BASE_WEIGHTS[key], 0);
  const normalizedWeights = Object.fromEntries(available.map((key) => [key, BASE_WEIGHTS[key] / total])) as Partial<Record<PointKey, number>>;
  const elementDistribution = { FIRE: 0, EARTH: 0, AIR: 0, WATER: 0 };
  const modalityDistribution = { CARDINAL: 0, FIXED: 0, MUTABLE: 0 };
  for (const key of available) {
    const point = raw[key]!;
    elementDistribution[point.element] += normalizedWeights[key] ?? 0;
    modalityDistribution[point.modality] += normalizedWeights[key] ?? 0;
  }
  const saved = raw as Partial<AstrologyProfile>;
  return {
    sun: raw.sun as AstrologyPlacement, ...(isPlacement(raw.moon) ? { moon: raw.moon as AstrologyPlacement } : {}), ...(isPlacement(raw.ascendant) ? { ascendant: raw.ascendant as AstrologyPlacement } : {}),
    element_distribution: saved.element_distribution ?? elementDistribution, modality_distribution: saved.modality_distribution ?? modalityDistribution,
    data_completeness: saved.data_completeness ?? { birth_time_known: available.includes("moon"), included_points: available, excluded_points: POINT_KEYS.filter((key) => !available.includes(key)), normalized_weights: normalizedWeights },
    calculation: saved.calculation ?? { engine: "astronomy-engine", engine_version: "2.1.19", timezone: "Asia/Taipei", precision: available.includes("ascendant") ? "SUN_MOON_ASCENDANT" : available.includes("moon") ? "SUN_MOON" : "SUN_ONLY", location_resolved: available.includes("ascendant") },
  };
}

function getAstrologyLayer(record: CoachAssessmentDetail, profile: AstrologyProfile | null): AstrologyLayerResult | null {
  const clientLayer = record.client_reports[0]?.report_data?.astrologyLayer;
  if (clientLayer) return clientLayer;
  const scoring = record.scoring_snapshot;
  if (!profile || !scoring.finalTypes || !scoring.typeDisplayScores || record.scoring_version !== "side-hustle-scoring-v2-rc1") return null;
  return calculateAstrologyTypeLayer(scoring, profile);
}

function typeValue(formalScore: number | null, display: { type_percentile?: number; display_fit_index?: number } | undefined, layer: AstrologyLayerResult | null, type: SideHustleType) {
  return { formal_type_score: formalScore, type_percentile: display?.type_percentile ?? null, display_fit_index: display?.display_fit_index ?? null, astrology_type_affinity: layer?.types[type].astrology_type_affinity ?? null, astrology_modifier: layer?.types[type].astrology_modifier ?? null, final_report_type_score: layer?.types[type].final_report_type_score ?? formalScore };
}

export function buildFullAssessmentJson(record: CoachAssessmentDetail) {
  const scoring = record.scoring_snapshot;
  const clientReport = record.client_reports[0]?.report_data;
  const profile = normalizeAstrologyProfile(record.astrology_profile);
  const layer = getAstrologyLayer(record, profile);
  const questionnaire = config.questionnaire.map((question) => { const id = question.id as QuestionId; const answer = record.answers[id]; return { id, text: question.text, answer, answer_text: question.options[answer]?.text ?? null }; });
  const diagnosticProfile = record.diagnostic_profile ?? null;
  const diagnosticInterpretation = buildDiagnosticInterpretation(diagnosticProfile, scoring);
  const diagnosticQuestionnaire = diagnosticProfile ? [
    { id: "Q11", answer_code: diagnosticProfile.motivation.code },
    { id: "Q12", answer_code: diagnosticProfile.current_status.code },
    { id: "Q13", answer_codes: diagnosticProfile.bottlenecks.selected.map((item) => item.code), other_text: diagnosticProfile.bottlenecks.other_text },
  ] : [];
  const dimensions = scoring.formalBehaviorDimensions ?? scoring.dimensions ?? null;
  const finalTypes = scoring.finalTypes ?? Object.fromEntries((scoring.rankedTypes ?? []).map((item) => [item.type, item.score]));
  const formalPrimary = scoring.rankedTypes?.[0]?.type ?? null;
  const formalSecondary = scoring.rankedTypes?.[1]?.type ?? null;
  const scoringTrace = scoring.scoringTrace ? { ...scoring.scoringTrace, diagnostic_questions_excluded_from_formal_scoring: ["Q11", "Q12", "Q13"], astrology_scoring_trace: layer?.astrology_scoring_trace ?? null } : null;
  const consultation = record.consultation_setting ?? null;
  const birthPlaceResolution = profile?.calculation.birth_place ?? resolveBirthPlace(record.birth_place);
  return {
    report_meta: { report_id: record.report_id, report_type: "side_hustle_suitability_action", report_display_name: "副業適性測驗", model_version: "side-hustle-report-v2.1-rc", questionnaire_version: config.meta.questionnaire_version, scoring_version: record.scoring_version, routing_version: "side-hustle-routing-v2-rc1", astrology_version: ASTROLOGY_VERSION, percentile_reference_version: scoring.scoringTrace?.type_percentile_reference_version ?? PERCENTILE_REFERENCE_VERSION, created_at: record.created_at, updated_at: record.updated_at ?? record.created_at, language: "zh-TW", ...(record.scoring_version !== "side-hustle-scoring-v2-rc1" ? { legacy_result_preserved: true } : {}) },
    respondent: { display_name: record.display_name },
    birth_data: { date: record.birth_date, time: record.birth_time, place: record.birth_place, birth_time_known: Boolean(record.birth_time), birth_place: birthPlaceResolution },
    business_status: { code: record.business_status, label: config.business_status_options[record.business_status] },
    astrology: {
      sun: normalizePlacement(profile?.sun, "sun"), moon: normalizePlacement(profile?.moon, "moon"), ascendant: normalizePlacement(profile?.ascendant, "ascendant"),
      element_distribution: profile?.element_distribution ?? null, modality_distribution: profile?.modality_distribution ?? null,
      data_completeness: profile?.data_completeness ?? { birth_time_known: Boolean(record.birth_time), included_points: [], excluded_points: [...POINT_KEYS], normalized_weights: {} },
      astrology_type_affinity: layer?.astrology_scoring_trace.astrology_type_affinity ?? null, astrology_modifier: layer?.astrology_scoring_trace.astrology_modifier ?? null,
      report_type_scores: layer?.astrology_scoring_trace.final_report_type_score ?? null, astrology_rank_adjustment: layer?.astrology_rank_adjustment ?? false, calculation: profile?.calculation ?? null, birth_place: birthPlaceResolution,
    },
    numerology: numerologyProfile(record.birth_date), questionnaire: { version: config.meta.questionnaire_version, answers: [...questionnaire, ...diagnosticQuestionnaire] }, scoring_trace: scoringTrace,
    behavior_profile: { scale: { min: 1, max: 5, display_decimals: 1 }, dimensions: dimensions ? Object.fromEntries(Object.entries(dimensions).map(([key, score]) => [key, { label: config.dimensions[key as Dimension].label, score }])) : null, formal_dimensions: scoring.formalBehaviorDimensions ?? null, routing_dimensions: scoring.routingDimensions ?? null },
    side_hustle_types: { formal_primary_type: formalPrimary, formal_secondary_type: formalSecondary, type_state: scoring.typeState ?? null, report_primary_type: layer?.report_primary_type ?? formalPrimary, report_secondary_type: layer?.report_secondary_type ?? formalSecondary, astrology_rank_adjustment: layer?.astrology_rank_adjustment ?? false, ranking: scoring.rankedTypes ?? [], types: Object.fromEntries(SIDE_HUSTLE_TYPES.map((type) => [type, typeValue(typeof finalTypes[type] === "number" ? finalTypes[type] : null, scoring.typeDisplayScores?.[type], layer, type)])), source: "behavior_formal_with_separate_astrology_report_layer" },
    readiness: scoring.readiness ?? null, business_fit: scoring.businessFit ?? null, risk_flags: scoring.riskFlags ?? [],
    routing: { system_route: scoring.route ?? null, label: scoring.route ? config.routing.rules[scoring.route].label : null, consultation_priority: scoring.consultationPriority ?? null },
    cross_analysis: layer?.astrology_cross_analysis ?? { alignments: [], tensions: [], neutral_findings: [], summary: clientReport?.astrology?.summary ?? null },
    diagnostic_profile: diagnosticProfile ? { ...diagnosticProfile, diagnostic_stage: diagnosticInterpretation?.diagnostic_stage ?? null } : null,
    diagnostic_interpretation: diagnosticInterpretation ? { schema_version: diagnosticInterpretation.schema_version, bottleneck_profile: diagnosticInterpretation.bottleneck_profile, next_step_route: diagnosticInterpretation.next_step_route, not_recommended: diagnosticInterpretation.not_recommended } : null,
    routing_context: diagnosticInterpretation ? { system_route: scoring.route, health_business_recommendation: diagnosticInterpretation.health_business_recommendation, conversation_strategy: diagnosticInterpretation.conversation_strategy } : null,
    coach_summary: diagnosticInterpretation?.coach_summary ?? null,
    data_quality: { scoring_trace_available: Boolean(scoring.scoringTrace), percentile_available: Boolean(scoring.typeDisplayScores), astrology_v2_1_available: Boolean(layer), client_report_available: Boolean(clientReport), compatibility_mode: record.scoring_version === "side-hustle-scoring-v2-rc1" ? "CURRENT" : "LEGACY_PRESERVED", missing_fields: [...(!scoring.scoringTrace ? ["scoring_trace"] : []), ...(!scoring.typeDisplayScores ? ["type_percentile", "display_fit_index"] : []), ...(!layer ? ["astrology_v2_1"] : [])] },
    client_journey: consultation?.client_journey ?? null,
    consultation_context: consultation?.consultation_context ?? null,
    selected_offer: consultation?.selected_offer ?? null,
    backup_offer: consultation?.backup_offer ?? null,
    coach_notes: consultation?.coach_notes ?? null,
  };
}

export function serializeFullAssessmentJson(record: CoachAssessmentDetail) { return JSON.stringify(buildFullAssessmentJson(record), null, 2); }
/** @deprecated Use buildFullAssessmentJson. Kept for existing integrations. */
export const buildCoachJsonExport = buildFullAssessmentJson;

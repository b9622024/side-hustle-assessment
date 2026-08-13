import matrixJson from "./config/astrology-affinity-v2.1.0.json";
import type { AstrologyLayerResult, AstrologyPlacement, AstrologyProfile, AstrologyCrossAnalysisFinding } from "../report/types";
import { SIDE_HUSTLE_TYPES, type AstrologyElement, type AstrologyModality, type ScoreMap, type ScoringResult, type SideHustleType } from "../scoring/types";

const POINTS = ["sun", "moon", "ascendant"] as const;
type PointKey = typeof POINTS[number];
const BASE_WEIGHTS = matrixJson.point_weights;
const ELEMENT_WEIGHT = matrixJson.component_weights.element;
const MODALITY_WEIGHT = matrixJson.component_weights.modality;
const MODIFIER_AMPLITUDE = matrixJson.meta.modifier_amplitude;
const ELEMENT_MATRIX = matrixJson.element_matrix as Record<AstrologyElement, ScoreMap<SideHustleType>>;
const MODALITY_MATRIX = matrixJson.modality_matrix as Record<AstrologyModality, ScoreMap<SideHustleType>>;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function pointVector(point: AstrologyPlacement): ScoreMap<SideHustleType> {
  return Object.fromEntries(SIDE_HUSTLE_TYPES.map((type) => [
    type,
    ELEMENT_MATRIX[point.element][type] * ELEMENT_WEIGHT + MODALITY_MATRIX[point.modality][type] * MODALITY_WEIGHT,
  ])) as ScoreMap<SideHustleType>;
}

function contributionVector(point: AstrologyPlacement, matrix: "element" | "modality"): ScoreMap<SideHustleType> {
  return Object.fromEntries(SIDE_HUSTLE_TYPES.map((type) => [
    type,
    matrix === "element" ? ELEMENT_MATRIX[point.element][type] : MODALITY_MATRIX[point.modality][type],
  ])) as ScoreMap<SideHustleType>;
}

function finding(type: SideHustleType, scoring: ScoringResult, affinity: number, category: "alignment" | "tension" | "neutral"): AstrologyCrossAnalysisFinding {
  const interpretation = category === "alignment"
    ? "目前行為表現與出生工作風格方向有明顯呼應。"
    : category === "tension"
      ? "出生傾向與目前實際行為存在差異，可能代表這項能力是後天建立，或目前工作情境促使你採用不同方式。"
      : "目前行為結果與出生工作風格沒有明顯加強或拉扯，適合以實際經驗作為主要判斷。";
  return { type, formal_type_score: scoring.finalTypes[type], astrology_affinity: affinity, interpretation };
}

function crossAnalysis(scoring: ScoringResult, affinities: ScoreMap<SideHustleType>): AstrologyLayerResult["astrology_cross_analysis"] {
  const alignments: AstrologyCrossAnalysisFinding[] = [];
  const tensions: AstrologyCrossAnalysisFinding[] = [];
  const neutralFindings: AstrologyCrossAnalysisFinding[] = [];
  for (const type of SIDE_HUSTLE_TYPES) {
    const affinity = affinities[type];
    if (scoring.finalTypes[type] >= 3.5 && affinity >= 0.25) alignments.push(finding(type, scoring, affinity, "alignment"));
    else if (scoring.finalTypes[type] >= 3.5 && affinity <= -0.15) tensions.push(finding(type, scoring, affinity, "tension"));
    else neutralFindings.push(finding(type, scoring, affinity, "neutral"));
  }
  const summary = alignments.length > 0
    ? "出生結構與部分高分副業模式呈現呼應；正式方向仍以行為測驗結果為主，星座層用來補充你較自然的工作節奏。"
    : tensions.length > 0
      ? "出生工作風格與目前部分高分行為不同，這可能反映後天能力或情境調整，不代表結果互相否定。"
      : "出生工作風格對目前六型結果沒有形成強烈加成或拉扯，正式方向仍以行為測驗結果為主。";
  return { alignments, tensions, neutral_findings: neutralFindings, summary };
}

export function calculateAstrologyTypeLayer(scoring: ScoringResult, profile: AstrologyProfile): AstrologyLayerResult {
  const available = POINTS.filter((point) => profile[point]);
  const totalWeight = available.reduce((sum, point) => sum + BASE_WEIGHTS[point], 0);
  const normalizedWeights = Object.fromEntries(available.map((point) => [point, BASE_WEIGHTS[point] / totalWeight])) as Partial<Record<PointKey, number>>;
  const vectors = Object.fromEntries(available.map((point) => [point, pointVector(profile[point]!)])) as Partial<Record<PointKey, ScoreMap<SideHustleType>>>;
  const elementContributions = Object.fromEntries(available.map((point) => [point, contributionVector(profile[point]!, "element")])) as Partial<Record<PointKey, ScoreMap<SideHustleType>>>;
  const modalityContributions = Object.fromEntries(available.map((point) => [point, contributionVector(profile[point]!, "modality")])) as Partial<Record<PointKey, ScoreMap<SideHustleType>>>;

  const affinities = Object.fromEntries(SIDE_HUSTLE_TYPES.map((type) => {
    const affinity = available.reduce((sum, point) => sum + (normalizedWeights[point] ?? 0) * vectors[point]![type], 0);
    return [type, clamp(affinity, -1, 1)];
  })) as ScoreMap<SideHustleType>;
  const modifiers = Object.fromEntries(SIDE_HUSTLE_TYPES.map((type) => [type, clamp(affinities[type] * MODIFIER_AMPLITUDE, -0.25, 0.25)])) as ScoreMap<SideHustleType>;
  const finalReportScores = Object.fromEntries(SIDE_HUSTLE_TYPES.map((type) => [type, clamp(scoring.finalTypes[type] + modifiers[type], 1, 5)])) as ScoreMap<SideHustleType>;
  const types = Object.fromEntries(SIDE_HUSTLE_TYPES.map((type) => [type, {
    formal_type_score: scoring.finalTypes[type],
    astrology_type_affinity: affinities[type],
    astrology_modifier: modifiers[type],
    final_report_type_score: finalReportScores[type],
  }])) as AstrologyLayerResult["types"];
  const formalRanking = scoring.rankedTypes.map(({ type }) => type);
  const formalRankIndex = new Map(formalRanking.map((type, index) => [type, index]));
  const reportRanking = SIDE_HUSTLE_TYPES.toSorted((a, b) => finalReportScores[b] - finalReportScores[a] || formalRankIndex.get(a)! - formalRankIndex.get(b)!);

  return {
    matrix_version: "astrology-affinity-v2.1.0",
    types,
    formal_primary_type: formalRanking[0]!,
    formal_secondary_type: formalRanking[1]!,
    report_primary_type: reportRanking[0]!,
    report_secondary_type: reportRanking[1]!,
    report_type_ranking: reportRanking,
    astrology_rank_adjustment: formalRanking[0] !== reportRanking[0] || formalRanking[1] !== reportRanking[1],
    astrology_cross_analysis: crossAnalysis(scoring, affinities),
    astrology_scoring_trace: {
      source_points: available,
      base_weights: BASE_WEIGHTS,
      normalized_weights: normalizedWeights,
      sun_affinity: vectors.sun!,
      moon_affinity: vectors.moon ?? null,
      ascendant_affinity: vectors.ascendant ?? null,
      element_contributions: elementContributions,
      modality_contributions: modalityContributions,
      astrology_type_affinity: affinities,
      astrology_modifier: modifiers,
      final_report_type_score: finalReportScores,
    },
  };
}

export { matrixJson as astrologyAffinityMatrix };

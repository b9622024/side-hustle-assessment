export const QUESTION_IDS = ["Q1","Q2","Q3","Q4","Q5","Q6","Q7","Q8","Q9","Q10"] as const;
export const DIMENSIONS = ["A","C","S","I","R","P","K"] as const;
export const SIDE_HUSTLE_TYPES = ["SYSTEM_OPERATOR","CONTENT_INFLUENCER","CONSULTING_SERVICE","RELATIONSHIP_BUILDER","PROFESSIONAL_SKILL","CAPITAL_ALLOCATOR"] as const;

export type QuestionId = typeof QUESTION_IDS[number];
export type Option = "A" | "B" | "C" | "D";
export type Dimension = typeof DIMENSIONS[number];
export type SideHustleType = typeof SIDE_HUSTLE_TYPES[number];
export type BusinessStatus = "NONE" | "TRIED_NOT_ACTIVE" | "ACTIVE" | "STABLE";
export type Route = "A" | "B" | "C" | "D";
export type TypeState = "CLEAR" | "MIXED" | "EXPLORATORY";
export type ScoreMap<K extends string> = Record<K, number>;
export type Answers = Record<QuestionId, Option>;
export type AstrologyElement = "FIRE"|"EARTH"|"AIR"|"WATER";
export type AstrologyModality = "CARDINAL"|"FIXED"|"MUTABLE";
export type LifePathNumber = 1|2|3|4|5|6|7|8|9|11|22|33;
export interface AstrologyComponent { element: AstrologyElement; modality: AstrologyModality; }
export interface AstrologyScoringInput { sun: AstrologyComponent; moon?: AstrologyComponent; ascendant?: AstrologyComponent; }

export interface AssessmentInput {
  displayName: string;
  birthDate: string;
  birthTime?: string;
  birthPlace?: string;
  businessStatus: BusinessStatus;
  answers: Answers;
}

export interface RiskFlag { id: "F1"|"F2"|"F3"|"F4"; label: string; severity: "HIGH"|"MEDIUM"; routingRole?: string; }
export interface StrangerInteraction { score: number; type: string; label: string; }
export interface RankedType { type: SideHustleType; score: number; }
export interface PersonalityScores { astrology: ScoreMap<SideHustleType>; numerology: ScoreMap<SideHustleType>; }
export interface ScoringTrace {
  question_answers: Answers;
  formal_question_weights: Record<QuestionId, number>;
  routing_question_weights: Record<QuestionId, number>;
  behavior_raw_scores: ScoreMap<Dimension>;
  behavior_dimension_v1: ScoreMap<Dimension>;
  formal_behavior_dimension_v2: ScoreMap<Dimension>;
  routing_behavior_dimension_v1: ScoreMap<Dimension>;
  routing_behavior_dimension_v2: ScoreMap<Dimension>;
  formal_type_precalibrated: ScoreMap<SideHustleType>;
  formal_type_final: ScoreMap<SideHustleType>;
  type_ranking: RankedType[];
  type_state: TypeState;
  readiness_components: Record<string, { question: QuestionId; answer: Option; option_score: number; weight: number; weighted_score: number }>;
  readiness_score: number;
  stranger_interaction: StrangerInteraction;
  business_fit_components: Record<string, { value: number; weight: number; weighted_score: number }>;
  business_fit_score: number;
  risk_flags: RiskFlag[];
  force_d_trace: { matched: boolean; high_risk: boolean; capital_low_service_system: boolean; low_prs_count: number };
  routing_trace: Array<{ rule: "FORCE_D"|Route; matched: boolean; detail: Record<string, boolean | number | string> }>;
  system_route: Route;
}

export interface ScoringResult {
  scoringVersion: "side-hustle-scoring-v2-rc1";
  rawDimensions: ScoreMap<Dimension>;
  dimensionMax: ScoreMap<Dimension>;
  dimensions: ScoreMap<Dimension>;
  formalBehaviorDimensions: ScoreMap<Dimension>;
  routingDimensions: ScoreMap<Dimension>;
  behaviorTypes: ScoreMap<SideHustleType>;
  finalTypes: ScoreMap<SideHustleType>;
  rankedTypes: RankedType[];
  typeState: TypeState;
  frictions: Record<string, number>;
  spectrums: Record<string, number>;
  readiness: { score: number; level: string };
  strangerInteraction: StrangerInteraction;
  businessFit: { score: number; rawScore: number; level: string };
  riskFlags: RiskFlag[];
  aiMarketingPotential: "HIGH"|"MEDIUM"|"LOW";
  route: Route;
  consultationPriority: "HIGH"|"MEDIUM"|"LOW";
  warnings: string[];
  scoringTrace: ScoringTrace;
}

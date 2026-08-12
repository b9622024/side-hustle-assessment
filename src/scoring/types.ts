export const QUESTION_IDS = ["Q1","Q2","Q3","Q4","Q5","Q6","Q7","Q8","Q9","Q10"] as const;
export const DIMENSIONS = ["A","C","S","I","R","P","K"] as const;
export const SIDE_HUSTLE_TYPES = ["SYSTEM_OPERATOR","CONTENT_INFLUENCER","CONSULTING_SERVICE","RELATIONSHIP_BUILDER","PROFESSIONAL_SKILL","CAPITAL_ALLOCATOR"] as const;

export type QuestionId = typeof QUESTION_IDS[number];
export type Option = "A" | "B" | "C" | "D";
export type Dimension = typeof DIMENSIONS[number];
export type SideHustleType = typeof SIDE_HUSTLE_TYPES[number];
export type BusinessStatus = "NONE" | "TRIED_NOT_ACTIVE" | "ACTIVE" | "STABLE";
export type Route = "A" | "B" | "C" | "D";
export type ScoreMap<K extends string> = Record<K, number>;
export type Answers = Record<QuestionId, Option>;

export interface AssessmentInput {
  displayName: string;
  birthDate: string;
  birthTime?: string;
  birthPlace?: string;
  businessStatus: BusinessStatus;
  answers: Answers;
}

export interface RiskFlag { id: "F1"|"F2"|"F3"|"F4"; label: string; severity: "HIGH"|"MEDIUM"; }
export interface StrangerInteraction { score: number; type: string; label: string; }
export interface RankedType { type: SideHustleType; score: number; }
export interface PersonalityScores { astrology: ScoreMap<SideHustleType>; numerology: ScoreMap<SideHustleType>; }
export interface ScoringResult {
  rawDimensions: ScoreMap<Dimension>;
  dimensionMax: ScoreMap<Dimension>;
  dimensions: ScoreMap<Dimension>;
  behaviorTypes: ScoreMap<SideHustleType>;
  finalTypes?: ScoreMap<SideHustleType>;
  rankedTypes: RankedType[];
  typeState: "CLEAR"|"MIXED"|"EXPLORATORY";
  frictions: Record<string, number>;
  spectrums: Record<string, number>;
  readiness: { score: number; level: string };
  strangerInteraction: StrangerInteraction;
  businessFit: { score: number; level: string };
  riskFlags: RiskFlag[];
  aiMarketingPotential: "HIGH"|"MEDIUM"|"LOW";
  route: Route;
  consultationPriority: "HIGH"|"MEDIUM"|"LOW";
  warnings: string[];
}

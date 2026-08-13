import type { AstrologyElement, AstrologyModality, Dimension, SideHustleType } from "../scoring/types";

export interface AstrologyPlacement {
  sign: string;
  sign_code: string;
  sign_name: string;
  longitude: number;
  element: AstrologyElement;
  modality: AstrologyModality;
  calculation_status: string;
}

export interface AstrologyProfile {
  sun: AstrologyPlacement;
  moon?: AstrologyPlacement;
  ascendant?: AstrologyPlacement;
  element_distribution: Record<AstrologyElement, number>;
  modality_distribution: Record<AstrologyModality, number>;
  data_completeness: {
    birth_time_known: boolean;
    included_points: Array<"sun" | "moon" | "ascendant">;
    excluded_points: Array<"sun" | "moon" | "ascendant">;
    normalized_weights: Partial<Record<"sun" | "moon" | "ascendant", number>>;
  };
  calculation: {
    engine: "astronomy-engine";
    engine_version: "2.1.19";
    timezone: "Asia/Taipei";
    precision: "SUN_ONLY" | "SUN_MOON" | "SUN_MOON_ASCENDANT";
    location_resolved: boolean;
    latitude?: number;
    longitude?: number;
  };
}

export interface AstrologyTypeResult {
  formal_type_score: number;
  astrology_type_affinity: number;
  astrology_modifier: number;
  final_report_type_score: number;
}

export interface AstrologyCrossAnalysisFinding {
  type: SideHustleType;
  formal_type_score: number;
  astrology_affinity: number;
  interpretation: string;
}

export interface AstrologyLayerResult {
  matrix_version: "astrology-affinity-v2.1.0";
  types: Record<SideHustleType, AstrologyTypeResult>;
  formal_primary_type: SideHustleType;
  formal_secondary_type: SideHustleType;
  report_primary_type: SideHustleType;
  report_secondary_type: SideHustleType;
  report_type_ranking: SideHustleType[];
  astrology_rank_adjustment: boolean;
  astrology_cross_analysis: {
    alignments: AstrologyCrossAnalysisFinding[];
    tensions: AstrologyCrossAnalysisFinding[];
    neutral_findings: AstrologyCrossAnalysisFinding[];
    summary: string;
  };
  astrology_scoring_trace: {
    source_points: Array<"sun" | "moon" | "ascendant">;
    base_weights: Record<"sun" | "moon" | "ascendant", number>;
    normalized_weights: Partial<Record<"sun" | "moon" | "ascendant", number>>;
    sun_affinity: Record<SideHustleType, number>;
    moon_affinity: Record<SideHustleType, number> | null;
    ascendant_affinity: Record<SideHustleType, number> | null;
    element_contributions: Partial<Record<"sun" | "moon" | "ascendant", Record<SideHustleType, number>>>;
    modality_contributions: Partial<Record<"sun" | "moon" | "ascendant", Record<SideHustleType, number>>>;
    astrology_type_affinity: Record<SideHustleType, number>;
    astrology_modifier: Record<SideHustleType, number>;
    final_report_type_score: Record<SideHustleType, number>;
  };
}

export interface ClientReportData {
  report: {
    id: string;
    generatedAt: string;
    title: "副業適性行動報告";
    subtitle: "星座工作風格 × 生命靈數 × 行為分析";
  };
  person: {
    displayName: string;
    birthDate: string;
    birthTime?: string;
    birthPlace?: string;
  };
  overview: {
    primaryType: string;
    secondaryType: string;
    summary: string;
  };
  astrology: {
    placements: Array<AstrologyPlacement & { key: "sun" | "moon" | "ascendant"; label: string }>;
    summary: string;
    elementDistribution: Record<AstrologyElement, number>;
    modalityDistribution: Record<AstrologyModality, number>;
    dataCompleteness: AstrologyProfile["data_completeness"];
    crossAnalysis: AstrologyLayerResult["astrology_cross_analysis"];
  };
  numerology: {
    lifePath: number;
    birthdayNumber: number;
    digitDistribution: Array<{ digit: number; count: number }>;
    masterNumber?: 11 | 22 | 33;
    summary: string;
  };
  actionProfile: Array<{ key: Exclude<Dimension, "K">; label: string; score: number }>;
  sideHustleModes: Array<{ key: SideHustleType; label: string; formalTypeScore: number; typePercentile:number; displayFitIndex:number; astrologyTypeAffinity:number; astrologyModifier:number; finalReportTypeScore:number; rank: number }>;
  astrologyLayer: AstrologyLayerResult;
  typeState:"CLEAR"|"MIXED"|"EXPLORATORY";
  frictions: Array<{ key: string; label: string; score: number; guidance: string }>;
  spectrums: Array<{ key: string; left: string; right: string; score: number }>;
}

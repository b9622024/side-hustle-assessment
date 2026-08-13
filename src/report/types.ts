import type { AstrologyElement, AstrologyModality, Dimension, SideHustleType } from "../scoring/types";

export interface AstrologyPlacement {
  sign: string;
  element: AstrologyElement;
  modality: AstrologyModality;
}

export interface AstrologyProfile {
  sun: AstrologyPlacement;
  moon?: AstrologyPlacement;
  ascendant?: AstrologyPlacement;
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
  };
  numerology: {
    lifePath: number;
    birthdayNumber: number;
    digitDistribution: Array<{ digit: number; count: number }>;
    masterNumber?: 11 | 22 | 33;
    summary: string;
  };
  actionProfile: Array<{ key: Exclude<Dimension, "K">; label: string; score: number }>;
  sideHustleModes: Array<{ key: SideHustleType; label: string; formalTypeScore: number; typePercentile:number; displayFitIndex:number; rank: number }>;
  typeState:"CLEAR"|"MIXED"|"EXPLORATORY";
  frictions: Array<{ key: string; label: string; score: number; guidance: string }>;
  spectrums: Array<{ key: string; left: string; right: string; score: number }>;
}

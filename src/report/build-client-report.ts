import { config } from "../scoring/config";
import { calculateLifePath, scoreAssessment } from "../scoring/engine";
import type { AssessmentInput, Dimension, LifePathNumber, SideHustleType } from "../scoring/types";
import type { AstrologyProfile, ClientReportData } from "./types";

const ACTION_DIMENSIONS = ["A", "C", "S", "I", "R", "P"] as const;
const MASTER_NUMBERS = [11, 22, 33] as const;

const astrologyLabels = { sun: "太陽", moon: "月亮", ascendant: "上升" } as const;

const frictionGuidance: Record<string, string> = {
  START_HESITATION: "先把第一步縮小到能在 30 分鐘內完成，讓回饋取代反覆評估。",
  CONSISTENCY_PRESSURE: "用固定但輕量的週節奏累積，避免一開始就設定過重產量。",
  SYSTEM_RESISTANCE: "保留可調整空間，同時只建立一套最必要的追蹤流程。",
  STRANGER_INTERACTION_PRESSURE: "先從熟人轉介、內容暖身或小型對談建立互動安全感。",
  RESULT_ANXIETY: "把短期指標改為完成次數與有效回饋，不只看收入結果。",
};

function reduceNumber(value: number): number {
  let current = value;
  while (current > 9 && !MASTER_NUMBERS.includes(current as 11 | 22 | 33)) {
    current = String(current).split("").reduce((total, digit) => total + Number(digit), 0);
  }
  return current;
}

function birthdayNumber(birthDate: string): number {
  return reduceNumber(Number(birthDate.slice(8, 10)));
}

function digitDistribution(birthDate: string) {
  const digits = birthDate.replaceAll("-", "").split("").map(Number);
  return Array.from({ length: 9 }, (_, index) => ({
    digit: index + 1,
    count: digits.filter((digit) => digit === index + 1).length,
  }));
}

function typeLabel(type: SideHustleType): string {
  return config.type_formulas[type].label;
}

function buildOverview(primary: string, secondary: string, dimensions: Record<Dimension, number>) {
  const strongest = ACTION_DIMENSIONS.toSorted((a, b) => (dimensions[b] ?? 0) - (dimensions[a] ?? 0))[0];
  if (!strongest) throw new Error("ACTION_PROFILE_INCOMPLETE");
  return `你的主要傾向是「${primary}」，並帶有「${secondary}」的輔助特質。${config.dimensions[strongest].label}是目前較突出的行動資源，適合從能快速驗證、逐步累積成果的方式開始。`;
}

export function calculateAssessmentScoring(assessment: AssessmentInput, astrology: AstrologyProfile) {
  void astrology;
  return scoreAssessment(assessment);
}

export function buildClientReport(input: {
  reportId: string;
  assessment: AssessmentInput;
  astrology: AstrologyProfile;
  generatedAt?: string;
}): ClientReportData {
  const lifePath = calculateLifePath(input.assessment.birthDate);
  const scoring = calculateAssessmentScoring(input.assessment, input.astrology);
  const [primary, secondary] = scoring.rankedTypes;
  if (!primary || !secondary) throw new Error("TYPE_RANKING_INCOMPLETE");

  const placements = (["sun", "moon", "ascendant"] as const).flatMap((key) => {
    const placement = input.astrology[key];
    return placement ? [{ key, label: astrologyLabels[key], ...placement }] : [];
  });
  const dominantElement = placements.reduce<Record<string, number>>((counts, placement) => {
    counts[placement.element] = (counts[placement.element] ?? 0) + 1;
    return counts;
  }, {});
  const element = Object.entries(dominantElement).toSorted((a, b) => b[1] - a[1])[0]?.[0] ?? input.astrology.sun.element;
  const birthday = birthdayNumber(input.assessment.birthDate);
  const masterNumber = MASTER_NUMBERS.includes(lifePath as 11 | 22 | 33) ? lifePath as 11 | 22 | 33 : undefined;

  return {
    report: {
      id: input.reportId,
      generatedAt: input.generatedAt ?? new Date().toISOString(),
      title: "副業適性行動報告",
      subtitle: "星座工作風格 × 生命靈數 × 行為分析",
    },
    person: {
      displayName: input.assessment.displayName,
      birthDate: input.assessment.birthDate,
      ...(input.assessment.birthTime ? { birthTime: input.assessment.birthTime } : {}),
      ...(input.assessment.birthPlace ? { birthPlace: input.assessment.birthPlace } : {}),
    },
    overview: {
      primaryType: typeLabel(primary.type),
      secondaryType: typeLabel(secondary.type),
      summary: buildOverview(typeLabel(primary.type), typeLabel(secondary.type), scoring.dimensions),
    },
    astrology: {
      placements,
      summary: `你的星盤工作風格以 ${element} 元素為主要線索；這裡用來理解偏好的工作節奏，而不是替你限制選擇。`,
    },
    numerology: {
      lifePath,
      birthdayNumber: birthday,
      digitDistribution: digitDistribution(input.assessment.birthDate),
      ...(masterNumber ? { masterNumber } : {}),
      summary: `生命靈數 ${lifePath} 描繪長期動機，生日數 ${birthday} 補充你較自然的行動方式。兩者適合和實際經驗一起閱讀。`,
    },
    actionProfile: ACTION_DIMENSIONS.map((key) => ({ key, label: config.dimensions[key].label, score: scoring.dimensions[key] })),
    sideHustleModes: scoring.rankedTypes.map(({ type, score }, index) => ({ key: type, label: typeLabel(type), score, rank: index + 1 })),
    frictions: (Object.entries(scoring.frictions) as Array<[string, number]>).map(([key, score]) => ({
      key,
      label: config.frictions[key as Exclude<keyof typeof config.frictions, "normalization_helpers">].label,
      score,
      guidance: frictionGuidance[key] ?? "先觀察這項阻力最常出現的情境，再設計一個更小的替代行動。",
    })),
    spectrums: (Object.entries(scoring.spectrums) as Array<[string, number]>).map(([key, score]) => {
      const spectrum = config.execution_spectrums[key as keyof typeof config.execution_spectrums];
      return { key, left: spectrum.label_left, right: spectrum.label_right, score };
    }),
  };
}

export type { AstrologyProfile, ClientReportData, LifePathNumber };

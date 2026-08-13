import { calculateBasicAstrologyProfile } from "../../astrology/basic-profile";
import { config } from "../../scoring/config";
import type { Answers, BusinessStatus } from "../../scoring/types";
import { buildClientReport } from "../build-client-report";

export type Phase4PreviewCase = "clear" | "mixed" | "exploratory" | "sun-moon-fallback";

const cases: Record<Phase4PreviewCase, { goldenIndex: number; birthPlace: string }> = {
  clear: { goldenIndex: 0, birthPlace: "台南市" },
  mixed: { goldenIndex: 6, birthPlace: "台南市" },
  exploratory: { goldenIndex: 9, birthPlace: "台南市" },
  "sun-moon-fallback": { goldenIndex: 0, birthPlace: "無法解析的位置" },
};

export function buildPhase4Preview(caseName: Phase4PreviewCase) {
  const selected = cases[caseName];
  const golden = config.golden_cases[selected.goldenIndex]!;
  const reportId = `PHASE4-${caseName.toUpperCase()}`;
  return buildClientReport({
    reportId,
    generatedAt: "2026-08-13T00:00:00.000Z",
    assessment: {
      displayName: caseName === "sun-moon-fallback" ? "Sun Moon 降級測試" : `${golden.id} ${golden.label}`,
      birthDate: "1989-01-17",
      birthTime: "11:45",
      birthPlace: selected.birthPlace,
      businessStatus: golden.input.business_status as BusinessStatus,
      answers: golden.input.answers as Answers,
    },
    astrology: calculateBasicAstrologyProfile("1989-01-17", "11:45", selected.birthPlace),
  });
}

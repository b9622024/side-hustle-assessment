import { buildClientReport } from "../build-client-report";
import { calculateBasicAstrologyProfile } from "../../astrology/basic-profile";

export const previewReport = buildClientReport({
  reportId: "PREVIEW-SAMPLE-0001",
  generatedAt: "2026-08-12T00:00:00.000Z",
  assessment: {
    displayName: "崇銘老師",
    birthDate: "1989-01-17",
    birthTime: "11:45",
    birthPlace: "台南市",
    businessStatus: "ACTIVE",
    answers: { Q1: "C", Q2: "A", Q3: "C", Q4: "C", Q5: "C", Q6: "B", Q7: "A", Q8: "C", Q9: "A", Q10: "C" },
  },
  astrology: calculateBasicAstrologyProfile("1989-01-17", "11:45", "台南市"),
});

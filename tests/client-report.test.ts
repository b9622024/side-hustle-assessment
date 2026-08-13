import { describe, expect, it } from "vitest";
import { buildClientReport } from "../src/report/build-client-report";
import { previewReport } from "../src/report/fixtures/preview-report";
import { calculateBasicAstrologyProfile } from "../src/astrology/basic-profile";

const forbiddenKeys = ["route", "readiness", "businessFit", "riskFlags", "aiMarketingPotential", "consultationPriority", "warnings", "rawDimensions", "dimensionMax"];

describe("client report projection", () => {
  it("contains all six client-facing sections and excludes coach-only fields", () => {
    expect(previewReport.actionProfile).toHaveLength(6);
    expect(previewReport.sideHustleModes).toHaveLength(6);
    expect(previewReport.frictions).toHaveLength(5);
    expect(previewReport.spectrums).toHaveLength(4);

    const serialized = JSON.stringify(previewReport);
    for (const key of forbiddenKeys) expect(serialized).not.toContain(`\"${key}\"`);
  });

  it("supports reports without birth time, moon, or ascendant", () => {
    const report = buildClientReport({
      reportId: "TEST-OPTIONAL",
      generatedAt: "2026-08-12T00:00:00.000Z",
      assessment: {
        displayName: "測試者",
        birthDate: "1990-02-03",
        businessStatus: "NONE",
        answers: { Q1: "A", Q2: "A", Q3: "A", Q4: "A", Q5: "A", Q6: "A", Q7: "A", Q8: "A", Q9: "A", Q10: "A" },
      },
      astrology: calculateBasicAstrologyProfile("1990-02-03"),
    });
    expect(report.astrology.placements).toHaveLength(1);
    expect(report.person.birthTime).toBeUndefined();
  });
});

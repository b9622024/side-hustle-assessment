import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ClientReport } from "../src/app/_components/report/client-report";
import { RadarChart } from "../src/app/_components/report/radar-chart";
import { customerReportVisibility } from "../src/report/customer-report-visibility";
import { buildClientReport } from "../src/report/build-client-report";
import { calculateBasicAstrologyProfile } from "../src/astrology/basic-profile";

const labels = { A: "自主行動力", C: "持續經營力", S: "系統學習力", I: "表達影響力", R: "關係連結力", P: "問題解決力" } as const;

describe("customer report final simplification", () => {
  it("configures coach-only diagnostic sections as hidden", () => {
    expect(customerReportVisibility).toMatchObject({
      motivation: false,
      diagnostic_stage: false,
      bottleneck: false,
      next_step: false,
      health_business_recommendation: false,
      conversation_strategy: false,
      coach_summary: false,
      consultation_setting: false,
    });
  });

  it.each([
    ["balanced", [3.2, 3.4, 3.1, 3.3, 3.2, 3.4]],
    ["one-axis-high", [5, 1.4, 2.1, 2.6, 1.8, 2.2]],
    ["multi-axis-low", [1.1, 1.3, 1.5, 1.2, 1.4, 2]],
  ])("keeps web and export radar on the same formal values for %s", (_, scores) => {
    const profile = (Object.keys(labels) as Array<keyof typeof labels>).map((key, index) => ({ key, label: labels[key], score: scores[index]! }));
    const html = renderToStaticMarkup(<RadarChart profile={profile} />);
    const expected = profile.map((item) => `${item.key}:${item.score.toFixed(1)}`).join("|");
    expect(html.split(`data-radar-values="${expected}"`)).toHaveLength(3);
    expect(html.match(/data-radar-respondent="true"/g)).toHaveLength(2);
    expect(html.match(/fill="#2f8178"/g)).toHaveLength(2);
    expect(html.match(/stroke="#2f8178"/g)).toHaveLength(2);
    expect(html.match(/fill-opacity="0.2"/g)).toHaveLength(2);
  });

  it("shows only sections 01-06 and omits friction guidance while retaining it in data", () => {
    const report = buildClientReport({
      reportId: "TEST-CUSTOMER-SIMPLIFIED",
      generatedAt: "2026-08-15T00:00:00.000Z",
      assessment: {
        displayName: "精簡測試",
        birthDate: "1990-02-03",
        businessStatus: "NONE",
        answers: { Q1: "A", Q2: "A", Q3: "A", Q4: "A", Q5: "A", Q6: "A", Q7: "A", Q8: "A", Q9: "A", Q10: "A" },
        diagnostic: { motivationCode: "CAREER_EXIT", currentStatusV2: "RESEARCHING", bottleneckAnswers: [] },
      },
      astrology: calculateBasicAstrologyProfile("1990-02-03"),
    });
    const html = renderToStaticMarkup(<ClientReport data={report} />);
    for (const section of ["01", "02", "03", "04", "05", "06"]) expect(html).toContain(`>${section}<`);
    for (const title of ["你為什麼正在找第二條路", "你目前在哪個階段", "你現在真正卡住的地方", "你目前最適合的下一步"]) expect(html).not.toContain(title);
    expect(report.frictions.every((item) => item.guidance.length > 0)).toBe(true);
    for (const friction of report.frictions) {
      expect(html).toContain(friction.label);
      expect(html).toContain(`${friction.score.toFixed(1)} / 10`);
      expect(html).not.toContain(friction.guidance);
    }
    expect(report.diagnostic?.bottleneck_profile).toBeTruthy();
    expect(report.diagnostic?.next_step_route).toBeTruthy();
  });
});

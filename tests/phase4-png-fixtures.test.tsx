import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ClientReport } from "../src/app/_components/report/client-report";
import { buildPhase4Preview, type Phase4PreviewCase } from "../src/report/fixtures/phase4-export-previews";
import { buildClientReport } from "../src/report/build-client-report";
import { calculateBasicAstrologyProfile } from "../src/astrology/basic-profile";

describe("Phase 4 client PNG fixtures", () => {
  const expectedStates: Record<Exclude<Phase4PreviewCase, "sun-moon-fallback">, "CLEAR" | "MIXED" | "EXPLORATORY"> = {
    clear: "CLEAR",
    mixed: "MIXED",
    exploratory: "EXPLORATORY",
  };

  for (const [caseName, state] of Object.entries(expectedStates) as Array<[keyof typeof expectedStates, typeof expectedStates[keyof typeof expectedStates]]>) {
    it(`renders the complete ${caseName} report without coach-only fields`, () => {
      const report = buildPhase4Preview(caseName);
      const html = renderToStaticMarkup(<ClientReport data={report} />);
      expect(report.typeState).toBe(state);
      expect(html).toContain("適合的副業模式");
      expect(html).toContain("星座工作風格");
      expect(html).toContain("生命靈數傾向");
      expect(html).toContain("副業行動輪廓");
      expect(html).toContain("潛在摩擦風險");
      expect(html).toContain("執行偏好光譜");
      expect(html).not.toContain("Business Fit");
      expect(html).not.toContain("準備度");
      expect(html).not.toContain("諮詢優先級");
      expect(html).not.toContain("成交策略");
      expect(html).not.toContain("本次諮詢設定");
      expect(html).not.toContain("selected_offer");
      expect(html).not.toContain("coach_notes");
    });
  }

  it("renders a Sun + Moon fallback without inventing an Ascendant", () => {
    const report = buildPhase4Preview("sun-moon-fallback");
    const html = renderToStaticMarkup(<ClientReport data={report} />);
    expect(report.astrology.dataCompleteness.included_points).toEqual(["sun", "moon"]);
    expect(report.astrology.dataCompleteness.excluded_points).toEqual(["ascendant"]);
    expect(report.astrology.placements.map((point) => point.key)).toEqual(["sun", "moon"]);
    expect(html).not.toContain(">上升<");
  });

  it("includes Phase B sections 07-10 while excluding coach-only diagnostic data", () => {
    const report = buildClientReport({
      reportId: "TEST-PHASE-B-PNG", generatedAt: "2026-08-15T00:00:00.000Z",
      assessment: {
        displayName: "PNG 測試", birthDate: "1990-02-03", businessStatus: "NONE",
        answers: { Q1: "A", Q2: "A", Q3: "A", Q4: "A", Q5: "A", Q6: "A", Q7: "A", Q8: "A", Q9: "A", Q10: "A" },
        diagnostic: { motivationCode: "CAREER_EXIT", currentStatusV2: "RESEARCHING", bottleneckAnswers: [] },
      },
      astrology: calculateBasicAstrologyProfile("1990-02-03"),
    });
    const html = renderToStaticMarkup(<ClientReport data={report} />);
    expect(html).toContain("07");
    expect(html).toContain("你為什麼正在找第二條路");
    expect(html).toContain("08");
    expect(html).toContain("你目前在哪個階段");
    expect(html).toContain("09");
    expect(html).toContain("你現在真正卡住的地方");
    expect(html).toContain("10");
    expect(html).toContain("你目前最適合的下一步");
    expect(html).not.toContain("health_business_recommendation");
    expect(html).not.toContain("conversation_strategy");
    expect(html).not.toContain("Business Fit");
  });
});

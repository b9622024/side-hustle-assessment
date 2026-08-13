import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ClientReport } from "../src/app/_components/report/client-report";
import { buildPhase4Preview, type Phase4PreviewCase } from "../src/report/fixtures/phase4-export-previews";

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
});

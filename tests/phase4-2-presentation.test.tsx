import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RadarChart } from "../src/app/_components/report/radar-chart";
import { previewReport } from "../src/report/fixtures/preview-report";

describe("Phase 4.2 presentation hotfix", () => {
  it("embeds portable SVG presentation attributes for PNG rasterization", () => {
    const markup = renderToStaticMarkup(<RadarChart profile={previewReport.actionProfile} />);
    expect(markup).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(markup).toContain('fill="#2f8178"');
    expect(markup).toContain('fill-opacity="0.2"');
    expect(markup).toContain('stroke="#2f8178"');
    expect(markup).toContain('fill="#172944"');
    expect(markup).not.toContain('fill="black"');
  });

  it("keeps client mode values on the versioned display fit index", () => {
    for (const mode of previewReport.sideHustleModes) {
      expect(mode.displayFitIndex).toBeGreaterThanOrEqual(0);
      expect(mode.displayFitIndex).toBeLessThanOrEqual(10);
      expect(mode.displayFitIndex).toBe(Number((mode.typePercentile * 10).toFixed(1)));
    }
  });
});

// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ConsultationSettingForm } from "../src/app/coach/_components/consultation-setting-form";
import { initializeConsultationSetting } from "../src/consultation/settings";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("../src/app/coach/consultation-actions", () => ({ saveConsultationSetting: vi.fn() }));

describe("ConsultationSettingForm", () => {
  afterEach(() => { cleanup(); refresh.mockReset(); });

  it("keeps Route-independent analysis defaults and updates the live summary", () => {
    render(<ConsultationSettingForm reportId="SH-20260814-ABC123" initialSetting={initializeConsultationSetting("NONE")} previouslySaved={false} />);
    expect(screen.getByText("本次只做解析", { selector: ".consultation-analysis-only strong" })).toBeTruthy();
    expect(screen.getByText("舊健康事業開關").parentElement?.textContent).toContain("否");
    fireEvent.change(screen.getByLabelText("本次主要目標"), { target: { value: "CUSTOM_OFFER" } });
    expect(screen.getAllByText("主要方案")).toHaveLength(2);
    expect(screen.getByText("本次目標").parentElement?.textContent).toContain("自訂方案");
  });

  it("maintains independent primary and backup offer inputs", () => {
    render(<ConsultationSettingForm reportId="SH-20260814-ABC123" initialSetting={initializeConsultationSetting("NONE")} previouslySaved={false} />);
    fireEvent.change(screen.getByLabelText("本次主要目標"), { target: { value: "ANGEL_PLAN" } });
    fireEvent.click(screen.getByLabelText("啟用備用方案"));
    const names = screen.getAllByLabelText("服務名稱") as HTMLInputElement[];
    expect(names).toHaveLength(2);
    fireEvent.change(names[0]!, { target: { value: "Angel Plan 主要" } });
    expect(names[0]?.value).toBe("Angel Plan 主要");
    expect(names[1]?.value).toBe("三天體驗");
  });

  it("captures permission, Angel Plan candidacy and meeting feasibility separately", () => {
    render(<ConsultationSettingForm reportId="SH-20260821-E1C536" initialSetting={initializeConsultationSetting("STABLE")} previouslySaved={false} />);
    fireEvent.change(screen.getByLabelText("本次主要目標"), { target: { value: "ANGEL_PLAN" } });
    fireEvent.change(screen.getByLabelText("商業討論 permission"), { target: { value: "NOT_YET_ASKED" } });
    fireEvent.change(screen.getByLabelText("實體會面可行性"), { target: { value: "LOW" } });
    fireEvent.change(screen.getByLabelText("會面限制原因"), { target: { value: "DISTANCE" } });
    expect((screen.getByLabelText("將天使計畫列為候選解法") as HTMLInputElement).checked).toBe(true);
    expect(screen.getByText("偏好路徑").parentElement?.textContent).toContain("直接確認天使計畫");
    expect(screen.getByText("會面可行性").parentElement?.textContent).toContain("低");
    expect((screen.getByLabelText("客戶本人已明確拒絕商業方案討論") as HTMLInputElement).checked).toBe(false);
  });
});

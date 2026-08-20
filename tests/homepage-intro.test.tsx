// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import AssessmentPage from "../src/app/page";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe("assessment homepage intro", () => {
  afterEach(() => cleanup());

  it("presents the concise positioning before the unchanged assessment flow", async () => {
    render(<AssessmentPage />);
    expect(screen.getByText("可樂吉健康研究所")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "副業適性行動測驗" })).toBeTruthy();
    expect(screen.getByText(/第二收入工作風格、行動模式與適合的發展方向/)).toBeTruthy();
    expect(document.querySelector(".assessment-hero-meta")?.textContent).toContain("約 3 分鐘完成");
    expect(document.querySelector(".assessment-hero-meta")?.textContent).toContain("約 12 道情境與現況題");
    expect(screen.getByText(/實際會怎麼做/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "開始測驗" }).getAttribute("href")).toBe("#assessment-form");
    expect(await screen.findByRole("heading", { name: "先認識你" })).toBeTruthy();
    expect(screen.getByText(/實際副業適性仍以你的行為回答與目前狀態為主要依據/)).toBeTruthy();
  });
});

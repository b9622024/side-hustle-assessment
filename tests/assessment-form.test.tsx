// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AssessmentForm } from "../src/app/_components/assessment-form";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const questions = Array.from({ length: 10 }, (_, index) => ({
  id: `Q${index + 1}`,
  text: `第 ${index + 1} 題`,
  options: ["A", "B", "C", "D"].map((value) => ({ value, text: `第${index + 1}題選項${value}` })),
}));
const businessOptions = [{ value: "NONE", label: "尚未開始副業" }];

describe("AssessmentForm", () => {
  afterEach(() => cleanup());
  beforeEach(() => {
    window.localStorage.clear();
    push.mockReset();
    vi.stubGlobal("scrollTo", vi.fn());
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ reportId: "SH-20260812-A1B2C3" }) }));
  });

  it("validates required profile fields before moving forward", async () => {
    render(<AssessmentForm questions={questions} businessOptions={businessOptions} />);
    await screen.findByRole("heading", { name: "先認識你" });
    await userEvent.click(screen.getByRole("button", { name: "繼續" }));
    expect(screen.getByRole("alert").textContent).toContain("請填寫姓名或暱稱");
  });

  it("completes all steps, submits and navigates with the report ID", async () => {
    const user = userEvent.setup();
    render(<AssessmentForm questions={questions} businessOptions={businessOptions} />);
    await screen.findByRole("heading", { name: "先認識你" });
    await user.type(screen.getByLabelText("姓名或暱稱"), "小安");
    await user.type(screen.getByLabelText("出生日期"), "1989-01-17");
    await user.click(screen.getByLabelText("我不知道出生時間"));
    await user.selectOptions(screen.getByLabelText("出生縣市／地區"), "台南市");
    await user.click(screen.getByRole("button", { name: "繼續" }));
    await user.click(screen.getByLabelText("尚未開始副業"));
    await user.click(screen.getByRole("button", { name: "繼續" }));

    for (let page = 0; page < 5; page++) {
      await user.click(screen.getByRole("radio", { name: new RegExp(`第${page * 2 + 1}題選項A`) }));
      await user.click(screen.getByRole("radio", { name: new RegExp(`第${page * 2 + 2}題選項A`) }));
      await user.click(screen.getByRole("button", { name: "繼續" }));
    }

    expect(screen.getByRole("heading", { name: "你的資料已經準備好了" })).toBeTruthy();
    expect(screen.getByText("10／10 題")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "完成測驗" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/complete?id=SH-20260812-A1B2C3"));
    expect(window.localStorage.getItem("side-hustle-assessment-draft-v1")).toBeNull();
  });

  it("safely records an unknown birth time without pretending an exact time exists", async () => {
    const user = userEvent.setup();
    render(<AssessmentForm questions={questions} businessOptions={businessOptions} />);
    await screen.findByRole("heading", { name: "先認識你" });
    expect(screen.getByLabelText("出生時間")).toBeTruthy();
    await user.click(screen.getByLabelText("我不知道出生時間"));
    expect(screen.queryByLabelText("出生時間")).toBeNull();
    expect(screen.getByText(/無法精準計算上升星座/)).toBeTruthy();
    expect(screen.getByText(/安全模式產生報告/)).toBeTruthy();
  });
});

// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { JsonExportActions } from "../src/app/coach/_components/json-export-actions";

const { toPng } = vi.hoisted(() => ({ toPng: vi.fn() }));
vi.mock("html-to-image", () => ({ toPng }));

describe("JSON and client PNG export actions", () => {
  const serializedJson = JSON.stringify({ report_meta: { report_id: "SH-TEST-001" }, respondent: { display_name: "測試者" } }, null, 2);
  const writeText = vi.fn();
  const createObjectURL = vi.fn();
  const revokeObjectURL = vi.fn();
  const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    writeText.mockReset().mockResolvedValue(undefined);
    createObjectURL.mockReset().mockImplementation((blob: Blob) => { void blob; return "blob:test"; });
    revokeObjectURL.mockReset();
    click.mockClear();
    toPng.mockReset().mockResolvedValue("data:image/png;base64,AAAA");
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: revokeObjectURL });
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 1; });
  });

  afterEach(() => { cleanup(); vi.clearAllTimers(); vi.useRealTimers(); });

  it("uses the exact same serialized JSON for copy and download", async () => {
    render(<JsonExportActions reportId="SH-TEST-001" displayName="測試者" serializedJson={serializedJson} />);
    fireEvent.click(screen.getByRole("button", { name: "複製完整 JSON" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(serializedJson));
    fireEvent.click(screen.getByRole("button", { name: "下載 JSON" }));
    const blob = createObjectURL.mock.calls[0]?.[0] as Blob;
    expect(blob.type).toBe("application/json;charset=utf-8");
    expect(await blob.text()).toBe(serializedJson);
    expect(JSON.parse(await blob.text())).toEqual(JSON.parse(writeText.mock.calls[0]?.[0] as string));
  });

  it("captures only the dedicated client report root and restores export mode", async () => {
    const target = document.createElement("div");
    target.id = "client-report-export-root";
    document.body.append(target);
    render(<JsonExportActions reportId="SH-TEST-001" displayName="測試者" serializedJson={serializedJson} />);
    fireEvent.click(screen.getByRole("button", { name: "下載客戶版 PNG" }));
    await waitFor(() => expect(toPng).toHaveBeenCalledWith(target, expect.objectContaining({ pixelRatio: 2, backgroundColor: "#f5f2ea" })));
    expect(target.dataset.exportMode).toBeUndefined();
    expect(click).toHaveBeenCalled();
    target.remove();
  });

  it("shows an understandable clipboard error", async () => {
    writeText.mockRejectedValueOnce(new Error("denied"));
    render(<JsonExportActions reportId="SH-TEST-001" displayName="測試者" serializedJson={serializedJson} />);
    fireEvent.click(screen.getByRole("button", { name: "複製完整 JSON" }));
    expect((await screen.findByRole("status")).textContent).toContain("無法存取剪貼簿");
  });
});

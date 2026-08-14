// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { JsonExportActions, prepareClientReportChartsForExport } from "../src/app/coach/_components/json-export-actions";

const { toBlob } = vi.hoisted(() => ({ toBlob: vi.fn() }));
vi.mock("html-to-image", () => ({ toBlob }));

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
    toBlob.mockReset().mockResolvedValue(new Blob(["png"], { type: "image/png" }));
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: revokeObjectURL });
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 1; });
    const context = { scale: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), closePath: vi.fn(), stroke: vi.fn(), fill: vi.fn(), fillText: vi.fn() };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => context as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue("data:image/png;base64,radar");
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
    await waitFor(() => expect(toBlob).toHaveBeenCalledWith(target, expect.objectContaining({ pixelRatio: 2, backgroundColor: "#f5f2ea" })));
    expect(target.dataset.exportMode).toBeUndefined();
    expect(click).toHaveBeenCalled();
    target.remove();
  });

  it("forces portable radar colors and removes spectrum marker shadow during capture", () => {
    const target = document.createElement("div");
    target.innerHTML = '<svg class="radar"><polygon class="radar-grid"></polygon><line class="radar-axis"></line><polygon class="radar-shape" points="100,60 135,80 135,120 100,140 65,120 65,80"></polygon><text class="radar-label">A</text><text class="radar-label">C</text><text class="radar-label">S</text><text class="radar-label">I</text><text class="radar-label">R</text><text class="radar-label">P</text></svg><div class="spectrum-list"><i><b style="left: 40%"></b></i></div>';
    const restore = prepareClientReportChartsForExport(target);
    const shape = target.querySelector<SVGElement>(".radar-shape")!;
    const grid = target.querySelector<SVGElement>(".radar-grid")!;
    const marker = target.querySelector<HTMLElement>(".spectrum-list b")!;
    const radarImage = target.querySelector<HTMLImageElement>(".radar-export-image")!;
    const exportMarker = target.querySelector<HTMLElement>("[data-spectrum-export-marker]")!;
    expect(shape.style.getPropertyValue("fill")).toBe("rgb(47, 129, 120)");
    expect(shape.style.getPropertyPriority("fill")).toBe("important");
    expect(grid.style.getPropertyValue("fill")).toBe("none");
    expect(marker.style.getPropertyValue("box-shadow")).toBe("none");
    expect(marker.style.getPropertyValue("display")).toBe("none");
    expect(radarImage.src).toContain("data:image/png");
    expect(exportMarker.style.boxShadow).toBe("none");
    expect(exportMarker.style.transform).toBe("none");
    expect(target.dataset.chartExportReady).toBe("true");
    restore();
    expect(shape.getAttribute("style")).toBeNull();
    expect(marker.getAttribute("style")).toBe("left: 40%");
    expect(target.querySelector(".radar-export-image")).toBeNull();
    expect(target.querySelector("[data-spectrum-export-marker]")).toBeNull();
  });

  it("shows an understandable clipboard error", async () => {
    writeText.mockRejectedValueOnce(new Error("denied"));
    render(<JsonExportActions reportId="SH-TEST-001" displayName="測試者" serializedJson={serializedJson} />);
    fireEvent.click(screen.getByRole("button", { name: "複製完整 JSON" }));
    expect((await screen.findByRole("status")).textContent).toContain("無法存取剪貼簿");
  });
});

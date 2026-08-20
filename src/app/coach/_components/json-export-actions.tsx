"use client";

import { useEffect, useState } from "react";

type ExportState = "idle" | "copying" | "copied" | "downloading-json" | "generating-png" | "error";

function safeFilenamePart(value: string) {
  return value.trim().replace(/[\\/:*?"<>|\u0000-\u001f]/g, "-").replace(/\s+/g, " ").slice(0, 80) || "未命名";
}

function triggerDownload(href: string, filename: string) {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  link.style.display = "none";
  document.body.append(link);
  link.click();
  link.remove();
}

function isIosSafariLike() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

type NavigatorWithStandalone = Navigator & { standalone?: boolean };

export function isStandaloneDisplayMode() {
  if (typeof window === "undefined") return false;
  return Boolean(window.matchMedia?.("(display-mode: standalone)").matches || (navigator as NavigatorWithStandalone).standalone);
}

type StyledElementSnapshot = { element: HTMLElement | SVGElement; style: string | null };

function forceStyle(snapshots: StyledElementSnapshot[], element: HTMLElement | SVGElement, properties: Record<string, string>) {
  snapshots.push({ element, style: element.getAttribute("style") });
  for (const [property, value] of Object.entries(properties)) element.style.setProperty(property, value, "important");
}

function createSpectrumExportMarker(marker: HTMLElement) {
  const track = marker.parentElement;
  if (!track) return null;
  const markerRect = marker.getBoundingClientRect();
  const trackRect = track.getBoundingClientRect();
  const exportMarker = document.createElement("span");
  exportMarker.dataset.spectrumExportMarker = "true";
  exportMarker.style.cssText = `position:absolute;left:${markerRect.left + markerRect.width / 2 - trackRect.left - 5}px;top:-2.5px;width:10px;height:10px;border:0;border-radius:50%;background:#172944;box-shadow:none;filter:none;transform:none`;
  return exportMarker;
}

export function prepareClientReportChartsForExport(target: HTMLElement) {
  const snapshots: StyledElementSnapshot[] = [];
  const addedElements: HTMLElement[] = [];
  const webRadar = target.querySelector<SVGElement>("svg.radar-web");
  const exportRadar = target.querySelector<SVGElement>("svg.radar-export-safe");
  if (webRadar && exportRadar) {
    forceStyle(snapshots, webRadar, { display: "none" });
    forceStyle(snapshots, exportRadar, { display: "block", width: "100%", height: "auto", "max-height": "290px", overflow: "visible" });
  }
  for (const marker of target.querySelectorAll<HTMLElement>(".spectrum-list b")) {
    const exportMarker = createSpectrumExportMarker(marker);
    if (exportMarker) { marker.parentElement?.append(exportMarker); addedElements.push(exportMarker); }
    forceStyle(snapshots, marker, { display: exportMarker ? "none" : "block", "box-shadow": "none", filter: "none" });
  }
  target.dataset.chartExportReady = "true";
  return () => {
    delete target.dataset.chartExportReady;
    for (const element of addedElements) element.remove();
    for (const { element, style } of snapshots) style === null ? element.removeAttribute("style") : element.setAttribute("style", style);
  };
}

async function waitForExportLayout(target: HTMLElement) {
  for (let frame = 0; frame < 3; frame++) await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  target.querySelector("svg.radar-export-safe")?.getBoundingClientRect();
}

async function deliverPng(blob: Blob, filename: string, preparedWindow: Window | null, standalone: boolean) {
  const file = new File([blob], filename, { type: "image/png" });
  if (isIosSafariLike() && typeof navigator.share === "function" && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
    try {
      await navigator.share({ files: [file], title: filename });
      preparedWindow?.close();
      return "SHARED" as const;
    } catch (error) {
      console.warn("[client-png-export] Web Share failed; opening PNG fallback.", error);
    }
  }
  const url = URL.createObjectURL(blob);
  if (standalone) {
    preparedWindow?.close();
    return { method: "INLINE", previewUrl: url } as const;
  }
  if (isIosSafariLike() && preparedWindow) {
    preparedWindow.location.href = url;
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return { method: "OPENED" } as const;
  }
  preparedWindow?.close();
  triggerDownload(url, filename);
  window.setTimeout(() => URL.revokeObjectURL(url), 5_000);
  return { method: "DOWNLOADED" } as const;
}

export function JsonExportActions({ reportId, displayName, serializedJson }: { reportId: string; displayName: string; serializedJson: string }) {
  const [state, setState] = useState<ExportState>("idle");
  const [message, setMessage] = useState("");
  const [pngPreviewUrl, setPngPreviewUrl] = useState<string | null>(null);
  const busy = state === "copying" || state === "downloading-json" || state === "generating-png";
  const filenameName = safeFilenamePart(displayName);
  const filenameId = safeFilenamePart(reportId);

  useEffect(() => () => {
    if (pngPreviewUrl) URL.revokeObjectURL(pngPreviewUrl);
  }, [pngPreviewUrl]);

  function closePngPreview() {
    if (pngPreviewUrl) URL.revokeObjectURL(pngPreviewUrl);
    setPngPreviewUrl(null);
  }

  function resetLater() {
    window.setTimeout(() => { setState("idle"); setMessage(""); }, 2200);
  }

  async function copy() {
    try {
      setState("copying"); setMessage("正在複製完整 JSON…");
      await navigator.clipboard.writeText(serializedJson);
      setState("copied"); setMessage("已複製完整 JSON"); resetLater();
    } catch {
      setState("error"); setMessage("無法存取剪貼簿，請確認瀏覽器已允許剪貼簿權限後再試一次。");
    }
  }

  function downloadJson() {
    try {
      setState("downloading-json"); setMessage("正在準備 JSON…");
      const url = URL.createObjectURL(new Blob([serializedJson], { type: "application/json;charset=utf-8" }));
      triggerDownload(url, `副業適性完整資料-${filenameName}-${filenameId}.json`);
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setState("idle"); setMessage("JSON 下載已開始"); resetLater();
    } catch {
      setState("error"); setMessage("JSON 下載失敗，請重新整理後再試一次。");
    }
  }

  async function downloadClientPng() {
    const target = document.getElementById("client-report-export-root");
    if (!target) { setState("error"); setMessage("找不到客戶報告內容，請重新整理後再試一次。"); return; }
    const standalone = isStandaloneDisplayMode();
    const preparedWindow = isIosSafariLike() && !standalone ? window.open("", "_blank") : null;
    let restoreChartStyles = () => {};
    if (preparedWindow) preparedWindow.document.body.textContent = "PNG 正在產生，請稍候…";
    try {
      setState("generating-png"); setMessage("正在產生客戶版 PNG…");
      target.dataset.exportMode = "true";
      restoreChartStyles = prepareClientReportChartsForExport(target);
      if (document.fonts?.ready) await document.fonts.ready;
      await waitForExportLayout(target);
      const { toBlob } = await import("html-to-image");
      let pngBlob: Blob | null;
      try {
        pngBlob = await toBlob(target, { backgroundColor: "#f5f2ea", pixelRatio: 2, cacheBust: true, skipAutoScale: false });
      } catch (firstError) {
        console.warn("[client-png-export] High-resolution render failed; retrying at safe resolution.", firstError);
        pngBlob = await toBlob(target, { backgroundColor: "#f5f2ea", pixelRatio: 1.25, cacheBust: true, skipAutoScale: false });
      }
      if (!pngBlob) throw new Error("PNG_BLOB_EMPTY");
      const delivery = await deliverPng(pngBlob, `副業適性行動報告-${filenameName}-${filenameId}.png`, preparedWindow, standalone);
      if (delivery === "SHARED") {
        setState("idle"); setMessage("已開啟系統分享，可儲存到照片或檔案"); resetLater();
      } else if (delivery.method === "INLINE") {
        closePngPreview();
        setPngPreviewUrl(delivery.previewUrl);
        setState("idle"); setMessage("圖片已產生，可長按圖片儲存到照片或檔案");
      } else {
        setState("idle"); setMessage(delivery.method === "OPENED" ? "PNG 已在新分頁開啟，可長按或使用分享功能儲存" : "客戶版 PNG 下載已開始"); resetLater();
      }
    } catch (error) {
      preparedWindow?.close();
      console.error("[client-png-export] PNG generation or delivery failed.", error);
      setState("error"); setMessage("PNG 產生失敗，請稍後再試。");
    } finally {
      restoreChartStyles();
      delete target.dataset.exportMode;
    }
  }

  return <div className="coach-export-wrap">
    <div className="coach-export-actions">
      <button className="button primary" type="button" onClick={copy} disabled={busy}>{state === "copying" ? "正在複製…" : state === "copied" ? "已複製完整 JSON" : "複製完整 JSON"}</button>
      <button className="button secondary" type="button" onClick={downloadJson} disabled={busy}>{state === "downloading-json" ? "正在準備…" : "下載 JSON"}</button>
      <button className="button secondary" type="button" onClick={downloadClientPng} disabled={busy}>{state === "generating-png" ? "正在產生 PNG…" : "下載客戶版 PNG"}</button>
    </div>
    <p className={`coach-export-message${state === "error" ? " error" : ""}`} role="status" aria-live="polite">{message}</p>
    {pngPreviewUrl ? <div className="coach-png-preview" role="dialog" aria-modal="true" aria-label="客戶報告圖片預覽">
      <div className="coach-png-preview-card">
        <header><div><strong>客戶報告圖片已產生</strong><p>長按下方圖片，選擇「儲存到照片」或「儲存到檔案」。</p></div><button type="button" onClick={closePngPreview}>關閉</button></header>
        {/* A blob URL is required here so iOS standalone mode can save the generated file. */}
        <img src={pngPreviewUrl} alt={`副業適性行動報告－${displayName}`} />
      </div>
    </div> : null}
  </div>;
}

export { safeFilenamePart };

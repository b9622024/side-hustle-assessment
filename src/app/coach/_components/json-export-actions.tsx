"use client";

import { useState } from "react";

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

type StyledElementSnapshot = { element: HTMLElement | SVGElement; style: string | null };

function forceStyle(snapshots: StyledElementSnapshot[], element: HTMLElement | SVGElement, properties: Record<string, string>) {
  snapshots.push({ element, style: element.getAttribute("style") });
  for (const [property, value] of Object.entries(properties)) element.style.setProperty(property, value, "important");
}

function drawRadarExportImage(svg: SVGElement) {
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 400;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.scale(2, 2);
  context.lineJoin = "round";
  const center = 100;
  const point = (index: number, radius: number) => {
    const angle = -Math.PI / 2 + index * (Math.PI * 2 / 6);
    return { x: center + Math.cos(angle) * radius, y: center + Math.sin(angle) * radius };
  };
  const polygon = (radius: number) => {
    context.beginPath();
    for (let index = 0; index < 6; index++) {
      const current = point(index, radius);
      if (index === 0) context.moveTo(current.x, current.y); else context.lineTo(current.x, current.y);
    }
    context.closePath();
  };
  context.strokeStyle = "#dce3e2";
  context.lineWidth = 1;
  for (const radius of [18, 36, 54, 72]) { polygon(radius); context.stroke(); }
  context.strokeStyle = "#e4e8e7";
  for (let index = 0; index < 6; index++) {
    const outer = point(index, 72);
    context.beginPath(); context.moveTo(center, center); context.lineTo(outer.x, outer.y); context.stroke();
  }
  const dataShape = svg.querySelector<SVGPolygonElement>(".radar-shape")?.getAttribute("points")?.trim().split(/\s+/).map((pair) => {
    const coordinates = pair.split(",");
    return { x: Number(coordinates[0]), y: Number(coordinates[1]) };
  }) ?? [];
  if (dataShape.length === 6) {
    context.beginPath();
    dataShape.forEach((current, index) => { if (index === 0) context.moveTo(current.x, current.y); else context.lineTo(current.x, current.y); });
    context.closePath(); context.fillStyle = "rgba(47,129,120,.2)"; context.fill(); context.strokeStyle = "#2f8178"; context.lineWidth = 2; context.stroke();
  }
  context.fillStyle = "#172944";
  context.font = "700 11px Georgia, serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  const labels = Array.from(svg.querySelectorAll<SVGTextElement>(".radar-label")).map((label) => label.textContent ?? "");
  labels.forEach((label, index) => { const position = point(index, 88); context.fillText(label, position.x, position.y); });
  const image = document.createElement("img");
  image.className = "radar-export-image";
  image.alt = "六項副業行動能力雷達圖";
  image.width = 400;
  image.height = 400;
  image.src = canvas.toDataURL("image/png");
  image.style.cssText = "display:block;width:100%;height:auto;max-height:290px;object-fit:contain";
  return image;
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
  const radar = target.querySelector<SVGElement>("svg.radar");
  if (radar) {
    forceStyle(snapshots, radar, { overflow: "visible", background: "transparent", color: "#172944" });
    for (const element of radar.querySelectorAll<SVGElement>(".radar-grid")) forceStyle(snapshots, element, { fill: "none", stroke: "#dce3e2", "stroke-width": "1px" });
    for (const element of radar.querySelectorAll<SVGElement>(".radar-axis")) forceStyle(snapshots, element, { fill: "none", stroke: "#e4e8e7", "stroke-width": "1px" });
    for (const element of radar.querySelectorAll<SVGElement>(".radar-shape")) forceStyle(snapshots, element, { fill: "#2f8178", "fill-opacity": "0.2", stroke: "#2f8178", "stroke-width": "2px" });
    for (const element of radar.querySelectorAll<SVGElement>(".radar-label")) forceStyle(snapshots, element, { fill: "#172944", stroke: "none", color: "#172944" });
    const exportImage = drawRadarExportImage(radar);
    if (exportImage) {
      radar.insertAdjacentElement("afterend", exportImage);
      addedElements.push(exportImage);
      forceStyle(snapshots, radar, { display: "none" });
    }
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
  await Promise.all(Array.from(target.querySelectorAll<HTMLImageElement>(".radar-export-image")).map(async (image) => {
    if (typeof image.decode === "function") await image.decode().catch(() => undefined);
  }));
  for (let frame = 0; frame < 3; frame++) await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  target.querySelector("svg.radar")?.getBoundingClientRect();
}

async function deliverPng(blob: Blob, filename: string, preparedWindow: Window | null) {
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
  if (isIosSafariLike() && preparedWindow) {
    preparedWindow.location.href = url;
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return "OPENED" as const;
  }
  preparedWindow?.close();
  triggerDownload(url, filename);
  window.setTimeout(() => URL.revokeObjectURL(url), 5_000);
  return "DOWNLOADED" as const;
}

export function JsonExportActions({ reportId, displayName, serializedJson }: { reportId: string; displayName: string; serializedJson: string }) {
  const [state, setState] = useState<ExportState>("idle");
  const [message, setMessage] = useState("");
  const busy = state === "copying" || state === "downloading-json" || state === "generating-png";
  const filenameName = safeFilenamePart(displayName);
  const filenameId = safeFilenamePart(reportId);

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
    const preparedWindow = isIosSafariLike() ? window.open("", "_blank") : null;
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
      const delivery = await deliverPng(pngBlob, `副業適性行動報告-${filenameName}-${filenameId}.png`, preparedWindow);
      setState("idle"); setMessage(delivery === "SHARED" ? "已開啟系統分享，可儲存到照片或檔案" : delivery === "OPENED" ? "PNG 已在新分頁開啟，可長按或使用分享功能儲存" : "客戶版 PNG 下載已開始"); resetLater();
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
  </div>;
}

export { safeFilenamePart };

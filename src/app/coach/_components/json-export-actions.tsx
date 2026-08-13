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
    try {
      setState("generating-png"); setMessage("正在產生客戶版 PNG…");
      target.dataset.exportMode = "true";
      if (document.fonts?.ready) await document.fonts.ready;
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      const { toPng } = await import("html-to-image");
      let dataUrl: string;
      try {
        dataUrl = await toPng(target, { backgroundColor: "#f5f2ea", pixelRatio: 2, cacheBust: true, skipAutoScale: false });
      } catch {
        dataUrl = await toPng(target, { backgroundColor: "#f5f2ea", pixelRatio: 1.5, cacheBust: true, skipAutoScale: false });
      }
      triggerDownload(dataUrl, `副業適性行動報告-${filenameName}-${filenameId}.png`);
      setState("idle"); setMessage("客戶版 PNG 下載已開始"); resetLater();
    } catch {
      setState("error"); setMessage("PNG 產生失敗，可能是圖片或瀏覽器記憶體限制，請關閉其他分頁後再試一次。");
    } finally {
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

"use client";

import { useState } from "react";

export function CompletionCard({ reportId, valid }: { reportId: string; valid: boolean }) {
  const [copied, setCopied] = useState(false);
  async function copyId() {
    if (!valid) return;
    try {
      await navigator.clipboard.writeText(reportId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch { setCopied(false); }
  }
  return <section className="completion-card"><div className="completion-icon" aria-hidden="true">✓</div><p className="eyebrow">副業適性分析已完成</p><h1>{valid ? "你的行動輪廓已整理完成" : "找不到有效的測驗編號"}</h1><p className="completion-copy">{valid ? "系統已完成你的副業類型、行動輪廓、工作偏好與潛在卡點交叉分析。" : "請回到測驗頁重新完成作答。"}</p>
    {valid && <><div className="report-id"><span>測驗編號</span><strong>{reportId}</strong></div><button className="button primary wide" type="button" onClick={copyId}>{copied ? "已複製測驗編號" : "複製測驗編號"}</button><div className="next-step-box"><strong>下一步</strong><p>傳送測驗編號給崇銘老師，領取你的完整分析。LINE 與 Messenger 將在正式測試階段串接。</p></div></>}
    <a className="text-link" href="/">{valid ? "重新進行測驗" : "返回測驗首頁"}</a>
  </section>;
}

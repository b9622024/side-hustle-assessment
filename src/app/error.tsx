"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="completion-shell"><section className="completion-card"><p className="eyebrow">系統暫時無法顯示</p><h1>資料仍然保存在這台裝置</h1><p className="completion-copy">請稍後再試，或返回測驗頁繼續完成。</p><button className="button primary wide" type="button" onClick={reset}>再試一次</button><a className="text-link" href="/">返回測驗</a></section></main>;
}

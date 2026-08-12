"use client";

export default function CoachError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="coach-main"><section className="coach-empty"><strong>後台資料暫時無法讀取</strong><p>請稍後再試；客戶已送出的資料不會因此遺失。</p><button className="button primary" type="button" onClick={reset}>重新載入</button></section></main>;
}

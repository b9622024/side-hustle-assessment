import { config } from "../../../scoring/config";
import { COACH_PAGE_SIZE, listCoachAssessments } from "../../../lib/coach/data";

function positivePage(value: string | undefined) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function pageHref(page: number, query: string) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  return `/coach${params.size ? `?${params}` : ""}`;
}

export default async function CoachDashboard({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  const params = await searchParams;
  const requestedPage = positivePage(params.page);
  const query = params.q ?? "";
  const firstResult = await listCoachAssessments(requestedPage, query);
  const totalPages = Math.max(1, Math.ceil(firstResult.total / COACH_PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const result = page === requestedPage ? firstResult : await listCoachAssessments(page, query);

  return <main className="coach-main">
    <section className="coach-title-row"><div><p className="eyebrow">Assessment Records</p><h1>測驗名單</h1><p>搜尋、檢視完整評分與客戶版報告。</p></div><div className="coach-total"><span>累積總報告數</span><strong>{result.total}</strong></div></section>
    <form className="coach-search" action="/coach" method="get"><label><span className="sr-only">搜尋姓名或報告編號</span><input type="search" name="q" defaultValue={result.search} placeholder="輸入姓名或 SH 報告編號" /></label><button className="button primary" type="submit">搜尋</button>{result.search ? <a className="button secondary" href="/coach">清除</a> : null}</form>
    <section className="coach-table-card">
      {result.rows.length ? <div className="coach-table-wrap"><table className="coach-table"><thead><tr><th>完成時間</th><th>姓名</th><th>報告編號</th><th>副業現況</th><th>主要類型</th><th>路由</th><th>優先級</th><th><span className="sr-only">操作</span></th></tr></thead><tbody>
        {result.rows.map((row) => <tr key={row.id}><td>{new Intl.DateTimeFormat("zh-TW", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Taipei" }).format(new Date(row.created_at))}</td><td><strong>{row.display_name}</strong></td><td><code>{row.report_id}</code></td><td>{config.business_status_options[row.business_status]}</td><td>{config.type_formulas[row.scoring_snapshot.rankedTypes[0]?.type ?? "SYSTEM_OPERATOR"].label}</td><td><span className={`coach-badge route-${row.scoring_snapshot.route}`}>{row.scoring_snapshot.route}</span></td><td><span className={`coach-priority ${row.scoring_snapshot.consultationPriority.toLowerCase()}`}>{row.scoring_snapshot.consultationPriority}</span></td><td><a className="coach-view" href={`/coach/reports/${row.report_id}`}>查看</a></td></tr>)}
      </tbody></table></div> : <div className="coach-empty"><strong>{result.search ? "找不到符合的名單" : "目前還沒有正式測驗資料"}</strong><p>{result.search ? "請確認姓名或報告編號是否正確。" : "有人完成測驗後，資料會自動出現在這裡。"}</p></div>}
    </section>
    <nav className="coach-pagination" aria-label="名單分頁"><a aria-disabled={page <= 1} href={page > 1 ? pageHref(page - 1, result.search) : undefined}>上一頁</a><span>第 {page} / {totalPages} 頁 · 每頁 {COACH_PAGE_SIZE} 筆</span><a aria-disabled={page >= totalPages} href={page < totalPages ? pageHref(page + 1, result.search) : undefined}>下一頁</a></nav>
  </main>;
}

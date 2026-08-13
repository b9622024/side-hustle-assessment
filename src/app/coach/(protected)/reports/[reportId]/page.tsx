import { ClientReport } from "../../../../_components/report/client-report";
import { config } from "../../../../../scoring/config";
import type { QuestionId } from "../../../../../scoring/types";
import { getCoachAssessment } from "../../../../../lib/coach/data";
import { buildCoachJsonExport } from "../../../../../report/build-coach-export";
import { JsonExportActions } from "../../../_components/json-export-actions";
import { ConsultationSettingsForm } from "../../../_components/consultation-settings-form";

const priorityLabels = { HIGH: "高", MEDIUM: "中", LOW: "低" } as const;
const aiLabels = { HIGH: "高", MEDIUM: "中", LOW: "低" } as const;

function levelLabel(group: ReadonlyArray<{ key: string; label: string }>, key: string) {
  return group.find((item) => item.key === key)?.label ?? key;
}

export default async function CoachReportPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  const record = await getCoachAssessment(reportId);
  const scoring = record.scoring_snapshot;
  const clientReport = record.client_reports[0]?.report_data;
  const astrology = record.astrology_profile;
  const jsonExport = buildCoachJsonExport(record);

  return <main className="coach-main coach-report-main">
    <a className="coach-back" href="/coach">← 返回測驗名單</a>
    <section className="coach-report-hero"><div><p className="eyebrow">Coach-only Analysis</p><h1>{record.display_name} 的完整分析</h1><p><code>{record.report_id}</code> · {new Intl.DateTimeFormat("zh-TW", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Taipei" }).format(new Date(record.created_at))}</p><JsonExportActions reportId={record.report_id} displayName={record.display_name} data={jsonExport} /></div><div className="coach-report-person"><span>出生資料</span><strong>{record.birth_date}{record.birth_time ? ` ${record.birth_time.slice(0, 5)}` : ""}</strong><small>{record.birth_place}</small></div></section>

    <section className="coach-metric-grid">
      <article><span>ABCD 路由</span><strong>{scoring.route}</strong><small>教練後續對話路徑</small></article>
      <article><span>準備度</span><strong>{scoring.readiness.score.toFixed(1)}</strong><small>{levelLabel(config.readiness.levels, scoring.readiness.level)}</small></article>
      <article><span>Business Fit</span><strong>{scoring.businessFit.score.toFixed(1)}</strong><small>{levelLabel(config.business_fit.levels, scoring.businessFit.level)}</small></article>
      <article><span>諮詢優先級</span><strong>{priorityLabels[scoring.consultationPriority]}</strong><small>{scoring.consultationPriority}</small></article>
      <article><span>陌生互動</span><strong>{scoring.strangerInteraction.score.toFixed(1)}</strong><small>{scoring.strangerInteraction.label}</small></article>
      <article><span>AI 行銷潛力</span><strong>{aiLabels[scoring.aiMarketingPotential]}</strong><small>{scoring.aiMarketingPotential}</small></article>
    </section>

    <div className="coach-detail-grid">
      <section className="coach-detail-card"><h2>風險旗標</h2>{scoring.riskFlags.length ? <div className="coach-risk-list">{scoring.riskFlags.map((flag) => <div key={flag.id}><span className={`coach-priority ${flag.severity.toLowerCase()}`}>{flag.severity}</span><strong>{flag.id} · {flag.label}</strong></div>)}</div> : <p className="coach-muted">本次沒有觸發風險旗標。</p>}</section>
      <section className="coach-detail-card"><h2>類型排序</h2><div className="coach-ranking">{scoring.rankedTypes.map((item, index) => <div key={item.type}><span>{index + 1}</span><strong>{config.type_formulas[item.type].label}</strong><i><b style={{ width: `${item.score / 5 * 100}%` }} /></i><em>{item.score.toFixed(1)}</em></div>)}</div></section>
      <section className="coach-detail-card full"><h2>10 題原始作答</h2><div className="coach-answer-grid">{config.questionnaire.map((question) => { const id = question.id as QuestionId; const answer = record.answers[id]; return <article key={id}><span>{id}</span><div><strong>{question.text}</strong><p>{answer} · {question.options[answer].text}</p></div></article>; })}</div></section>
      <section className="coach-detail-card"><h2>星座計算資料</h2><dl className="coach-data-list"><div><dt>太陽</dt><dd>{astrology.sun.sign}</dd></div><div><dt>月亮</dt><dd>{astrology.moon?.sign??"資料不足"}</dd></div><div><dt>上升</dt><dd>{astrology.ascendant?.sign??"資料不足"}</dd></div><div><dt>完整度</dt><dd>{[astrology.sun,astrology.moon,astrology.ascendant].filter(Boolean).length}/3</dd></div></dl>{scoring.astrologyReport?.astrology_rank_adjustment&&<p className="coach-muted">Astrology 修正後前二排序有變；正式主型仍保留 {config.type_formulas[scoring.astrologyReport.formal_primary_type].label}。</p>}</section>
      <section className="coach-detail-card"><h2>系統資訊</h2><dl className="coach-data-list"><div><dt>副業現況</dt><dd>{config.business_status_options[record.business_status]}</dd></div><div><dt>類型狀態</dt><dd>{scoring.typeState}</dd></div><div><dt>評分版本</dt><dd>{record.scoring_version}</dd></div></dl></section>
      <ConsultationSettingsForm reportId={record.report_id} saved={record.consultation_settings??null}/>
    </div>

    {clientReport ? <section className="coach-client-report"><header><p className="eyebrow">Client-facing Version</p><h2>客戶版完整報告預覽</h2><p>以下內容不包含上述教練專用評分。</p></header><ClientReport data={clientReport} /></section> : <section className="coach-detail-card"><h2>客戶報告不存在</h2><p className="coach-muted">請檢查資料保存流程。</p></section>}
  </main>;
}

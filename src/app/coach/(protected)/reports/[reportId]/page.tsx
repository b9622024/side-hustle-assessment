import { ClientReport } from "../../../../_components/report/client-report";
import { config } from "../../../../../scoring/config";
import type { QuestionId } from "../../../../../scoring/types";
import { getCoachAssessment } from "../../../../../lib/coach/data";
import { serializeFullAssessmentJson } from "../../../../../report/build-coach-export";
import { JsonExportActions } from "../../../_components/json-export-actions";
import { ConsultationSettingForm } from "../../../_components/consultation-setting-form";
import { initializeConsultationSetting } from "../../../../../consultation/settings";
import { bottleneckLabels, buildDiagnosticInterpretation, diagnosticStageLabels, healthBusinessLabels, nextStepLabels } from "../../../../../diagnostic/interpretation";

const priorityLabels = { HIGH: "高", MEDIUM: "中", LOW: "低" } as const;
const aiLabels = { HIGH: "高", MEDIUM: "中", LOW: "低" } as const;

function levelLabel(group: ReadonlyArray<{ key: string; label: string }>, key: string) {
  return group.find((item) => item.key === key)?.label ?? key;
}

function astrologySign(point: unknown) {
  if (!point || typeof point !== "object") return "未納入";
  const placement = point as { sign?: unknown; sign_name?: unknown };
  return typeof placement.sign_name === "string" ? placement.sign_name : typeof placement.sign === "string" ? placement.sign : "未納入";
}

export default async function CoachReportPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  const record = await getCoachAssessment(reportId);
  const scoring = record.scoring_snapshot;
  const clientReport = record.client_reports[0]?.report_data;
  const diagnostic = buildDiagnosticInterpretation(record.diagnostic_profile, scoring, record.business_status);
  const clientReportForDisplay = clientReport ? { ...clientReport, diagnostic: clientReport.diagnostic ?? diagnostic } : null;
  const astrology = record.astrology_profile;
  const serializedJson = serializeFullAssessmentJson(record);

  return <main className="coach-main coach-report-main">
    <a className="coach-back" href="/coach">← 返回測驗名單</a>
    <section className="coach-report-hero"><div><p className="eyebrow">Coach-only Analysis</p><h1>{record.display_name} 的完整分析</h1><p><code>{record.report_id}</code> · {new Intl.DateTimeFormat("zh-TW", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Taipei" }).format(new Date(record.created_at))}</p></div><div className="coach-report-person"><span>出生資料</span><strong>{record.birth_date}{record.birth_time ? ` ${record.birth_time.slice(0, 5)}` : ""}</strong><small>{record.birth_place}</small></div></section>

    <section className="coach-metric-grid">
      <article><span>ABCD 路由</span><strong>{scoring.route}</strong><small>教練後續對話路徑</small></article>
      <article><span>準備度</span><strong>{scoring.readiness.score.toFixed(1)}</strong><small>{levelLabel(config.readiness.levels, scoring.readiness.level)}</small></article>
      <article><span>Business Fit</span><strong>{scoring.businessFit.score.toFixed(1)}</strong><small>{levelLabel(config.business_fit.levels, scoring.businessFit.level)}</small></article>
      <article><span>諮詢優先級</span><strong>{priorityLabels[scoring.consultationPriority]}</strong><small>{scoring.consultationPriority}</small></article>
      <article><span>陌生互動</span><strong>{scoring.strangerInteraction.score.toFixed(1)}</strong><small>{scoring.strangerInteraction.label}</small></article>
      <article><span>AI 行銷潛力</span><strong>{aiLabels[scoring.aiMarketingPotential]}</strong><small>{scoring.aiMarketingPotential}</small></article>
    </section>

    {diagnostic ? <section className="coach-detail-card coach-diagnostic-summary">
      <div className="coach-diagnostic-heading"><div><p className="eyebrow">V2.2 Diagnostic Layer</p><h2>第二條路診斷摘要</h2></div><span>{diagnosticStageLabels[diagnostic.diagnostic_stage]}</span></div>
      <dl className="coach-diagnostic-grid">
        <div><dt>核心動機</dt><dd>{diagnostic.coach_summary.motivation}</dd></div>
        <div><dt>既有副業／事業狀態</dt><dd>{config.business_status_options[record.business_status]}</dd></div>
        <div><dt>本次新路徑行動階段</dt><dd>{record.diagnostic_profile?.current_status.label ?? diagnostic.coach_summary.action_stage}</dd></div>
        <div><dt>綜合診斷階段</dt><dd>{diagnosticStageLabels[diagnostic.coach_summary.diagnostic_stage]}</dd></div>
        {diagnostic.legacy_current_status ? <div><dt>舊版 Q12</dt><dd>{diagnostic.legacy_current_status.label}（Legacy）</dd></div> : null}
        <div><dt>主型</dt><dd>{config.type_formulas[diagnostic.coach_summary.formal_primary_type].label}</dd></div>
        <div><dt>副型</dt><dd>{config.type_formulas[diagnostic.coach_summary.formal_secondary_type].label}</dd></div>
        <div><dt>主要卡點</dt><dd>{bottleneckLabels[diagnostic.coach_summary.primary_bottleneck]}</dd></div>
        <div><dt>次要卡點</dt><dd>{diagnostic.coach_summary.secondary_bottleneck ? bottleneckLabels[diagnostic.coach_summary.secondary_bottleneck] : "無"}</dd></div>
        <div><dt>Readiness</dt><dd>{diagnostic.coach_summary.readiness.toFixed(1)}</dd></div>
        <div><dt>Business Fit</dt><dd>{diagnostic.coach_summary.business_fit.toFixed(1)}</dd></div>
        <div><dt>Next Step</dt><dd>{nextStepLabels[diagnostic.coach_summary.next_step_route]}</dd></div>
        <div><dt>健康事業建議</dt><dd>{healthBusinessLabels[diagnostic.coach_summary.health_business_recommendation]}</dd></div>
      </dl>
      <div className="coach-conversation-strategy"><h3>教練對話策略</h3><dl><div><dt>開場焦點</dt><dd>{diagnostic.conversation_strategy.opening_focus}</dd></div><div><dt>診斷焦點</dt><dd>{diagnostic.conversation_strategy.diagnostic_focus}</dd></div><div><dt>避免</dt><dd>{diagnostic.conversation_strategy.avoid}</dd></div><div><dt>可能轉場</dt><dd>{diagnostic.conversation_strategy.possible_transition}</dd></div></dl></div>
    </section> : <section className="coach-detail-card"><h2>第二條路診斷摘要</h2><p className="coach-muted">診斷資料不足。舊報告不會推測動機或目前階段。</p></section>}

    <div className="coach-detail-grid">
      <section className="coach-detail-card"><h2>風險旗標</h2>{scoring.riskFlags.length ? <div className="coach-risk-list">{scoring.riskFlags.map((flag) => <div key={flag.id}><span className={`coach-priority ${flag.severity.toLowerCase()}`}>{flag.severity}</span><strong>{flag.id} · {flag.label}</strong></div>)}</div> : <p className="coach-muted">本次沒有觸發風險旗標。</p>}</section>
      <section className="coach-detail-card"><h2>類型排序</h2><div className="coach-ranking">{scoring.rankedTypes.map((item, index) => { const displayFitIndex = scoring.typeDisplayScores?.[item.type]?.display_fit_index; const shownScore = displayFitIndex ?? item.score; const width = displayFitIndex === undefined ? item.score / 5 * 100 : displayFitIndex * 10; return <div key={item.type}><span>{index + 1}</span><strong>{config.type_formulas[item.type].label}</strong><i><b style={{ width: `${width}%` }} /></i><em>{shownScore.toFixed(1)}</em></div>; })}</div><p className="coach-muted">V2.1 畫面顯示 0–10 適配指數；正式排序仍依 formal_type_final。舊版報告缺適配指數時保留原始正式分數。</p></section>
      <section className="coach-detail-card full"><h2>10 題原始作答</h2><div className="coach-answer-grid">{config.questionnaire.map((question) => { const id = question.id as QuestionId; const answer = record.answers[id]; return <article key={id}><span>{id}</span><div><strong>{question.text}</strong><p>{answer} · {question.options[answer].text}</p></div></article>; })}</div></section>
      <section className="coach-detail-card"><h2>星座計算資料</h2><dl className="coach-data-list"><div><dt>太陽</dt><dd>{astrologySign(astrology.sun)}</dd></div><div><dt>月亮</dt><dd>{astrologySign(astrology.moon)}</dd></div><div><dt>上升</dt><dd>{astrologySign(astrology.ascendant)}</dd></div></dl><p className="coach-muted">月亮或上升無法可靠計算時，會排除該點位並重新正規化剩餘權重。</p></section>
      <section className="coach-detail-card"><h2>系統資訊</h2><dl className="coach-data-list"><div><dt>副業現況</dt><dd>{config.business_status_options[record.business_status]}</dd></div><div><dt>類型狀態</dt><dd>{scoring.typeState}</dd></div><div><dt>評分版本</dt><dd>{record.scoring_version}</dd></div></dl></section>
    </div>

    <ConsultationSettingForm reportId={record.report_id} initialSetting={record.consultation_setting ?? initializeConsultationSetting(record.business_status)} previouslySaved={Boolean(record.consultation_setting)} />

    <section className="coach-export-card"><div><p className="eyebrow">Export</p><h2>完整資料與客戶報告</h2><p>複製與下載使用同一份目前 assessment state。</p></div><JsonExportActions reportId={record.report_id} displayName={record.display_name} serializedJson={serializedJson} /></section>

    {clientReportForDisplay ? <section className="coach-client-report"><header><p className="eyebrow">Client-facing Version</p><h2>客戶版完整報告預覽</h2><p>以下內容不包含上述教練專用評分。</p></header><div id="client-report-export-root" className="client-report-export-root"><ClientReport data={clientReportForDisplay} /></div></section> : <section className="coach-detail-card"><h2>客戶報告不存在</h2><p className="coach-muted">請檢查資料保存流程。</p></section>}
  </main>;
}

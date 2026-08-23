"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CLIENT_STAGES, CLIENT_STAGE_LABELS, CONSULTATION_MODES, CONSULTATION_MODE_LABELS, PRIMARY_GOALS, PRIMARY_GOAL_LABELS,
  PREFERRED_CONVERSION_PATHS, PREFERRED_CONVERSION_PATH_LABELS, MEETING_FEASIBILITIES, MEETING_FEASIBILITY_LABELS,
  MEETING_FEASIBILITY_REASONS, MEETING_FEASIBILITY_REASON_LABELS, COMMERCIAL_PERMISSION_SOURCES, COMMERCIAL_PERMISSION_SOURCE_LABELS,
  formatPrice, offerForGoal, type ConsultationOffer, type ConsultationSetting, type PrimaryGoal,
} from "../../../consultation/settings";
import { saveConsultationSetting } from "../consultation-actions";

const journeyFields = [
  ["previous_assessment", "做過本次副業適性測驗"], ["previous_consultation", "曾經諮詢"], ["previous_offer_presented", "曾介紹過方案"],
  ["previous_purchase", "曾經購買"], ["health_business_previously_discussed", "曾討論健康事業"], ["existing_business", "目前已有副業／事業"],
] as const;

function cloneOffer(offer: ConsultationOffer): ConsultationOffer { return structuredClone(offer); }

function OfferEditor({ title, offer, onChange, onTemplateChange }: { title: string; offer: ConsultationOffer; onChange: (offer: ConsultationOffer) => void; onTemplateChange?: (goal: Exclude<PrimaryGoal, "ANALYSIS_ONLY">) => void }) {
  const set = <K extends keyof ConsultationOffer>(key: K, value: ConsultationOffer[K]) => onChange({ ...offer, [key]: value });
  return <fieldset className="consultation-offer-editor">
    <legend>{title}</legend>
    {onTemplateChange ? <label className="consultation-field"><span>方案模板</span><select value={offer.offer_type === "CUSTOM" ? "CUSTOM_OFFER" : offer.offer_type} onChange={(event) => onTemplateChange(event.target.value as Exclude<PrimaryGoal, "ANALYSIS_ONLY">)}>{PRIMARY_GOALS.filter((goal) => goal !== "ANALYSIS_ONLY").map((goal) => <option key={goal} value={goal}>{PRIMARY_GOAL_LABELS[goal]}</option>)}</select></label> : null}
    <div className="consultation-form-grid">
      <label className="consultation-field"><span>服務名稱</span><input value={offer.offer_name} onChange={(event) => set("offer_name", event.target.value)} /></label>
      <label className="consultation-field"><span>服務期間</span><input value={offer.duration} onChange={(event) => set("duration", event.target.value)} placeholder="例如：4週" /></label>
      <label className="consultation-field full"><span>服務說明</span><textarea value={offer.description} onChange={(event) => set("description", event.target.value)} rows={3} /></label>
      <label className="consultation-field"><span>幣別</span><input value={offer.price.currency} onChange={(event) => { const currency = event.target.value.toUpperCase(); set("price", { ...offer.price, currency, display: formatPrice(currency, offer.price.amount) }); }} /></label>
      <label className="consultation-field"><span>價格金額</span><input type="number" min="0" value={offer.price.amount ?? ""} onChange={(event) => { const amount = event.target.value === "" ? null : Number(event.target.value); set("price", { ...offer.price, amount, display: formatPrice(offer.price.currency, amount) }); }} /></label>
      <label className="consultation-field full"><span>價格顯示</span><input value={offer.price.display} onChange={(event) => set("price", { ...offer.price, display: event.target.value })} placeholder="例如：新台幣1,499元" /></label>
      <label className="consultation-field full"><span>CTA</span><textarea value={offer.cta} onChange={(event) => set("cta", event.target.value)} rows={2} /></label>
      <label className="consultation-field full"><span>補充說明</span><textarea value={offer.notes} onChange={(event) => set("notes", event.target.value)} rows={2} /></label>
    </div>
  </fieldset>;
}

export function ConsultationSettingForm({ reportId, initialSetting, previouslySaved }: { reportId: string; initialSetting: ConsultationSetting; previouslySaved: boolean }) {
  const router = useRouter();
  const [setting, setSetting] = useState(() => structuredClone(initialSetting));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(previouslySaved ? "已載入先前儲存的設定。" : "尚未儲存，以下為初始化建議值。");

  const context = setting.consultation_context;
  const commercial = setting.commercial_context;
  const updateContext = (patch: Partial<typeof context>) => setSetting((current) => ({ ...current, consultation_context: { ...current.consultation_context, ...patch } }));
  const updateCommercial = (patch: Partial<typeof commercial>) => setSetting((current) => ({ ...current, commercial_context: { ...current.commercial_context, ...patch } }));
  const changePrimaryGoal = (goal: PrimaryGoal) => setSetting((current) => ({
    ...current,
    consultation_context: { ...current.consultation_context, primary_goal: goal },
    commercial_context: goal === "ANGEL_PLAN" ? { ...current.commercial_context, angel_plan_candidate: true, preferred_conversion_path: "DIRECT_ANGEL_PLAN" } : current.commercial_context,
    selected_offer: goal === "ANALYSIS_ONLY" ? null : offerForGoal(goal),
  }));
  const setSelectedOffer = (offer: ConsultationOffer) => setSetting((current) => ({ ...current, selected_offer: cloneOffer(offer) }));
  const setBackupOffer = (offer: ConsultationOffer | null) => setSetting((current) => ({ ...current, backup_offer: offer ? cloneOffer(offer) : null }));

  async function save() {
    setSaving(true); setMessage("正在儲存本次諮詢設定…");
    const result = await saveConsultationSetting(reportId, setting);
    if (!result.ok) { setSaving(false); setMessage(result.error); return; }
    setSetting(structuredClone(result.setting)); setSaving(false); setMessage("已儲存本次諮詢設定"); router.refresh();
  }

  return <section className="coach-consultation-card" aria-labelledby="consultation-setting-title">
    <header><div><p className="eyebrow">Coach-only Setting</p><h2 id="consultation-setting-title">本次諮詢設定</h2><p>系統路由提供判讀，本區設定本次實際談話目的，兩者不會互相覆蓋。</p></div><span className="coach-only-badge">僅教練端</span></header>
    <div className="consultation-form-grid">
      <label className="consultation-field"><span>客戶目前階段</span><select value={context.client_stage} onChange={(event) => updateContext({ client_stage: event.target.value as typeof context.client_stage })}>{CLIENT_STAGES.map((value) => <option value={value} key={value}>{CLIENT_STAGE_LABELS[value]}</option>)}</select></label>
      <label className="consultation-field"><span>本次諮詢模式</span><select value={context.consultation_mode} onChange={(event) => updateContext({ consultation_mode: event.target.value as typeof context.consultation_mode })}>{CONSULTATION_MODES.map((value) => <option value={value} key={value}>{CONSULTATION_MODE_LABELS[value]}</option>)}</select></label>
      <label className="consultation-field full"><span>本次主要目標</span><select value={context.primary_goal} onChange={(event) => changePrimaryGoal(event.target.value as PrimaryGoal)}>{PRIMARY_GOALS.map((value) => <option value={value} key={value}>{PRIMARY_GOAL_LABELS[value]}</option>)}</select></label>
    </div>

    <label className="consultation-health-toggle"><input type="checkbox" checked={context.allow_health_business_discussion} onChange={(event) => updateContext({ allow_health_business_discussion: event.target.checked })} /><span><strong>適合時，可詢問客戶是否有興趣了解健康事業</strong><small>預設關閉，不受 Route A 自動影響。</small></span></label>

    <fieldset className="consultation-offer-editor"><legend>Commercial Context</legend>
      <div className="consultation-form-grid">
        <label className="consultation-field"><span>商業討論 permission</span><select value={commercial.commercial_permission_source} onChange={(event) => {
          const commercial_permission_source = event.target.value as typeof commercial.commercial_permission_source;
          updateCommercial({ commercial_permission_source, client_explicit_rejection: commercial_permission_source === "EXPLICIT_CLIENT_NO" });
        }}>{COMMERCIAL_PERMISSION_SOURCES.map((value) => <option key={value} value={value}>{COMMERCIAL_PERMISSION_SOURCE_LABELS[value]}</option>)}</select></label>
        <label className="consultation-field"><span>偏好轉換路徑</span><select value={commercial.preferred_conversion_path} onChange={(event) => updateCommercial({ preferred_conversion_path: event.target.value as typeof commercial.preferred_conversion_path })}>{PREFERRED_CONVERSION_PATHS.map((value) => <option key={value} value={value}>{PREFERRED_CONVERSION_PATH_LABELS[value]}</option>)}</select></label>
        <label className="consultation-field"><span>實體會面可行性</span><select value={commercial.meeting_feasibility} onChange={(event) => {
          const meeting_feasibility = event.target.value as typeof commercial.meeting_feasibility;
          updateCommercial({ meeting_feasibility, ...(meeting_feasibility === "NOT_APPLICABLE" ? { meeting_feasibility_reason: null } : {}) });
        }}>{MEETING_FEASIBILITIES.map((value) => <option key={value} value={value}>{MEETING_FEASIBILITY_LABELS[value]}</option>)}</select></label>
        <label className="consultation-field"><span>會面限制原因</span><select value={commercial.meeting_feasibility_reason ?? ""} disabled={commercial.meeting_feasibility === "NOT_APPLICABLE"} onChange={(event) => updateCommercial({ meeting_feasibility_reason: event.target.value ? event.target.value as NonNullable<typeof commercial.meeting_feasibility_reason> : null })}><option value="">未指定</option>{MEETING_FEASIBILITY_REASONS.map((value) => <option key={value} value={value}>{MEETING_FEASIBILITY_REASON_LABELS[value]}</option>)}</select></label>
      </div>
      <div className="consultation-journey"><div>
        <label><input type="checkbox" checked={commercial.angel_plan_candidate} onChange={(event) => updateCommercial({ angel_plan_candidate: event.target.checked })} /><span>將天使計畫列為候選解法</span></label>
        <label><input type="checkbox" checked={commercial.client_explicit_rejection} onChange={(event) => updateCommercial({ client_explicit_rejection: event.target.checked, commercial_permission_source: event.target.checked ? "EXPLICIT_CLIENT_NO" : "NOT_YET_ASKED" })} /><span>客戶本人已明確拒絕商業方案討論</span></label>
        <label><input type="checkbox" checked={commercial.health_business_explicit_rejection} onChange={(event) => updateCommercial({ health_business_explicit_rejection: event.target.checked })} /><span>客戶本人已明確拒絕健康事業</span></label>
      </div></div>
      <p>出生地不會用來推斷會面可行性。只有客戶本人明確拒絕時，才勾選拒絕欄位。</p>
    </fieldset>

    <fieldset className="consultation-journey"><legend>過去接觸紀錄</legend><div>{journeyFields.map(([key, label]) => <label key={key}><input type="checkbox" checked={setting.client_journey[key]} onChange={(event) => setSetting((current) => ({ ...current, client_journey: { ...current.client_journey, [key]: event.target.checked } }))} /><span>{label}</span></label>)}</div></fieldset>

    {setting.selected_offer ? <OfferEditor title="主要方案" offer={setting.selected_offer} onChange={setSelectedOffer} /> : <div className="consultation-analysis-only"><strong>本次只做解析</strong><p>主要方案會輸出為 null，不會因系統 Route 自動加入任何成交內容。</p></div>}

    <label className="consultation-backup-toggle"><input type="checkbox" checked={Boolean(setting.backup_offer)} onChange={(event) => setBackupOffer(event.target.checked ? offerForGoal("THREE_DAY_TRIAL") : null)} /><span>啟用備用方案</span></label>
    {setting.backup_offer ? <OfferEditor title="備用方案" offer={setting.backup_offer} onChange={setBackupOffer} onTemplateChange={(goal) => setBackupOffer(offerForGoal(goal))} /> : null}

    <label className="consultation-field coach-notes"><span>本次顧問補充指令</span><textarea rows={6} value={setting.coach_notes} onChange={(event) => { const coach_notes = event.target.value; setSetting((current) => ({ ...current, coach_notes, consultation_context: { ...current.consultation_context, coach_notes } })); }} placeholder="輸入這次個案背景、希望談話特別確認的事情、成交限制、已知資訊，或希望後續 GPT 注意的內容。" /></label>

    <aside className="consultation-json-summary"><strong>JSON 本次諮詢摘要</strong><dl><div><dt>客戶階段</dt><dd>{CLIENT_STAGE_LABELS[context.client_stage]}</dd></div><div><dt>諮詢模式</dt><dd>{CONSULTATION_MODE_LABELS[context.consultation_mode]}</dd></div><div><dt>本次目標</dt><dd>{PRIMARY_GOAL_LABELS[context.primary_goal]}</dd></div><div><dt>主要方案</dt><dd>{setting.selected_offer?.offer_name || "無"}</dd></div><div><dt>備用方案</dt><dd>{setting.backup_offer?.offer_name || "無"}</dd></div><div><dt>舊健康事業開關</dt><dd>{context.allow_health_business_discussion ? "是" : "否"}</dd></div><div><dt>天使計畫候選</dt><dd>{commercial.angel_plan_candidate ? "是" : "否"}</dd></div><div><dt>偏好路徑</dt><dd>{PREFERRED_CONVERSION_PATH_LABELS[commercial.preferred_conversion_path]}</dd></div><div><dt>會面可行性</dt><dd>{MEETING_FEASIBILITY_LABELS[commercial.meeting_feasibility]}</dd></div><div><dt>Permission</dt><dd>{COMMERCIAL_PERMISSION_SOURCE_LABELS[commercial.commercial_permission_source]}</dd></div></dl></aside>

    <div className="consultation-save-row"><button className="button primary" type="button" onClick={save} disabled={saving}>{saving ? "正在儲存…" : "儲存本次諮詢設定"}</button><p role="status" aria-live="polite">{message}</p></div>
  </section>;
}

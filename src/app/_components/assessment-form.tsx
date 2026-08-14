"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TAIWAN_LOCATIONS } from "../../astrology/locations";
import { BOTTLENECK_OPTIONS, CURRENT_STATUS_OPTIONS, MOTIVATION_OPTIONS, bottleneckIsApplicable, type BottleneckCode, type CurrentStatusCode, type MotivationCode } from "../../diagnostic/profile";

type Option = { value: string; text: string };
type Question = { id: string; text: string; options: Option[] };
type BusinessOption = { value: string; label: string };
type Draft = { displayName: string; birthDate: string; birthTime: string; birthTimeUnknown: boolean; birthPlace: string; birthPlaceRegion: string; businessStatus: string; answers: Record<string, string>; motivationCode: MotivationCode | ""; currentStatusV2: CurrentStatusCode | ""; bottleneckAnswers: BottleneckCode[]; bottleneckOtherText: string };

const STORAGE_KEY = "side-hustle-assessment-draft-v1";
const EMPTY_DRAFT: Draft = { displayName: "", birthDate: "", birthTime: "", birthTimeUnknown: false, birthPlace: "", birthPlaceRegion: "", businessStatus: "", answers: {}, motivationCode: "", currentStatusV2: "", bottleneckAnswers: [], bottleneckOtherText: "" };

export function AssessmentForm({ questions, businessOptions }: { questions: Question[]; businessOptions: BusinessOption[] }) {
  const router = useRouter();
  const groups = useMemo(() => Array.from({ length: Math.ceil(questions.length / 2) }, (_, index) => questions.slice(index * 2, index * 2 + 2)), [questions]);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const diagnosticApplicable = bottleneckIsApplicable(draft.currentStatusV2);
  const steps = useMemo(() => ["profile", "business", ...groups.map((_, index) => `behavior-${index}`), "motivation", "current-status", ...(diagnosticApplicable ? ["bottleneck"] : []), "review"], [diagnosticApplicable, groups]);
  const totalSteps = steps.length;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = { ...EMPTY_DRAFT, ...JSON.parse(saved) as Draft };
        const knownTaiwanPlace = TAIWAN_LOCATIONS.some((location) => location.canonical_name === parsed.birthPlace);
        setDraft({ ...parsed, birthPlaceRegion: parsed.birthPlaceRegion || (knownTaiwanPlace ? parsed.birthPlace : parsed.birthPlace ? "OTHER_OVERSEAS" : "") });
      }
    } catch { window.localStorage.removeItem(STORAGE_KEY); }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft)); } catch { /* Storage can be unavailable in private browsing. */ }
  }, [draft, hydrated]);

  const currentStep = steps[step] ?? "review";
  const progress = currentStep === "review" ? 100 : Math.min(95, Math.round(((step + 1) / 11) * 100));
  const progressStage = currentStep === "profile" || currentStep === "business" ? "基本資料" : currentStep.startsWith("behavior-") ? "行動分析" : currentStep === "review" ? "完成確認" : "目前狀態";
  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => { setDraft((current) => ({ ...current, [key]: value })); setError(""); };

  function validateStep() {
    if (currentStep === "profile") {
      if (!draft.displayName.trim()) return "請填寫姓名或暱稱。";
      if (!draft.birthDate || Number.isNaN(Date.parse(`${draft.birthDate}T00:00:00`))) return "請選擇有效的出生日期。";
      if (!draft.birthTimeUnknown && !draft.birthTime) return "請輸入出生時間，或勾選「我不知道出生時間」。";
      if (!draft.birthPlaceRegion) return "請選擇出生縣市或其他／海外。";
      if (!draft.birthPlace.trim()) return "請填寫出生地點。";
    }
    if (currentStep === "business" && !draft.businessStatus) return "請選擇目前最接近你的副業狀態。";
    if (currentStep.startsWith("behavior-") && groups[Number(currentStep.slice(9))]?.some((question) => !draft.answers[question.id])) return "請完成這一頁的題目後再繼續。";
    if (currentStep === "motivation" && !draft.motivationCode) return "請選擇目前最接近你的想法。";
    if (currentStep === "current-status" && !draft.currentStatusV2) return "請選擇目前最接近你的狀態。";
    if (currentStep === "bottleneck") {
      if (draft.bottleneckAnswers.length < 1) return "請選擇至少一項目前最困擾你的問題。";
      if (draft.bottleneckAnswers.includes("OTHER") && !draft.bottleneckOtherText.trim()) return "請簡短補充其他困擾。";
    }
    return "";
  }

  function move(direction: 1 | -1) {
    if (direction === 1) { const message = validateStep(); if (message) { setError(message); return; } }
    setError("");
    setStep((current) => Math.max(0, Math.min(current + direction, totalSteps - 1)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submitAssessment() {
    if (Object.keys(draft.answers).length !== questions.length) { setError("還有題目尚未完成，請返回檢查。"); return; }
    setSubmitting(true); setError("");
    try {
      const { motivationCode, currentStatusV2, bottleneckAnswers, bottleneckOtherText, ...assessment } = draft;
      const response = await fetch("/api/assessments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...assessment, diagnostic: { motivationCode, currentStatusV2, bottleneckAnswers, ...(bottleneckOtherText.trim() ? { bottleneckOtherText: bottleneckOtherText.trim() } : {}) } }) });
      const result = await response.json() as { reportId?: string; error?: string };
      if (!response.ok || !result.reportId) throw new Error(result.error || "SUBMIT_FAILED");
      try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* Submission already succeeded. */ }
      router.push(`/complete?id=${encodeURIComponent(result.reportId)}`);
    } catch {
      setError("目前無法完成送出，請稍後再試。你的答案仍保存在這台裝置中。");
      setSubmitting(false);
    }
  }

  if (!hydrated) return <section className="form-card loading-card" aria-live="polite">正在載入測驗…</section>;

  return <section className="form-card">
    <div className="progress-row"><div><span className="eyebrow">副業適性行動測驗</span><p className="progress-copy">{progressStage}</p></div><strong>{progress}%</strong></div>
    <div className="progress-track" aria-label={`測驗進度 ${progress}%`}><span style={{ width: `${progress}%` }} /></div>
    {currentStep === "profile" && <ProfileStep draft={draft} update={update} />}
    {currentStep === "business" && <BusinessStep value={draft.businessStatus} options={businessOptions} onChange={(value) => update("businessStatus", value)} />}
    {currentStep.startsWith("behavior-") && <QuestionStep questions={groups[Number(currentStep.slice(9))] ?? []} answers={draft.answers} onChange={(id, value) => update("answers", { ...draft.answers, [id]: value })} />}
    {currentStep === "motivation" && <DiagnosticSingleStep number="Q11" title="你現在為什麼想找工作以外的另一種可能？" value={draft.motivationCode} options={MOTIVATION_OPTIONS} onChange={(value) => update("motivationCode", value as MotivationCode)} />}
    {currentStep === "current-status" && <DiagnosticSingleStep number="Q12" title="你目前最接近哪個狀態？" value={draft.currentStatusV2} options={CURRENT_STATUS_OPTIONS} onChange={(value) => { const next = value as CurrentStatusCode; setDraft((current) => ({ ...current, currentStatusV2: next, ...(!bottleneckIsApplicable(next) ? { bottleneckAnswers: [], bottleneckOtherText: "" } : {}) })); setError(""); }} />}
    {currentStep === "bottleneck" && <BottleneckStep selected={draft.bottleneckAnswers} otherText={draft.bottleneckOtherText} onToggle={(code) => update("bottleneckAnswers", draft.bottleneckAnswers.includes(code) ? draft.bottleneckAnswers.filter((item) => item !== code) : [...draft.bottleneckAnswers, code])} onOtherText={(value) => update("bottleneckOtherText", value)} />}
    {currentStep === "review" && <ReviewStep draft={draft} businessOptions={businessOptions} answered={Object.keys(draft.answers).length} total={questions.length} onEdit={() => setStep(0)} />}
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="form-actions">{step > 0 ? <button className="button secondary" type="button" onClick={() => move(-1)} disabled={submitting}>上一頁</button> : <span />}{currentStep !== "review" ? <button className="button primary" type="button" onClick={() => move(1)}>繼續</button> : <button className="button primary" type="button" onClick={submitAssessment} disabled={submitting}>{submitting ? "正在建立分析…" : "完成測驗"}</button>}</div>
    <p className="draft-note">答案會暫存在這台裝置，重新整理或返回時不會遺失。</p>
  </section>;
}

function ProfileStep({ draft, update }: { draft: Draft; update: <K extends keyof Draft>(key: K, value: Draft[K]) => void }) {
  function updateBirthPlaceRegion(value: string) {
    update("birthPlaceRegion", value);
    update("birthPlace", value === "OTHER_OVERSEAS" ? "" : value);
  }
  function updateBirthTimeUnknown(unknown: boolean) {
    update("birthTimeUnknown", unknown);
    if (unknown) update("birthTime", "");
  }
  return <div className="step-content"><StepHeading number="01" title="先認識你" description="出生資料只用於工作風格與生命靈數的交叉分析。" /><div className="field-grid">
    <label className="field full"><span>姓名或暱稱</span><input value={draft.displayName} onChange={(event) => update("displayName", event.target.value)} placeholder="例如：小安" autoComplete="name" /></label>
    <label className="field native-date-time-field"><span>出生日期</span><span className="native-date-time-shell"><input type="date" value={draft.birthDate} onChange={(event) => update("birthDate", event.target.value)} /></span></label>
    <div className="field birth-time-field"><span>出生時間</span>{!draft.birthTimeUnknown ? <span className="native-date-time-shell"><input aria-label="出生時間" type="time" value={draft.birthTime} onChange={(event) => update("birthTime", event.target.value)} /></span> : <div className="birth-time-unavailable" aria-live="polite">將以未提供出生時間的安全模式產生報告</div>}<label className="birth-time-unknown"><input type="checkbox" checked={draft.birthTimeUnknown} onChange={(event) => updateBirthTimeUnknown(event.target.checked)} /><span>我不知道出生時間</span></label><small className="birth-time-help">若不知道出生時間，仍可完成測驗；報告將無法精準計算上升星座，部分星座工作風格分析會改用較簡化版本。</small></div>
    <label className="field full"><span>出生縣市／地區</span><select value={draft.birthPlaceRegion} onChange={(event) => updateBirthPlaceRegion(event.target.value)}><option value="">請選擇</option>{TAIWAN_LOCATIONS.map((location) => <option key={location.canonical_name} value={location.canonical_name}>{location.canonical_name}</option>)}<option value="OTHER_OVERSEAS">其他／海外</option></select></label>
    {draft.birthPlaceRegion === "OTHER_OVERSEAS" ? <label className="field full"><span>其他／海外出生地點</span><input value={draft.birthPlace} onChange={(event) => update("birthPlace", event.target.value)} placeholder="例如：日本東京、美國洛杉磯" /><small className="field-help">海外地點若無法可靠取得座標，將安全降級為太陽＋月亮，上升星座不會猜測。</small></label> : null}
  </div></div>;
}

function BusinessStep({ value, options, onChange }: { value: string; options: BusinessOption[]; onChange: (value: string) => void }) {
  return <div className="step-content"><StepHeading number="02" title="你目前的副業狀態" description="選擇最接近現在的情況，不需要選擇你希望自己成為的樣子。" /><div className="option-list">{options.map((option) => <ChoiceCard key={option.value} name="businessStatus" value={option.value} checked={value === option.value} onChange={() => onChange(option.value)}><strong>{option.label}</strong></ChoiceCard>)}</div></div>;
}

function QuestionStep({ questions, answers, onChange }: { questions: Question[]; answers: Record<string, string>; onChange: (id: string, value: string) => void }) {
  return <div className="step-content"><StepHeading number="行為分析" title="選擇最像你平常的反應" description="沒有標準答案，請以真實經驗作答，而不是理想中的自己。" /><div className="question-stack">{questions.map((question) => <fieldset className="question-block" key={question.id}><legend><span>{question.id}</span>{question.text}</legend><div className="option-list compact">{question.options.map((option) => <ChoiceCard key={option.value} name={question.id} value={option.value} checked={answers[question.id] === option.value} onChange={() => onChange(question.id, option.value)}><span className="option-letter">{option.value}</span><span>{option.text}</span></ChoiceCard>)}</div></fieldset>)}</div></div>;
}

function DiagnosticSingleStep({ number, title, value, options, onChange }: { number: "Q11" | "Q12"; title: string; value: string; options: readonly { code: string; label: string }[]; onChange: (value: string) => void }) {
  return <div className="step-content"><StepHeading number={number} title={title} description="請選擇目前最接近你的情況，沒有標準答案。" /><div className="option-list compact diagnostic-options">{options.map((option, index) => <ChoiceCard key={option.code} name={number} value={option.code} checked={value === option.code} onChange={() => onChange(option.code)}><span className="option-letter">{String.fromCharCode(65 + index)}</span><span>{option.label}</span></ChoiceCard>)}</div></div>;
}

function BottleneckStep({ selected, otherText, onToggle, onOtherText }: { selected: BottleneckCode[]; otherText: string; onToggle: (code: BottleneckCode) => void; onOtherText: (value: string) => void }) {
  const atLimit = selected.length >= 2;
  return <div className="step-content"><StepHeading number="Q13" title="如果只能先改善一到兩件事，目前最困擾你的問題是什麼？" description="這題只用來整理你現在最需要處理的情況，不會改變正式適性分數。" /><p className="diagnostic-limit">最多選 2 項，目前已選 {selected.length} 項</p><div className="option-list compact diagnostic-options">{BOTTLENECK_OPTIONS.map((option, index) => { const checked = selected.includes(option.code); const disabled = atLimit && !checked; return <label key={option.code} className={`choice-card diagnostic-checkbox${checked ? " selected" : ""}${disabled ? " disabled" : ""}`}><input type="checkbox" value={option.code} checked={checked} disabled={disabled} onChange={() => onToggle(option.code)} /><span className="checkbox-mark" aria-hidden="true">{checked ? "✓" : ""}</span><span className="choice-copy"><span className="option-letter">{String.fromCharCode(65 + index)}</span><span>{option.label}</span></span></label>; })}</div>{selected.includes("OTHER") ? <label className="field diagnostic-other"><span>請簡短補充</span><input value={otherText} maxLength={160} onChange={(event) => onOtherText(event.target.value)} placeholder="例如：不知道怎麼定價" /></label> : null}</div>;
}

function ReviewStep({ draft, businessOptions, answered, total, onEdit }: { draft: Draft; businessOptions: BusinessOption[]; answered: number; total: number; onEdit: () => void }) {
  const status = businessOptions.find((item) => item.value === draft.businessStatus)?.label;
  return <div className="step-content"><StepHeading number="完成前確認" title="你的資料已經準備好了" description="送出後只會顯示測驗編號，完整分析需要由教練端交叉解讀。" /><div className="review-grid"><div className="review-card"><span>姓名／暱稱</span><strong>{draft.displayName}</strong></div><div className="review-card"><span>出生資料</span><strong>{draft.birthDate} {draft.birthTime || "時間未提供"}</strong><small>{draft.birthPlace}</small></div><div className="review-card full"><span>副業現況</span><strong>{status}</strong></div></div><div className="review-status"><span className="check-mark">✓</span><div><strong>10 題行為題已完成</strong><p>{answered}／{total} 題</p></div></div><button className="text-button" type="button" onClick={onEdit}>返回修改基本資料</button><p className="privacy-note">送出即表示你同意系統使用本次資料產生個人化副業適性分析。第一階段測試版不會公開顯示你的完整報告。</p></div>;
}

function StepHeading({ number, title, description }: { number: string; title: string; description: string }) { return <header className="step-heading"><span>{number}</span><h1>{title}</h1><p>{description}</p></header>; }
function ChoiceCard({ name, value, checked, onChange, children }: { name: string; value: string; checked: boolean; onChange: () => void; children: React.ReactNode }) { return <label className={`choice-card${checked ? " selected" : ""}`}><input type="radio" name={name} value={value} checked={checked} onChange={onChange} /><span className="radio-dot" aria-hidden="true" /><span className="choice-copy">{children}</span></label>; }

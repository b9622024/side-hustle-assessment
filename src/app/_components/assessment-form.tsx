"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TAIWAN_LOCATIONS } from "../../astrology/locations";

type Option = { value: string; text: string };
type Question = { id: string; text: string; options: Option[] };
type BusinessOption = { value: string; label: string };
type Draft = { displayName: string; birthDate: string; birthTime: string; birthPlace: string; birthPlaceRegion: string; businessStatus: string; answers: Record<string, string> };

const STORAGE_KEY = "side-hustle-assessment-draft-v1";
const EMPTY_DRAFT: Draft = { displayName: "", birthDate: "", birthTime: "", birthPlace: "", birthPlaceRegion: "", businessStatus: "", answers: {} };

export function AssessmentForm({ questions, businessOptions }: { questions: Question[]; businessOptions: BusinessOption[] }) {
  const router = useRouter();
  const groups = useMemo(() => Array.from({ length: Math.ceil(questions.length / 2) }, (_, index) => questions.slice(index * 2, index * 2 + 2)), [questions]);
  const totalSteps = 2 + groups.length + 1;
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const progress = Math.round(((step + 1) / totalSteps) * 100);
  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => { setDraft((current) => ({ ...current, [key]: value })); setError(""); };

  function validateStep() {
    if (step === 0) {
      if (!draft.displayName.trim()) return "請填寫姓名或暱稱。";
      if (!draft.birthDate || Number.isNaN(Date.parse(`${draft.birthDate}T00:00:00`))) return "請選擇有效的出生日期。";
      if (!draft.birthPlaceRegion) return "請選擇出生縣市或其他／海外。";
      if (!draft.birthPlace.trim()) return "請填寫出生地點。";
    }
    if (step === 1 && !draft.businessStatus) return "請選擇目前最接近你的副業狀態。";
    if (step >= 2 && step < totalSteps - 1 && groups[step - 2]?.some((question) => !draft.answers[question.id])) return "請完成這一頁的題目後再繼續。";
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
      const response = await fetch("/api/assessments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
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
    <div className="progress-row"><div><span className="eyebrow">副業適性行動測驗</span><p className="progress-copy">第 {step + 1} 步，共 {totalSteps} 步</p></div><strong>{progress}%</strong></div>
    <div className="progress-track" aria-label={`測驗進度 ${progress}%`}><span style={{ width: `${progress}%` }} /></div>
    {step === 0 && <ProfileStep draft={draft} update={update} />}
    {step === 1 && <BusinessStep value={draft.businessStatus} options={businessOptions} onChange={(value) => update("businessStatus", value)} />}
    {step >= 2 && step < totalSteps - 1 && <QuestionStep questions={groups[step - 2] ?? []} answers={draft.answers} onChange={(id, value) => update("answers", { ...draft.answers, [id]: value })} />}
    {step === totalSteps - 1 && <ReviewStep draft={draft} businessOptions={businessOptions} answered={Object.keys(draft.answers).length} total={questions.length} onEdit={() => setStep(0)} />}
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="form-actions">{step > 0 ? <button className="button secondary" type="button" onClick={() => move(-1)} disabled={submitting}>上一頁</button> : <span />}{step < totalSteps - 1 ? <button className="button primary" type="button" onClick={() => move(1)}>繼續</button> : <button className="button primary" type="button" onClick={submitAssessment} disabled={submitting}>{submitting ? "正在建立分析…" : "完成測驗"}</button>}</div>
    <p className="draft-note">答案會暫存在這台裝置，重新整理或返回時不會遺失。</p>
  </section>;
}

function ProfileStep({ draft, update }: { draft: Draft; update: <K extends keyof Draft>(key: K, value: Draft[K]) => void }) {
  function updateBirthPlaceRegion(value: string) {
    update("birthPlaceRegion", value);
    update("birthPlace", value === "OTHER_OVERSEAS" ? "" : value);
  }
  return <div className="step-content"><StepHeading number="01" title="先認識你" description="出生資料只用於工作風格與生命靈數的交叉分析。出生時間不確定可以留白。" /><div className="field-grid">
    <label className="field full"><span>姓名或暱稱</span><input value={draft.displayName} onChange={(event) => update("displayName", event.target.value)} placeholder="例如：小安" autoComplete="name" /></label>
    <label className="field"><span>出生日期</span><input type="date" value={draft.birthDate} onChange={(event) => update("birthDate", event.target.value)} /></label>
    <label className="field"><span>出生時間 <small>選填</small></span><input type="time" value={draft.birthTime} onChange={(event) => update("birthTime", event.target.value)} /></label>
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

function ReviewStep({ draft, businessOptions, answered, total, onEdit }: { draft: Draft; businessOptions: BusinessOption[]; answered: number; total: number; onEdit: () => void }) {
  const status = businessOptions.find((item) => item.value === draft.businessStatus)?.label;
  return <div className="step-content"><StepHeading number="完成前確認" title="你的資料已經準備好了" description="送出後只會顯示測驗編號，完整分析需要由教練端交叉解讀。" /><div className="review-grid"><div className="review-card"><span>姓名／暱稱</span><strong>{draft.displayName}</strong></div><div className="review-card"><span>出生資料</span><strong>{draft.birthDate} {draft.birthTime || "時間未提供"}</strong><small>{draft.birthPlace}</small></div><div className="review-card full"><span>副業現況</span><strong>{status}</strong></div></div><div className="review-status"><span className="check-mark">✓</span><div><strong>10 題行為題已完成</strong><p>{answered}／{total} 題</p></div></div><button className="text-button" type="button" onClick={onEdit}>返回修改基本資料</button><p className="privacy-note">送出即表示你同意系統使用本次資料產生個人化副業適性分析。第一階段測試版不會公開顯示你的完整報告。</p></div>;
}

function StepHeading({ number, title, description }: { number: string; title: string; description: string }) { return <header className="step-heading"><span>{number}</span><h1>{title}</h1><p>{description}</p></header>; }
function ChoiceCard({ name, value, checked, onChange, children }: { name: string; value: string; checked: boolean; onChange: () => void; children: React.ReactNode }) { return <label className={`choice-card${checked ? " selected" : ""}`}><input type="radio" name={name} value={value} checked={checked} onChange={onChange} /><span className="radio-dot" aria-hidden="true" /><span className="choice-copy">{children}</span></label>; }

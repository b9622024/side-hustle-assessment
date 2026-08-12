import { AssessmentForm } from "./_components/assessment-form";
import { config } from "../scoring/config";

export default function AssessmentPage() {
  const questions = config.questionnaire.map((question) => ({
    id: question.id,
    text: question.text,
    options: Object.entries(question.options).map(([value, option]) => ({ value, text: option.text })),
  }));
  const businessOptions = Object.entries(config.business_status_options).map(([value, label]) => ({ value, label }));

  return <main className="assessment-shell">
    <header className="brand-header"><div className="brand-mark" aria-hidden="true">SH</div><div><p className="brand-name">副業適性研究室</p><p className="brand-subtitle">Side Hustle Action Lab</p></div></header>
    <AssessmentForm questions={questions} businessOptions={businessOptions} />
    <footer className="site-footer">本測驗用於自我探索與後續顧問解析，不構成收入保證或投資建議。</footer>
  </main>;
}

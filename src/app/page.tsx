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
    <header className="brand-header"><div className="brand-mark" aria-hidden="true">SH</div><div><p className="brand-name">可樂吉健康研究所</p><p className="brand-subtitle">Side Hustle Action Lab</p></div></header>
    <section className="assessment-hero" aria-labelledby="assessment-title">
      <p className="eyebrow">星座 × 生命靈數 × 行為分析</p>
      <h1 id="assessment-title">副業適性行動測驗</h1>
      <p className="assessment-hero-lead">結合星座、生命靈數與實際行為回答，解讀你的第二收入工作風格、行動模式與適合的發展方向。</p>
      <p className="assessment-hero-positioning">你不一定要現在辭職，也不一定要立刻創業。先看清楚自己適合用什麼方式建立第二條路。</p>
      <p className="assessment-hero-meta">約 3 分鐘完成<span aria-hidden="true">｜</span>約 12 道情境與現況題</p>
      <p className="assessment-hero-reminder">你的每一個選擇都會影響後續分析結果，請依照你「實際會怎麼做」來回答，而不是選看起來比較理想的答案。</p>
      <a className="button primary assessment-start" href="#assessment-form">開始測驗</a>
    </section>
    <div id="assessment-form"><AssessmentForm questions={questions} businessOptions={businessOptions} /></div>
    <footer className="site-footer">本測驗用於自我探索與後續顧問解析，不構成收入保證或投資建議。</footer>
  </main>;
}

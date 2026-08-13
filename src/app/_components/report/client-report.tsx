import type { ClientReportData } from "../../../report/types";
import { RadarChart } from "./radar-chart";

const elementLabels = { FIRE: "火象", EARTH: "土象", AIR: "風象", WATER: "水象" } as const;
const modalityLabels = { CARDINAL: "開創", FIXED: "固定", MUTABLE: "變動" } as const;

function SectionTitle({ number, title, description }: { number: string; title: string; description: string }) {
  return <header className="report-section-title"><span>{number}</span><div><h2>{title}</h2><p>{description}</p></div></header>;
}

export function ClientReport({ data }: { data: ClientReportData }) {
  const birthDetail = [data.person.birthDate, data.person.birthTime, data.person.birthPlace].filter(Boolean).join(" · ");
  const typeLabels = Object.fromEntries(data.sideHustleModes.map((mode) => [mode.key, mode.label]));
  const elementDistribution = data.astrology.elementDistribution ?? { FIRE: 0, EARTH: 0, AIR: 0, WATER: 0 };
  const modalityDistribution = data.astrology.modalityDistribution ?? { CARDINAL: 0, FIXED: 0, MUTABLE: 0 };
  const crossAnalysis = data.astrology.crossAnalysis ?? { alignments: [], tensions: [], neutral_findings: [], summary: data.astrology.summary };
  return (
    <main className="client-report">
      <header className="report-hero">
        <div className="report-brand"><span>SH</span><div><strong>副業羅盤</strong><small>Side Hustle Compass</small></div></div>
        <div className="report-hero-copy">
          <p className="eyebrow">Personal Action Profile</p>
          <h1>{data.report.title}</h1>
          <p>{data.report.subtitle}</p>
        </div>
        <dl className="report-meta">
          <div><dt>報告編號</dt><dd>{data.report.id}</dd></div>
          <div><dt>姓名</dt><dd>{data.person.displayName}</dd></div>
          <div><dt>出生資料</dt><dd>{birthDetail}</dd></div>
        </dl>
        <div className="report-overview">
          <div><span>主要模式</span><strong>{data.overview.primaryType}</strong></div>
          <div><span>輔助模式</span><strong>{data.overview.secondaryType}</strong></div>
          <p>{data.overview.summary}</p>
        </div>
      </header>

      <div className="report-grid">
        <section className="report-panel">
          <SectionTitle number="01" title="星座工作風格" description="從核心動機、情緒需求與外在行動方式理解工作節奏。" />
          <div className="placement-grid">
            {data.astrology.placements.map((placement) => <article key={placement.key}><span>{placement.label}</span><strong>{placement.sign}</strong><p>{elementLabels[placement.element]} · {modalityLabels[placement.modality]}</p></article>)}
          </div>
          <div className="astrology-distributions">
            <div><strong>四元素分布</strong>{Object.entries(elementDistribution).map(([key, value]) => <p key={key}><span>{elementLabels[key as keyof typeof elementLabels]}</span><i><b style={{ width: `${value * 100}%` }} /></i><em>{Math.round(value * 100)}%</em></p>)}</div>
            <div><strong>三模式分布</strong>{Object.entries(modalityDistribution).map(([key, value]) => <p key={key}><span>{modalityLabels[key as keyof typeof modalityLabels]}</span><i><b style={{ width: `${value * 100}%` }} /></i><em>{Math.round(value * 100)}%</em></p>)}</div>
          </div>
          <p className="section-note">{data.astrology.summary}</p>
          <div className="astrology-echo"><strong>星座傾向與副業模式的呼應</strong><p>{crossAnalysis.alignments.length > 0 ? `出生工作風格與「${crossAnalysis.alignments.map((item) => typeLabels[item.type]).join("／")}」有部分呼應。` : "出生工作風格沒有把任何單一副業模式推成唯一答案。"} 行為測驗仍是正式主型判斷依據，星座只補充較自然的工作節奏。</p></div>
        </section>

        <section className="report-panel">
          <SectionTitle number="02" title="生命靈數傾向" description="看見長期動機、自然表現與數字能量分布。" />
          <div className="number-summary"><div><span>生命靈數</span><strong>{data.numerology.lifePath}</strong></div><div><span>生日數</span><strong>{data.numerology.birthdayNumber}</strong></div>{data.numerology.masterNumber ? <div><span>大師數</span><strong>{data.numerology.masterNumber}</strong></div> : null}</div>
          <div className="digit-bars" aria-label="出生日期數字分布">
            {data.numerology.digitDistribution.map((item) => <div key={item.digit}><span>{item.digit}</span><i><b style={{ height: `${Math.max(8, item.count * 25)}%` }} /></i><small>{item.count}</small></div>)}
          </div>
          <p className="section-note">{data.numerology.summary}</p>
        </section>

        <section className="report-panel">
          <SectionTitle number="03" title="副業行動輪廓" description="六項能力呈現你目前最自然的行動資源。" />
          <RadarChart profile={data.actionProfile} />
        </section>

        <section className="report-panel">
          <SectionTitle number="04" title="適合的副業模式" description={`行為模式相對適配指數 · ${data.typeState}`} />
          <div className="mode-list">
            {data.sideHustleModes.map((mode) => {const emphasized=data.typeState==="CLEAR"?mode.rank===1:data.typeState==="MIXED"?mode.rank<=2:false;return <div key={mode.key} className={emphasized?"featured":""}><span>{String(mode.rank).padStart(2,"0")}</span><strong>{mode.label}{mode.rank===1?<small>主型</small>:mode.rank===2?<small>副型</small>:null}</strong><i><b style={{width:`${mode.displayFitIndex*10}%`}} /></i><em>{mode.displayFitIndex.toFixed(1)}</em></div>;})}
          </div>
          <p className="report-caption">分數代表你的行為模式與各副業型態的相對適配程度，用於比較不同方向，不代表成功機率。</p>
        </section>

        <section className="report-panel">
          <SectionTitle number="05" title="潛在摩擦風險" description="分數越高，越值得提前設計低阻力的應對方式。" />
          <div className="friction-list">
            {data.frictions.map((item) => <article key={item.key}><div><strong>{item.label}</strong><span>{item.score.toFixed(1)} / 10</span></div><i><b style={{ width: `${item.score * 10}%` }} /></i><p>{item.guidance}</p></article>)}
          </div>
        </section>

        <section className="report-panel">
          <SectionTitle number="06" title="執行偏好光譜" description="位置沒有好壞，重點是選擇符合自己的運作方式。" />
          <div className="spectrum-list">
            {data.spectrums.map((item) => <article key={item.key}><div><span>{item.left}</span><span>{item.right}</span></div><i><b style={{ left: `${item.score * 10}%` }} /></i><small>目前位置 {item.score.toFixed(1)}</small></article>)}
          </div>
        </section>
      </div>
      <footer className="report-footer"><span>副業羅盤 · Side Hustle Compass</span><span>本報告用於自我探索與行動規劃，不構成財務或職涯保證。</span></footer>
    </main>
  );
}

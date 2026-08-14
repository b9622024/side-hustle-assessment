import type { ClientReportData } from "../../../report/types";

type Profile = ClientReportData["actionProfile"];

function point(index: number, radius: number) {
  const angle = -Math.PI / 2 + index * (Math.PI * 2 / 6);
  return `${100 + Math.cos(angle) * radius},${100 + Math.sin(angle) * radius}`;
}

export function RadarChart({ profile }: { profile: Profile }) {
  const dataPoints = profile.map((item, index) => point(index, item.score / 5 * 72)).join(" ");
  return (
    <div className="radar-wrap">
      <svg className="radar" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="六項副業行動能力雷達圖">
        {[18, 36, 54, 72].map((radius) => <polygon key={radius} points={profile.map((_, index) => point(index, radius)).join(" ")} className="radar-grid" fill="none" stroke="#dce3e2" strokeWidth="1" />)}
        {profile.map((_, index) => <line key={index} x1="100" y1="100" x2={point(index, 72).split(",")[0]} y2={point(index, 72).split(",")[1]} className="radar-axis" stroke="#e4e8e7" strokeWidth="1" />)}
        <polygon points={dataPoints} className="radar-shape" fill="#2f8178" fillOpacity="0.2" stroke="#2f8178" strokeWidth="2" strokeLinejoin="round" />
        {profile.map((item, index) => {
          const [x, y] = point(index, 88).split(",").map(Number);
          return <text key={item.key} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="radar-label" fill="#172944" fontFamily="Georgia, serif" fontSize="11" fontWeight="700">{item.key}</text>;
        })}
      </svg>
      <div className="radar-legend">
        {profile.map((item) => <div key={item.key}><span>{item.key}</span><p>{item.label}</p><strong>{item.score.toFixed(1)}</strong></div>)}
      </div>
    </div>
  );
}

import { notFound } from "next/navigation";
import { ClientReport } from "../../_components/report/client-report";
import { JsonExportActions } from "../../coach/_components/json-export-actions";
import { buildPhase4Preview, type Phase4PreviewCase } from "../../../report/fixtures/phase4-export-previews";

export const dynamic = "force-dynamic";

const allowedCases = new Set<Phase4PreviewCase>(["clear", "mixed", "exploratory", "sun-moon-fallback"]);

export default async function ReportPreviewPage({ searchParams }: { searchParams: Promise<{ case?: string }> }) {
  if (process.env.NODE_ENV === "production" && process.env.VERCEL_ENV !== "preview") notFound();
  const requested = (await searchParams).case;
  const caseName: Phase4PreviewCase = requested && allowedCases.has(requested as Phase4PreviewCase) ? requested as Phase4PreviewCase : "clear";
  const report = buildPhase4Preview(caseName);
  const previewJson = JSON.stringify({ preview: true, case: caseName, report_id: report.report.id }, null, 2);
  return <main className="coach-main phase4-preview-page">
    <nav className="phase4-preview-nav" aria-label="Phase 4 PNG 測試案例">
      <strong>Phase 4 私人匯出 Preview</strong>
      <div>{["clear", "mixed", "exploratory", "sun-moon-fallback"].map((name) => <a key={name} href={`/internal/report-preview?case=${name}`}>{name}</a>)}</div>
      <JsonExportActions reportId={report.report.id} displayName={report.person.displayName} serializedJson={previewJson} />
    </nav>
    <div id="client-report-export-root" className="client-report-export-root"><ClientReport data={report} /></div>
  </main>;
}

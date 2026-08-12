import { notFound } from "next/navigation";
import { ClientReport } from "../../_components/report/client-report";
import { previewReport } from "../../../report/fixtures/preview-report";

export const dynamic = "force-dynamic";

export default function ReportPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <ClientReport data={previewReport} />;
}

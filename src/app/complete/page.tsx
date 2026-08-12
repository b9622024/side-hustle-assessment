import { CompletionCard } from "../_components/completion-card";

export default async function CompletePage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const reportId = /^SH-\d{8}-[A-F0-9]{6}$/.test(id ?? "") ? id! : "測驗編號無效";
  return <main className="completion-shell"><CompletionCard reportId={reportId} valid={reportId !== "測驗編號無效"} /></main>;
}

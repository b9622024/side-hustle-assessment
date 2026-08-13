"use server";

import { revalidatePath } from "next/cache";
import { normalizeConsultationSetting } from "../../consultation/settings";
import { requireCoach } from "../../lib/coach/auth";
import { getSupabaseAdmin } from "../../lib/supabase/admin";

export async function saveConsultationSetting(reportId: string, input: unknown) {
  await requireCoach();
  if (!/^SH-\d{8}-[A-F0-9]{6}$/.test(reportId)) return { ok: false as const, error: "報告編號格式不正確。" };
  try {
    const setting = normalizeConsultationSetting(input);
    const { data, error } = await getSupabaseAdmin().from("assessments")
      .update({ consultation_setting: setting, updated_at: new Date().toISOString() })
      .eq("report_id", reportId).select("report_id").maybeSingle();
    if (error || !data) return { ok: false as const, error: "無法儲存本次諮詢設定，請稍後再試。" };
    revalidatePath(`/coach/reports/${reportId}`);
    return { ok: true as const, setting };
  } catch {
    return { ok: false as const, error: "諮詢設定內容格式不正確，請檢查後再試。" };
  }
}

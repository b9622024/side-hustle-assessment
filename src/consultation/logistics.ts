import { TAIWAN_LOCATIONS } from "../astrology/locations";

export const CONSULTATION_MODE_OPTIONS = [
  { code: "IN_PERSON", label: "實體見面（台北／新北）" },
  { code: "ONLINE", label: "線上視訊" },
  { code: "EITHER", label: "兩種方式都可以" },
  { code: "UNDECIDED", label: "目前還不確定" },
] as const;

export type ConsultationMode = typeof CONSULTATION_MODE_OPTIONS[number]["code"];

export interface ConsultationLogistics {
  currentResidence: string;
  consultationMode: ConsultationMode;
}

export interface SavedConsultationLogistics {
  current_residence: string;
  consultation_mode: ConsultationMode;
  consultation_mode_label: string;
}

export function validateConsultationLogistics(input: ConsultationLogistics) {
  if (!input || typeof input.currentResidence !== "string" || !input.currentResidence.trim() || input.currentResidence.length > 80) {
    throw new Error("INVALID_CONSULTATION_RESIDENCE");
  }
  if (!CONSULTATION_MODE_OPTIONS.some((option) => option.code === input.consultationMode)) {
    throw new Error("INVALID_CONSULTATION_MODE");
  }
}

export function buildSavedConsultationLogistics(input: ConsultationLogistics): SavedConsultationLogistics {
  validateConsultationLogistics(input);
  return {
    current_residence: input.currentResidence.trim(),
    consultation_mode: input.consultationMode,
    consultation_mode_label: CONSULTATION_MODE_OPTIONS.find((option) => option.code === input.consultationMode)!.label,
  };
}

export function isTaiwanResidence(value: string) {
  return TAIWAN_LOCATIONS.some((location) => location.canonical_name === value);
}

/**
 * 教練後台顯示資料。舊版測驗沒有蒐集這兩項資訊，
 * 不得拿出生地當作現居地，也不得推測諮詢意願。
 */
export function formatCoachConsultationLogistics(logistics: SavedConsultationLogistics | null | undefined) {
  if (!logistics) return { currentResidence: "尚未蒐集", consultationMode: "尚未蒐集" };
  const residence = logistics.current_residence?.trim();
  const option = CONSULTATION_MODE_OPTIONS.find((item) => item.code === logistics.consultation_mode);
  return {
    currentResidence: !residence ? "尚未蒐集" : residence === "未提供" ? "暫不提供" : residence,
    consultationMode: option?.label ?? logistics.consultation_mode_label ?? "尚未蒐集",
  };
}

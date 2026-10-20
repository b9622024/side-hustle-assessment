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

import type { BusinessStatus } from "../scoring/types";

export const CLIENT_STAGES = ["FIRST_CONTACT", "ASSESSMENT_COMPLETED", "PREVIOUSLY_CONSULTED", "PREVIOUSLY_PRESENTED_OFFER", "EXISTING_CUSTOMER", "EXISTING_BUSINESS_OWNER", "CUSTOM"] as const;
export const CONSULTATION_MODES = ["FIRST_ANALYSIS", "SIDE_HUSTLE_EXPLORATION", "FOLLOW_UP", "OFFER_PRESENTATION", "CLOSING_CONSULTATION", "BUSINESS_OPTIMIZATION", "CUSTOM"] as const;
export const PRIMARY_GOALS = ["ANALYSIS_ONLY", "HEALTH_BUSINESS", "AI_MARKETING_SERVICE", "THREE_DAY_TRIAL", "ANGEL_PLAN", "CONSULTING_SERVICE", "CUSTOM_OFFER"] as const;
export const PREFERRED_CONVERSION_PATHS = ["DIRECT_ANGEL_PLAN", "EVENT_FIRST", "ONLINE_EDUCATION", "SHORT_FOLLOWUP", "NURTURE", "ANALYSIS_ONLY"] as const;
export const MEETING_FEASIBILITIES = ["HIGH", "MEDIUM", "LOW", "NOT_APPLICABLE"] as const;
export const MEETING_FEASIBILITY_REASONS = ["DISTANCE", "SCHEDULE", "CAREGIVING", "MOBILITY", "OTHER"] as const;
export const COMMERCIAL_PERMISSION_SOURCES = ["EXPLICIT_CLIENT_YES", "EXPLICIT_CLIENT_NO", "NOT_YET_ASKED", "LEGACY_UNKNOWN"] as const;
export const COMMERCIAL_PERMISSION_STATUSES = ["EXPLICIT_PERMISSION_GRANTED", "CLIENT_EXPLICIT_REJECTION", "HEALTH_BUSINESS_EXPLICIT_REJECTION", "PERMISSION_NOT_YET_ASKED", "LEGACY_PERMISSION_CONFLICT", "LEGACY_UNKNOWN"] as const;

export type ClientStage = typeof CLIENT_STAGES[number];
export type ConsultationMode = typeof CONSULTATION_MODES[number];
export type PrimaryGoal = typeof PRIMARY_GOALS[number];
export type OfferType = Exclude<PrimaryGoal, "ANALYSIS_ONLY" | "CUSTOM_OFFER"> | "CUSTOM";
export type PreferredConversionPath = typeof PREFERRED_CONVERSION_PATHS[number];
export type MeetingFeasibility = typeof MEETING_FEASIBILITIES[number];
export type MeetingFeasibilityReason = typeof MEETING_FEASIBILITY_REASONS[number];
export type CommercialPermissionSource = typeof COMMERCIAL_PERMISSION_SOURCES[number];
export type CommercialPermissionStatus = typeof COMMERCIAL_PERMISSION_STATUSES[number];

export interface ClientJourney {
  previous_assessment: boolean;
  previous_consultation: boolean;
  previous_offer_presented: boolean;
  previous_purchase: boolean;
  health_business_previously_discussed: boolean;
  existing_business: boolean;
}

export interface ConsultationContext {
  schema_version: "1.0.0";
  client_stage: ClientStage;
  consultation_mode: ConsultationMode;
  primary_goal: PrimaryGoal;
  allow_health_business_discussion: boolean;
  coach_notes: string;
}

export interface CommercialContext {
  schema_version: "1.0.0";
  client_explicit_rejection: boolean;
  health_business_explicit_rejection: boolean;
  angel_plan_candidate: boolean;
  preferred_conversion_path: PreferredConversionPath;
  meeting_feasibility: MeetingFeasibility;
  meeting_feasibility_reason: MeetingFeasibilityReason | null;
  commercial_permission_source: CommercialPermissionSource;
  commercial_permission_status: CommercialPermissionStatus;
}

export interface ConsultationOffer {
  offer_id: string;
  offer_type: OfferType;
  offer_name: string;
  description: string;
  duration: string;
  price: { currency: string; amount: number | null; display: string };
  cta: string;
  notes: string;
}

export interface ConsultationSetting {
  client_journey: ClientJourney;
  consultation_context: ConsultationContext;
  commercial_context: CommercialContext;
  selected_offer: ConsultationOffer | null;
  backup_offer: ConsultationOffer | null;
  coach_notes: string;
}

export const CLIENT_STAGE_LABELS: Record<ClientStage, string> = {
  FIRST_CONTACT: "第一次接觸", ASSESSMENT_COMPLETED: "已完成測驗", PREVIOUSLY_CONSULTED: "曾經諮詢", PREVIOUSLY_PRESENTED_OFFER: "曾介紹過方案", EXISTING_CUSTOMER: "既有客戶", EXISTING_BUSINESS_OWNER: "已有副業／事業", CUSTOM: "其他",
};
export const CONSULTATION_MODE_LABELS: Record<ConsultationMode, string> = {
  FIRST_ANALYSIS: "首次解析與諮詢", SIDE_HUSTLE_EXPLORATION: "副業方向探索", FOLLOW_UP: "後續追蹤", OFFER_PRESENTATION: "方案介紹", CLOSING_CONSULTATION: "成交諮詢", BUSINESS_OPTIMIZATION: "既有事業優化", CUSTOM: "自訂",
};
export const PRIMARY_GOAL_LABELS: Record<PrimaryGoal, string> = {
  ANALYSIS_ONLY: "本次只做解析", HEALTH_BUSINESS: "健康事業", AI_MARKETING_SERVICE: "AI／陌生客開發", THREE_DAY_TRIAL: "三天體驗", ANGEL_PLAN: "天使計畫", CONSULTING_SERVICE: "顧問服務", CUSTOM_OFFER: "自訂方案",
};
export const PREFERRED_CONVERSION_PATH_LABELS: Record<PreferredConversionPath, string> = {
  DIRECT_ANGEL_PLAN: "直接確認天使計畫", EVENT_FIRST: "先邀活動", ONLINE_EDUCATION: "先線上說明", SHORT_FOLLOWUP: "短期追蹤", NURTURE: "持續培育", ANALYSIS_ONLY: "只做解析",
};
export const MEETING_FEASIBILITY_LABELS: Record<MeetingFeasibility, string> = {
  HIGH: "高", MEDIUM: "中", LOW: "低", NOT_APPLICABLE: "不適用",
};
export const MEETING_FEASIBILITY_REASON_LABELS: Record<MeetingFeasibilityReason, string> = {
  DISTANCE: "距離", SCHEDULE: "時間安排", CAREGIVING: "照顧責任", MOBILITY: "行動限制", OTHER: "其他",
};
export const COMMERCIAL_PERMISSION_SOURCE_LABELS: Record<CommercialPermissionSource, string> = {
  EXPLICIT_CLIENT_YES: "客戶已明確同意", EXPLICIT_CLIENT_NO: "客戶已明確拒絕", NOT_YET_ASKED: "尚未詢問", LEGACY_UNKNOWN: "舊資料／狀態未知",
};

const offerTemplates: Record<Exclude<PrimaryGoal, "ANALYSIS_ONLY">, ConsultationOffer> = {
  HEALTH_BUSINESS: { offer_id: "health_business", offer_type: "HEALTH_BUSINESS", offer_name: "健康事業探索", description: "了解健康產業與事業發展方式，確認是否符合目前的目標與投入條件。", duration: "", price: { currency: "TWD", amount: null, display: "" }, cta: "詢問客戶是否願意進一步了解健康事業。", notes: "" },
  AI_MARKETING_SERVICE: { offer_id: "ai_marketing_service", offer_type: "AI_MARKETING_SERVICE", offer_name: "AI 陌生客開發顧問", description: "協助規劃 AI 工具、內容與陌生客開發流程。", duration: "", price: { currency: "TWD", amount: null, display: "" }, cta: "邀請客戶確認是否希望進一步了解服務內容。", notes: "" },
  THREE_DAY_TRIAL: { offer_id: "three_day_trial", offer_type: "THREE_DAY_TRIAL", offer_name: "三天體驗", description: "透過三天實際體驗與陪伴，觀察目前狀況與後續可調整方向。", duration: "3天", price: { currency: "TWD", amount: 1499, display: "新台幣1,499元" }, cta: "邀請客戶確認是否願意參加三天體驗。", notes: "" },
  ANGEL_PLAN: { offer_id: "angel_plan", offer_type: "ANGEL_PLAN", offer_name: "天使計畫", description: "依客戶需求提供長期執行指導、陪伴與調整。", duration: "6個月", price: { currency: "TWD", amount: null, display: "" }, cta: "取得客戶允許後，介紹適合的天使計畫內容。", notes: "" },
  CONSULTING_SERVICE: { offer_id: "consulting_service", offer_type: "CONSULTING_SERVICE", offer_name: "一對一顧問服務", description: "依個案目標提供一對一分析、策略規劃與執行建議。", duration: "", price: { currency: "TWD", amount: null, display: "" }, cta: "邀請客戶確認是否希望安排下一步顧問服務。", notes: "" },
  CUSTOM_OFFER: { offer_id: "custom", offer_type: "CUSTOM", offer_name: "", description: "", duration: "", price: { currency: "TWD", amount: null, display: "" }, cta: "", notes: "" },
};

export function offerForGoal(goal: Exclude<PrimaryGoal, "ANALYSIS_ONLY">): ConsultationOffer {
  return structuredClone(offerTemplates[goal]);
}

export function formatPrice(currency: string, amount: number | null) {
  if (amount === null) return "";
  return currency === "TWD" ? `新台幣${amount.toLocaleString("zh-TW")}元` : `${currency} ${amount.toLocaleString("zh-TW")}`;
}

export function initializeConsultationSetting(businessStatus: BusinessStatus): ConsultationSetting {
  return {
    client_journey: { previous_assessment: true, previous_consultation: false, previous_offer_presented: false, previous_purchase: false, health_business_previously_discussed: false, existing_business: businessStatus === "ACTIVE" || businessStatus === "STABLE" },
    consultation_context: { schema_version: "1.0.0", client_stage: "ASSESSMENT_COMPLETED", consultation_mode: "FIRST_ANALYSIS", primary_goal: "ANALYSIS_ONLY", allow_health_business_discussion: false, coach_notes: "" },
    commercial_context: { schema_version: "1.0.0", client_explicit_rejection: false, health_business_explicit_rejection: false, angel_plan_candidate: false, preferred_conversion_path: "ANALYSIS_ONLY", meeting_feasibility: "NOT_APPLICABLE", meeting_feasibility_reason: null, commercial_permission_source: "NOT_YET_ASKED", commercial_permission_status: "PERMISSION_NOT_YET_ASKED" },
    selected_offer: null, backup_offer: null, coach_notes: "",
  };
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("INVALID_CONSULTATION_SETTING");
  return value as Record<string, unknown>;
}
function text(value: unknown, max = 4000) { return typeof value === "string" ? value.slice(0, max) : ""; }
function bool(value: unknown) { return value === true; }
function enumValue<T extends readonly string[]>(value: unknown, values: T, fallback: T[number]): T[number] { return typeof value === "string" && values.includes(value) ? value as T[number] : fallback; }

function normalizeOffer(value: unknown): ConsultationOffer {
  const raw = object(value); const price = object(raw.price ?? {});
  const amount = typeof price.amount === "number" && Number.isFinite(price.amount) && price.amount >= 0 ? price.amount : null;
  const currency = text(price.currency, 8) || "TWD";
  const offerTypeValues = ["HEALTH_BUSINESS", "AI_MARKETING_SERVICE", "THREE_DAY_TRIAL", "ANGEL_PLAN", "CONSULTING_SERVICE", "CUSTOM"] as const;
  return { offer_id: text(raw.offer_id, 80) || "custom", offer_type: enumValue(raw.offer_type, offerTypeValues, "CUSTOM"), offer_name: text(raw.offer_name, 160), description: text(raw.description), duration: text(raw.duration, 160), price: { currency, amount, display: text(price.display, 160) || formatPrice(currency, amount) }, cta: text(raw.cta), notes: text(raw.notes) };
}

export function normalizeConsultationSetting(value: unknown): ConsultationSetting {
  const raw = object(value); const journey = object(raw.client_journey); const context = object(raw.consultation_context);
  const primaryGoal = enumValue(context.primary_goal, PRIMARY_GOALS, "ANALYSIS_ONLY");
  const coachNotes = text(raw.coach_notes ?? context.coach_notes, 10000);
  const hasCommercialContext = Boolean(raw.commercial_context && typeof raw.commercial_context === "object" && !Array.isArray(raw.commercial_context));
  const commercial = hasCommercialContext ? object(raw.commercial_context) : {};
  const selectedOfferRaw = raw.selected_offer && typeof raw.selected_offer === "object" ? raw.selected_offer as Record<string, unknown> : null;
  const hasAngelPlanIntent = primaryGoal === "ANGEL_PLAN" || selectedOfferRaw?.offer_type === "ANGEL_PLAN";
  const permissionSource = enumValue(commercial.commercial_permission_source, COMMERCIAL_PERMISSION_SOURCES, hasCommercialContext ? "NOT_YET_ASKED" : "LEGACY_UNKNOWN");
  const clientExplicitRejection = bool(commercial.client_explicit_rejection) || permissionSource === "EXPLICIT_CLIENT_NO";
  const healthBusinessExplicitRejection = bool(commercial.health_business_explicit_rejection);
  const legacyPermissionConflict = !hasCommercialContext && !bool(context.allow_health_business_discussion) && hasAngelPlanIntent;
  const permissionStatus: CommercialPermissionStatus = clientExplicitRejection
    ? "CLIENT_EXPLICIT_REJECTION"
    : healthBusinessExplicitRejection
      ? "HEALTH_BUSINESS_EXPLICIT_REJECTION"
      : permissionSource === "EXPLICIT_CLIENT_YES"
        ? "EXPLICIT_PERMISSION_GRANTED"
        : legacyPermissionConflict
          ? "LEGACY_PERMISSION_CONFLICT"
          : permissionSource === "NOT_YET_ASKED"
            ? "PERMISSION_NOT_YET_ASKED"
            : "LEGACY_UNKNOWN";
  const meetingFeasibility = enumValue(commercial.meeting_feasibility, MEETING_FEASIBILITIES, "NOT_APPLICABLE");
  return {
    client_journey: { previous_assessment: bool(journey.previous_assessment), previous_consultation: bool(journey.previous_consultation), previous_offer_presented: bool(journey.previous_offer_presented), previous_purchase: bool(journey.previous_purchase), health_business_previously_discussed: bool(journey.health_business_previously_discussed), existing_business: bool(journey.existing_business) },
    consultation_context: { schema_version: "1.0.0", client_stage: enumValue(context.client_stage, CLIENT_STAGES, "ASSESSMENT_COMPLETED"), consultation_mode: enumValue(context.consultation_mode, CONSULTATION_MODES, "FIRST_ANALYSIS"), primary_goal: primaryGoal, allow_health_business_discussion: bool(context.allow_health_business_discussion), coach_notes: coachNotes },
    commercial_context: {
      schema_version: "1.0.0",
      client_explicit_rejection: clientExplicitRejection,
      health_business_explicit_rejection: healthBusinessExplicitRejection,
      angel_plan_candidate: bool(commercial.angel_plan_candidate) || hasAngelPlanIntent,
      preferred_conversion_path: enumValue(commercial.preferred_conversion_path, PREFERRED_CONVERSION_PATHS, hasAngelPlanIntent ? "DIRECT_ANGEL_PLAN" : "ANALYSIS_ONLY"),
      meeting_feasibility: meetingFeasibility,
      meeting_feasibility_reason: meetingFeasibility === "NOT_APPLICABLE" ? null : enumValue(commercial.meeting_feasibility_reason, MEETING_FEASIBILITY_REASONS, "OTHER"),
      commercial_permission_source: permissionSource,
      commercial_permission_status: permissionStatus,
    },
    selected_offer: primaryGoal === "ANALYSIS_ONLY" ? null : normalizeOffer(raw.selected_offer),
    backup_offer: raw.backup_offer == null ? null : normalizeOffer(raw.backup_offer),
    coach_notes: coachNotes,
  };
}

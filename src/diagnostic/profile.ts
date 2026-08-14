export const DIAGNOSTIC_SCHEMA_VERSION = "2.2.0-rc1" as const;

export const MOTIVATION_OPTIONS = [
  { code: "SECOND_INCOME", label: "想增加額外收入" },
  { code: "INCOME_DIVERSIFICATION", label: "不希望未來只有一份薪水" },
  { code: "CAREER_DISSATISFACTION", label: "對目前工作不太滿意，想多一個選擇" },
  { code: "CAREER_EXIT", label: "想離職，但目前還不敢直接離開" },
  { code: "FUTURE_SECURITY", label: "擔心未來收入或職涯不夠穩定" },
  { code: "SIDE_HUSTLE_STUCK", label: "已經開始副業，但發展不如預期" },
  { code: "BUILD_OWN_BUSINESS", label: "想建立自己的事業" },
  { code: "SELF_EXPLORATION", label: "目前主要想了解自己適合什麼" },
] as const;

export const CURRENT_STATUS_OPTIONS = [
  { code: "NOT_STARTED", label: "還沒有開始，目前只是了解" },
  { code: "RESEARCHING", label: "正在研究不同的副業／第二收入方向" },
  { code: "READY_TO_START", label: "已經決定想開始，但還沒有真正執行" },
  { code: "SIDE_HUSTLE_ACTIVE", label: "已經開始經營副業" },
  { code: "OFFER_EXISTS", label: "已經有商品、服務或商城" },
  { code: "CUSTOMERS_EXIST", label: "已經有一些客戶" },
  { code: "BUSINESS_ESTABLISHED", label: "已經有自己的品牌或事業" },
] as const;

export const BOTTLENECK_OPTIONS = [
  { code: "TRAFFIC", label: "不知道去哪裡找客戶" },
  { code: "CONVERSION", label: "有人看，但很少成交" },
  { code: "CONTENT", label: "不知道要做什麼內容" },
  { code: "PROSPECTING", label: "不會陌生開發" },
  { code: "TIME", label: "沒時間穩定經營" },
  { code: "SALES", label: "不喜歡銷售" },
  { code: "GROWTH_DIRECTION", label: "不知道下一步該放大什麼" },
  { code: "CONSISTENCY", label: "已經試過很多方法，但很難持續" },
  { code: "OTHER", label: "其他" },
] as const;

export type MotivationCode = typeof MOTIVATION_OPTIONS[number]["code"];
export type CurrentStatusCode = typeof CURRENT_STATUS_OPTIONS[number]["code"];
export type BottleneckCode = typeof BOTTLENECK_OPTIONS[number]["code"];

export interface DiagnosticInput {
  motivationCode: MotivationCode;
  currentStatusV2: CurrentStatusCode;
  bottleneckAnswers: BottleneckCode[];
  bottleneckOtherText?: string;
}

export interface DiagnosticProfile {
  schema_version: typeof DIAGNOSTIC_SCHEMA_VERSION;
  motivation: { question_id: "Q11"; code: MotivationCode; label: string };
  current_status: { question_id: "Q12"; code: CurrentStatusCode; label: string };
  bottlenecks: { question_id: "Q13"; applicable: boolean; selected: Array<{ code: BottleneckCode; label: string }>; other_text: string | null };
}

const APPLICABLE_STATUSES = new Set<CurrentStatusCode>(["SIDE_HUSTLE_ACTIVE", "OFFER_EXISTS", "CUSTOMERS_EXIST", "BUSINESS_ESTABLISHED"]);

export function bottleneckIsApplicable(status: CurrentStatusCode | "") {
  return Boolean(status && APPLICABLE_STATUSES.has(status as CurrentStatusCode));
}

function findOption<T extends readonly { code: string; label: string }[]>(options: T, code: string) {
  return options.find((option) => option.code === code);
}

export function validateDiagnosticInput(input: DiagnosticInput) {
  if (!findOption(MOTIVATION_OPTIONS, input.motivationCode)) throw new Error("INVALID_DIAGNOSTIC_MOTIVATION");
  if (!findOption(CURRENT_STATUS_OPTIONS, input.currentStatusV2)) throw new Error("INVALID_DIAGNOSTIC_CURRENT_STATUS");
  const applicable = bottleneckIsApplicable(input.currentStatusV2);
  if (!applicable && (input.bottleneckAnswers.length || input.bottleneckOtherText?.trim())) throw new Error("INAPPLICABLE_DIAGNOSTIC_BOTTLENECK");
  if (applicable && (input.bottleneckAnswers.length < 1 || input.bottleneckAnswers.length > 2)) throw new Error("INVALID_DIAGNOSTIC_BOTTLENECK_COUNT");
  if (new Set(input.bottleneckAnswers).size !== input.bottleneckAnswers.length || input.bottleneckAnswers.some((code) => !findOption(BOTTLENECK_OPTIONS, code))) throw new Error("INVALID_DIAGNOSTIC_BOTTLENECK");
  if (input.bottleneckAnswers.includes("OTHER") && !input.bottleneckOtherText?.trim()) throw new Error("INVALID_DIAGNOSTIC_OTHER_TEXT");
}

export function buildDiagnosticProfile(input: DiagnosticInput): DiagnosticProfile {
  validateDiagnosticInput(input);
  const motivation = findOption(MOTIVATION_OPTIONS, input.motivationCode)!;
  const currentStatus = findOption(CURRENT_STATUS_OPTIONS, input.currentStatusV2)!;
  const applicable = bottleneckIsApplicable(input.currentStatusV2);
  return {
    schema_version: DIAGNOSTIC_SCHEMA_VERSION,
    motivation: { question_id: "Q11", code: input.motivationCode, label: motivation.label },
    current_status: { question_id: "Q12", code: input.currentStatusV2, label: currentStatus.label },
    bottlenecks: {
      question_id: "Q13",
      applicable,
      selected: applicable ? input.bottleneckAnswers.map((code) => ({ code, label: findOption(BOTTLENECK_OPTIONS, code)!.label })) : [],
      other_text: applicable && input.bottleneckAnswers.includes("OTHER") ? input.bottleneckOtherText!.trim() : null,
    },
  };
}

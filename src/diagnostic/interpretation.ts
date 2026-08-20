import { isLegacyDiagnosticProfile, type ActionStageCode, type BottleneckCode, type CurrentStatusCode, type DiagnosticProfile, type MotivationCode } from "./profile";
import type { BusinessStatus, RiskFlag, ScoringResult, SideHustleType } from "../scoring/types";

export const DIAGNOSTIC_INTERPRETATION_VERSION = "2.2.0-rc1" as const;

export type LegacyDiagnosticStage = "EXPLORATION" | "RESEARCH" | "SECOND_INCOME_STARTING" | "CAREER_TRANSITION_WATCHING" | "SIDE_HUSTLE_ACTIVE" | "TRAFFIC_BOTTLENECK" | "CONVERSION_BOTTLENECK" | "GROWTH_STAGE";
export type DiagnosticStage = LegacyDiagnosticStage
  | "SECOND_INCOME_EXPLORING" | "SECOND_INCOME_TESTING_READY" | "SECOND_INCOME_IN_PROGRESS"
  | "CAREER_TRANSITION_EXPLORING" | "CAREER_TRANSITION_TESTING_READY" | "CAREER_TRANSITION_STARTING" | "CAREER_TRANSITION_IN_PROGRESS"
  | "BUSINESS_GROWTH_EXPLORING" | "BUSINESS_GROWTH_TESTING_READY" | "BUSINESS_GROWTH_STARTING" | "BUSINESS_GROWTH_IN_PROGRESS";
export type InferredBottleneckCode = "DIRECTION" | "LOW_READINESS" | "TIME_COMMITMENT" | "SHORT_TERM_EXPECTATION" | "SYSTEM_RESISTANCE" | "STRANGER_INTERACTION";
export type DiagnosticBottleneckCode = BottleneckCode | InferredBottleneckCode;
export type NextStepRoute = "CAREER_EXPLORATION" | "FOUNDATIONAL_ACTION" | "CLIENT_ACQUISITION" | "CONVERSION_FIRST" | "CONTENT_GROWTH" | "EXISTING_BUSINESS_GROWTH" | "SKILL_SERVICE" | "CAPITAL_ROUTE" | "SYSTEM_SECOND_INCOME";
export type HealthBusinessRecommendation = "PRIORITY_EXPLORE" | "EXPLORE_GENTLY" | "ONLY_IF_INTERESTED" | "NOT_PRIMARY" | "NOT_RECOMMENDED";

export interface BottleneckProfile {
  reported: boolean;
  primary_code: DiagnosticBottleneckCode;
  secondary_code: DiagnosticBottleneckCode | null;
  source: "USER_REPORTED" | "INFERRED";
  supporting_signals: DiagnosticBottleneckCode[];
}

export interface ConversationStrategy {
  opening_focus: string;
  diagnostic_focus: string;
  avoid: string;
  possible_transition: string;
}

export interface DiagnosticInterpretation {
  schema_version: typeof DIAGNOSTIC_INTERPRETATION_VERSION;
  diagnostic_stage: DiagnosticStage;
  bottleneck_profile: BottleneckProfile;
  next_step_route: NextStepRoute;
  not_recommended: string[];
  health_business_recommendation: HealthBusinessRecommendation;
  conversation_strategy: ConversationStrategy;
  legacy_current_status: { code: CurrentStatusCode; label: string } | null;
  coach_summary: {
    motivation: string;
    business_status: BusinessStatus | null;
    action_stage: CurrentStatusCode;
    diagnostic_stage: DiagnosticStage;
    stage: DiagnosticStage;
    formal_primary_type: SideHustleType;
    formal_secondary_type: SideHustleType;
    primary_bottleneck: DiagnosticBottleneckCode;
    secondary_bottleneck: DiagnosticBottleneckCode | null;
    readiness: number;
    business_fit: number;
    next_step_route: NextStepRoute;
    health_business_recommendation: HealthBusinessRecommendation;
  };
  client_sections: {
    motivation: { title: string; interpretation: string };
    stage: { title: string; interpretation: string };
    bottleneck: { title: string; interpretation: string; inferred: boolean };
    next_step: { title: string; interpretation: string; not_recommended: string[] };
  };
}

const ACTIVE_STATUSES = new Set<CurrentStatusCode>(["SIDE_HUSTLE_ACTIVE", "OFFER_EXISTS", "CUSTOMERS_EXIST", "BUSINESS_ESTABLISHED"]);
const CAREER_MOTIVATIONS = new Set<MotivationCode>(["CAREER_DISSATISFACTION", "CAREER_EXIT"]);
const EARLY_STATUSES = new Set<CurrentStatusCode>(["NOT_STARTED", "RESEARCHING", "READY_TO_START"]);
const BUSINESS_GROWTH_MOTIVATIONS = new Set<MotivationCode>(["SIDE_HUSTLE_STUCK", "BUILD_OWN_BUSINESS"]);
const BOTTLENECK_PRIORITY: DiagnosticBottleneckCode[] = ["CONVERSION", "TRAFFIC", "PROSPECTING", "CONTENT", "SALES", "TIME", "CONSISTENCY", "GROWTH_DIRECTION", "OTHER"];

export const diagnosticStageLabels: Record<DiagnosticStage, string> = {
  EXPLORATION: "方向探索期", RESEARCH: "研究比較期", SECOND_INCOME_STARTING: "第二收入起步期", CAREER_TRANSITION_WATCHING: "職涯轉換觀望期",
  SIDE_HUSTLE_ACTIVE: "副業經營期", TRAFFIC_BOTTLENECK: "客源瓶頸期", CONVERSION_BOTTLENECK: "成交瓶頸期", GROWTH_STAGE: "既有事業成長期",
  SECOND_INCOME_EXPLORING: "第二收入探索期", SECOND_INCOME_TESTING_READY: "第二收入測試準備期", SECOND_INCOME_IN_PROGRESS: "第二收入執行期",
  CAREER_TRANSITION_EXPLORING: "職涯轉換探索期", CAREER_TRANSITION_TESTING_READY: "職涯轉換測試準備期", CAREER_TRANSITION_STARTING: "職涯轉換啟動期", CAREER_TRANSITION_IN_PROGRESS: "職涯轉換執行期",
  BUSINESS_GROWTH_EXPLORING: "新事業路徑探索期", BUSINESS_GROWTH_TESTING_READY: "新事業路徑測試準備期", BUSINESS_GROWTH_STARTING: "新事業路徑啟動期", BUSINESS_GROWTH_IN_PROGRESS: "新事業路徑執行期",
};
export const bottleneckLabels: Record<DiagnosticBottleneckCode, string> = {
  TRAFFIC: "客源", CONVERSION: "成交轉換", CONTENT: "內容方向", PROSPECTING: "陌生開發", TIME: "時間投入", SALES: "銷售互動", GROWTH_DIRECTION: "成長方向", CONSISTENCY: "持續經營", OTHER: "其他阻力",
  DIRECTION: "方向", LOW_READINESS: "準備度", TIME_COMMITMENT: "時間承諾", SHORT_TERM_EXPECTATION: "短期成果期待", SYSTEM_RESISTANCE: "系統方法接受度", STRANGER_INTERACTION: "陌生互動",
};
export const nextStepLabels: Record<NextStepRoute, string> = {
  CAREER_EXPLORATION: "職涯探索", FOUNDATIONAL_ACTION: "建立行動基礎", CLIENT_ACQUISITION: "建立穩定客源", CONVERSION_FIRST: "先改善成交轉換", CONTENT_GROWTH: "建立內容成長路徑",
  EXISTING_BUSINESS_GROWTH: "優化既有事業", SKILL_SERVICE: "從專業服務開始", CAPITAL_ROUTE: "評估資本配置路線", SYSTEM_SECOND_INCOME: "建立系統型第二收入",
};
export const healthBusinessLabels: Record<HealthBusinessRecommendation, string> = {
  PRIORITY_EXPLORE: "優先探索", EXPLORE_GENTLY: "溫和探索", ONLY_IF_INTERESTED: "有興趣時再了解", NOT_PRIMARY: "不是本次優先", NOT_RECOMMENDED: "目前不建議",
};

function determineLegacyDiagnosticStage(profile: DiagnosticProfile): LegacyDiagnosticStage {
  const motivation = profile.motivation.code;
  const status = profile.current_status.code;
  const selected = new Set(profile.bottlenecks.selected.map((item) => item.code));
  if (CAREER_MOTIVATIONS.has(motivation) && EARLY_STATUSES.has(status)) return "CAREER_TRANSITION_WATCHING";
  if (["OFFER_EXISTS", "CUSTOMERS_EXIST", "BUSINESS_ESTABLISHED"].includes(status) && selected.has("CONVERSION")) return "CONVERSION_BOTTLENECK";
  if (ACTIVE_STATUSES.has(status) && (selected.has("TRAFFIC") || selected.has("PROSPECTING"))) return "TRAFFIC_BOTTLENECK";
  if (["CUSTOMERS_EXIST", "BUSINESS_ESTABLISHED"].includes(status) && profile.bottlenecks.selected.length > 0 && profile.bottlenecks.selected.every((item) => ["GROWTH_DIRECTION", "CONSISTENCY", "TIME", "CONTENT"].includes(item.code))) return "GROWTH_STAGE";
  if (["SIDE_HUSTLE_ACTIVE", "OFFER_EXISTS", "CUSTOMERS_EXIST", "BUSINESS_ESTABLISHED"].includes(status)) return "SIDE_HUSTLE_ACTIVE";
  if (status === "READY_TO_START") return "SECOND_INCOME_STARTING";
  if (status === "RESEARCHING") return "RESEARCH";
  return "EXPLORATION";
}

const ACTION_STAGE_SUFFIX: Record<ActionStageCode, "EXPLORING" | "TESTING_READY" | "STARTING" | "IN_PROGRESS"> = {
  EXPLORING_ONLY: "EXPLORING",
  READY_TO_TEST: "TESTING_READY",
  READY_TO_START: "STARTING",
  IN_PROGRESS: "IN_PROGRESS",
};

export function determineDiagnosticStage(profile: DiagnosticProfile): DiagnosticStage {
  if (isLegacyDiagnosticProfile(profile)) return determineLegacyDiagnosticStage(profile);
  const actionStage = profile.current_status.code as ActionStageCode;
  const suffix = ACTION_STAGE_SUFFIX[actionStage];
  if (!suffix) throw new Error("INVALID_ACTION_STAGE");
  if (CAREER_MOTIVATIONS.has(profile.motivation.code)) return `CAREER_TRANSITION_${suffix}` as DiagnosticStage;
  if (BUSINESS_GROWTH_MOTIVATIONS.has(profile.motivation.code)) return `BUSINESS_GROWTH_${suffix}` as DiagnosticStage;
  return (suffix === "STARTING" ? "SECOND_INCOME_STARTING" : `SECOND_INCOME_${suffix}`) as DiagnosticStage;
}

function hasRisk(flags: RiskFlag[], id: RiskFlag["id"]) { return flags.some((flag) => flag.id === id); }

export function buildBottleneckProfile(profile: DiagnosticProfile, scoring: ScoringResult): BottleneckProfile {
  const reported = profile.bottlenecks.applicable && profile.bottlenecks.selected.length > 0;
  if (reported) {
    const sorted = profile.bottlenecks.selected.map((item) => item.code).toSorted((a, b) => BOTTLENECK_PRIORITY.indexOf(a) - BOTTLENECK_PRIORITY.indexOf(b));
    return { reported: true, primary_code: sorted[0]!, secondary_code: sorted[1] ?? null, source: "USER_REPORTED", supporting_signals: [] };
  }
  const signals: InferredBottleneckCode[] = [];
  const directionMotivations: MotivationCode[] = ["SELF_EXPLORATION", "SECOND_INCOME", "INCOME_DIVERSIFICATION", "FUTURE_SECURITY"];
  if (["NOT_STARTED", "RESEARCHING", "EXPLORING_ONLY", "READY_TO_TEST"].includes(profile.current_status.code) && directionMotivations.includes(profile.motivation.code)) signals.push("DIRECTION");
  if (scoring.readiness.score < 3.2) signals.push("LOW_READINESS");
  if (hasRisk(scoring.riskFlags, "F3")) signals.push("TIME_COMMITMENT");
  if (hasRisk(scoring.riskFlags, "F1")) signals.push("SHORT_TERM_EXPECTATION");
  if (hasRisk(scoring.riskFlags, "F4")) signals.push("SYSTEM_RESISTANCE");
  if (hasRisk(scoring.riskFlags, "F2")) signals.push("STRANGER_INTERACTION");
  if (!signals.length) signals.push("DIRECTION");
  return { reported: false, primary_code: signals[0]!, secondary_code: null, source: "INFERRED", supporting_signals: signals.slice(1) };
}

export function determineNextStep(profile: DiagnosticProfile, stage: DiagnosticStage, bottleneck: BottleneckProfile, scoring: ScoringResult, businessStatus?: BusinessStatus): NextStepRoute {
  const motivation = profile.motivation.code;
  if (CAREER_MOTIVATIONS.has(motivation)) return "CAREER_EXPLORATION";
  if (scoring.readiness.score < 3.2 || (hasRisk(scoring.riskFlags, "F1") && hasRisk(scoring.riskFlags, "F3"))) return "FOUNDATIONAL_ACTION";
  if (bottleneck.primary_code === "CONVERSION") return "CONVERSION_FIRST";
  if (["TRAFFIC", "PROSPECTING"].includes(bottleneck.primary_code)) return "CLIENT_ACQUISITION";
  if (bottleneck.primary_code === "CONTENT") return "CONTENT_GROWTH";
  if ((businessStatus === "ACTIVE" || businessStatus === "STABLE") && ["GROWTH_DIRECTION", "CONSISTENCY", "TIME"].includes(bottleneck.primary_code)) return "EXISTING_BUSINESS_GROWTH";
  if (scoring.rankedTypes[0]?.type === "CAPITAL_ALLOCATOR" && scoring.finalTypes.CAPITAL_ALLOCATOR >= 4 && scoring.scoringTrace.force_d_trace.capital_low_service_system) return "CAPITAL_ROUTE";
  const topTwo = scoring.rankedTypes.slice(0, 2).map((item) => item.type);
  if (topTwo.some((type) => type === "PROFESSIONAL_SKILL" || type === "CONSULTING_SERVICE") && (scoring.businessFit.score < 3.55 || scoring.route === "D")) return "SKILL_SERVICE";
  if (scoring.readiness.score >= 3.8 && scoring.businessFit.score >= 3.55 && ["SECOND_INCOME", "INCOME_DIVERSIFICATION", "FUTURE_SECURITY", "BUILD_OWN_BUSINESS"].includes(motivation)) return "SYSTEM_SECOND_INCOME";
  if (scoring.route === "A" && scoring.businessFit.score >= 3.55) return "SYSTEM_SECOND_INCOME";
  return "FOUNDATIONAL_ACTION";
}

export function determineHealthBusinessRecommendation(profile: DiagnosticProfile, stage: DiagnosticStage, scoring: ScoringResult): HealthBusinessRecommendation {
  if (scoring.route === "A") {
    const gentle = ["SELF_EXPLORATION", "CAREER_EXIT", "CAREER_DISSATISFACTION"].includes(profile.motivation.code) || stage.startsWith("CAREER_TRANSITION_");
    return !gentle && scoring.readiness.score >= 3.8 ? "PRIORITY_EXPLORE" : "EXPLORE_GENTLY";
  }
  if (scoring.route === "B") return "ONLY_IF_INTERESTED";
  if (scoring.route === "C") return "NOT_PRIMARY";
  return "NOT_RECOMMENDED";
}

function buildConversationStrategy(motivation: MotivationCode, bottleneck: BottleneckProfile, businessStatus?: BusinessStatus): ConversationStrategy {
  if (businessStatus === "ACTIVE" || businessStatus === "STABLE") return {
    opening_focus: "先了解現有副業或事業在做什麼、目前收入與客戶是否穩定，以及仍有多少部分高度依賴本人時間。",
    diagnostic_focus: "釐清現有事業為什麼還不能滿足這次的第二收入／職涯目標，以及是否真的需要再開一條新路。",
    avoid: "不要把新路徑的準備階段，誤解成客戶目前沒有既有事業，也不要急著叫他放棄原有累積。",
    possible_transition: "若確實需要新增一條路，再依 Action Stage 討論低風險測試、具體第一步或既有執行優化。",
  };
  if (CAREER_MOTIVATIONS.has(motivation)) return {
    opening_focus: "先理解他現在工作最不滿意的是什麼，以及想離開的是環境、收入、成長還是生活方式。",
    diagnostic_focus: "確認他是否真的願意利用下班時間建立第二套能力，而不是只想逃離現在工作。",
    avoid: "不要一開始鼓勵離職，也不要把創業包裝成快速出口。",
    possible_transition: "如果準備度與適配度都高，再討論是否適合從低風險方式開始建立第二收入。",
  };
  if (motivation === "SIDE_HUSTLE_STUCK") return {
    opening_focus: "先了解目前做什麼、做了多久、收入情況，以及客源從哪裡來。",
    diagnostic_focus: `優先確認${bottleneckLabels[bottleneck.primary_code]}是否是真正瓶頸，再區分流量、內容、成交、陌生開發與時間問題。`,
    avoid: "不要先叫他換產品、換平台或全部重新開始。",
    possible_transition: "若核心問題是陌生客，可進一步談內容、廣告、測驗 Funnel 與 AI 開發方法。",
  };
  return {
    opening_focus: "確認他希望第二收入或另一種可能，實際要解決什麼問題。",
    diagnostic_focus: "確認每週可投入多少時間、願意學哪些能力，以及期待多久看到成果。",
    avoid: "不要承諾快速或完全被動的收入。",
    possible_transition: "如果系統型與顧問型適配高，可進一步探索系統型第二收入。",
  };
}

function motivationInterpretation(code: MotivationCode) {
  const copy: Record<MotivationCode, string> = {
    SECOND_INCOME: "你想增加的不只是眼前收入，也是在正職之外建立一個能逐步累積的選擇。適合先從可驗證、可持續的小行動開始。",
    INCOME_DIVERSIFICATION: "你在意的是收入來源不要過度集中。這代表你需要一條能與現有生活並行、風險可控制的發展路線。",
    CAREER_DISSATISFACTION: "你正在重新檢視目前工作的環境與長期發展。現階段適合先增加能力與選擇，不需要急著做不可逆的決定。",
    CAREER_EXIT: "你已經感受到轉換職涯的需要，但仍重視安全感。先建立第二套能力與實際驗證，會比倉促離開更有幫助。",
    FUTURE_SECURITY: "你希望替未來增加安全感。比起追逐短期機會，更適合建立能長期累積的能力、客源或系統。",
    SIDE_HUSTLE_STUCK: "你已經跨過開始這一步，現在需要的是找準真正限制成長的位置，而不是把過去的累積全部推翻。",
    BUILD_OWN_BUSINESS: "你期待的不只是零散收入，而是建立可以長期發展的事業。下一步需要把方向轉成能被市場驗證的具體行動。",
    SELF_EXPLORATION: "你目前最需要的是辨認自己的工作方式與可行方向。先理解自己，再用小規模嘗試取得真實回饋。",
  };
  return copy[code];
}

function stageInterpretation(stage: DiagnosticStage) {
  const copy: Record<DiagnosticStage, string> = {
    EXPLORATION: "你目前正在確認自己適合什麼，重點是縮小選項並開始低成本嘗試。",
    RESEARCH: "你已經開始比較不同方向，接下來要把蒐集資訊轉成一個可驗證的選擇。",
    SECOND_INCOME_STARTING: "你已經有開始的意願，現在需要把目標拆成第一個能完成的行動週期。",
    CAREER_TRANSITION_WATCHING: "你現在比較像是在替自己保留另一條路，而不是已經準備好立刻離開現在的工作。這個階段最重要的是增加選擇，而不是急著做出不可逆的決定。",
    SIDE_HUSTLE_ACTIVE: "你已經進入實際經營階段，接下來要用回饋找出最值得穩定投入的環節。",
    TRAFFIC_BOTTLENECK: "你已經有可提供的方向，但客源還不夠穩定。現階段要先建立可重複的接觸與開發方式。",
    CONVERSION_BOTTLENECK: "你已經有人看見或接觸，真正需要改善的是理解需求、建立信任到完成成交的過程。",
    GROWTH_STAGE: "你已有一定累積，現在的重點不是重新開始，而是讓獲客、內容與執行流程更穩定。",
    SECOND_INCOME_EXPLORING: "你目前先在理解可能性，近期還沒有要正式開始。這個階段適合縮小方向，不需要急著投入大量時間或金錢。",
    SECOND_INCOME_TESTING_READY: "你已經在找方向，也願意近期開始測試。下一步是選一個低風險、能快速取得回饋的小實驗。",
    SECOND_INCOME_IN_PROGRESS: "你已經在執行新的收入路徑，接下來要依真實回饋改善卡點與加速有效做法。",
    CAREER_TRANSITION_EXPLORING: "你想替離開現有職涯保留另一條路，但目前主要仍在理解階段。先增加選擇，不需要急著裸辭。",
    CAREER_TRANSITION_TESTING_READY: "你已準備用低風險方式測試第二條職涯路徑。重點是取得真實經驗，而不是把想離職直接當成創業理由。",
    CAREER_TRANSITION_STARTING: "你已決定啟動第二條職涯／收入路徑，現在需要選定具體方法與第一步，同時保留現有安全基礎。",
    CAREER_TRANSITION_IN_PROGRESS: "你已開始建立新的職涯路徑，現階段要改善執行與結果，再依證據評估是否適合轉換。",
    BUSINESS_GROWTH_EXPLORING: "你正在理解另一條事業或收入路徑的可能性，現階段先確認它是否真的補足既有事業的限制。",
    BUSINESS_GROWTH_TESTING_READY: "你準備測試新的事業路徑，應先釐清它與現有事業的關係，避免重複投入或彼此分散。",
    BUSINESS_GROWTH_STARTING: "你已決定啟動新的事業路徑，下一步是界定方法、資源與第一個可驗證的行動。",
    BUSINESS_GROWTH_IN_PROGRESS: "你已在執行新的事業路徑，接下來要找出瓶頸，並判斷應優化新路徑或整合既有事業。",
  };
  return copy[stage];
}

function nextStepInterpretation(route: NextStepRoute) {
  const copy: Record<NextStepRoute, string> = {
    CAREER_EXPLORATION: "你現在最需要的不是立刻離職，而是先建立第二套能力與第二個選擇。從低風險的小型嘗試開始，觀察自己是否願意長期投入。",
    FOUNDATIONAL_ACTION: "現階段比選哪個平台更重要的是先建立可以持續投入的時間、節奏與成果耐心。先完成一個小週期，再決定是否擴大。",
    CLIENT_ACQUISITION: "現階段與其急著換平台或換商品，更重要的是先建立穩定、可重複的陌生客來源。",
    CONVERSION_FIRST: "你目前不一定缺曝光，真正需要改善的是從有人看到，到願意進一步了解並成交之間的轉換。",
    CONTENT_GROWTH: "先建立一套能持續產出的內容主題與驗證節奏，讓內容開始累積信任與有效詢問。",
    EXISTING_BUSINESS_GROWTH: "你目前不一定需要換副業，而是需要把現有事業的獲客、流程或執行方式做得更穩定。",
    SKILL_SERVICE: "接案、顧問或專業服務，可能比需要持續經營團隊與系統的模式更符合你目前的工作方式。",
    CAPITAL_ROUTE: "如果你期待的是低服務、低互動、低時間投入的收入模式，資產配置類型可能比經營型副業更符合你的期待。",
    SYSTEM_SECOND_INCOME: "你可以從一套可重複的服務、獲客與追蹤流程開始，逐步建立不只依賴單次投入的第二收入。",
  };
  return copy[route];
}

function notRecommended(stage: DiagnosticStage, bottleneck: BottleneckProfile, nextStep: NextStepRoute) {
  const items: string[] = [];
  if (stage === "CAREER_TRANSITION_WATCHING" || stage.startsWith("CAREER_TRANSITION_")) items.push("不建議因為工作不開心就立即裸辭");
  if (bottleneck.primary_code === "LOW_READINESS" || nextStep === "FOUNDATIONAL_ACTION") items.push("不建議同時開太多副業方向");
  if (["TRAFFIC", "PROSPECTING"].includes(bottleneck.primary_code)) items.push("不建議在沒有穩定客源前一直換商品");
  if (nextStep === "CAPITAL_ROUTE") items.push("不建議選擇高度依賴陌生開發與服務客戶的模式");
  if (nextStep === "EXISTING_BUSINESS_GROWTH") items.push("不建議因短期卡關就把現有累積全部放棄");
  return items.slice(0, 2);
}

export function buildDiagnosticInterpretation(profile: DiagnosticProfile | null | undefined, scoring: ScoringResult, businessStatus?: BusinessStatus): DiagnosticInterpretation | null {
  if (!profile) return null;
  const stage = determineDiagnosticStage(profile);
  const bottleneck = buildBottleneckProfile(profile, scoring);
  const nextStep = determineNextStep(profile, stage, bottleneck, scoring, businessStatus);
  const health = determineHealthBusinessRecommendation(profile, stage, scoring);
  const notRecommendedItems = notRecommended(stage, bottleneck, nextStep);
  const formalPrimary = scoring.rankedTypes[0]?.type;
  const formalSecondary = scoring.rankedTypes[1]?.type;
  if (!formalPrimary || !formalSecondary) throw new Error("DIAGNOSTIC_TYPE_RANKING_INCOMPLETE");
  const inferredPrefix = bottleneck.source === "INFERRED" ? "從你的回答來看，目前較可能的阻力是" : "你目前最直接感受到的阻力是";
  const secondary = bottleneck.secondary_code ? `，其次是${bottleneckLabels[bottleneck.secondary_code]}` : "";
  return {
    schema_version: DIAGNOSTIC_INTERPRETATION_VERSION,
    diagnostic_stage: stage,
    bottleneck_profile: bottleneck,
    next_step_route: nextStep,
    not_recommended: notRecommendedItems,
    health_business_recommendation: health,
    conversation_strategy: buildConversationStrategy(profile.motivation.code, bottleneck, businessStatus),
    legacy_current_status: isLegacyDiagnosticProfile(profile) ? { code: profile.current_status.code, label: profile.current_status.label } : null,
    coach_summary: { motivation: profile.motivation.label, business_status: businessStatus ?? null, action_stage: profile.current_status.code, diagnostic_stage: stage, stage, formal_primary_type: formalPrimary, formal_secondary_type: formalSecondary, primary_bottleneck: bottleneck.primary_code, secondary_bottleneck: bottleneck.secondary_code, readiness: scoring.readiness.score, business_fit: scoring.businessFit.score, next_step_route: nextStep, health_business_recommendation: health },
    client_sections: {
      motivation: { title: profile.motivation.label, interpretation: motivationInterpretation(profile.motivation.code) },
      stage: { title: diagnosticStageLabels[stage], interpretation: stageInterpretation(stage) },
      bottleneck: { title: bottleneckLabels[bottleneck.primary_code], interpretation: `${inferredPrefix}${bottleneckLabels[bottleneck.primary_code]}${secondary}。`, inferred: bottleneck.source === "INFERRED" },
      next_step: { title: nextStepLabels[nextStep], interpretation: nextStepInterpretation(nextStep), not_recommended: notRecommendedItems },
    },
  };
}

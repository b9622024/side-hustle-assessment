export const CLIENT_STAGES={FIRST_CONTACT:"第一次接觸",ASSESSMENT_COMPLETED:"已完成測驗",PREVIOUSLY_CONSULTED:"曾經諮詢",PREVIOUSLY_PRESENTED_OFFER:"曾介紹方案",EXISTING_CUSTOMER:"既有客戶",EXISTING_BUSINESS_OWNER:"已有副業／事業",CUSTOM:"其他"} as const;
export const CONSULTATION_MODES={FIRST_ANALYSIS:"首次解析與諮詢",SIDE_HUSTLE_EXPLORATION:"副業方向探索",FOLLOW_UP:"後續追蹤",OFFER_PRESENTATION:"方案介紹",CLOSING_CONSULTATION:"成交諮詢",BUSINESS_OPTIMIZATION:"既有事業優化",CUSTOM:"自訂"} as const;
export const OFFER_TYPES={HEALTH_BUSINESS:"健康事業",AI_MARKETING_SERVICE:"AI 陌生客開發",THREE_DAY_TRIAL:"三天體驗",ANGEL_PLAN:"天使計畫",CONSULTING:"顧問服務",NO_SALE_ANALYSIS_ONLY:"本次只解析，不成交",CUSTOM:"自訂"} as const;
export const HISTORY_FLAGS=["previous_assessment","previous_consultation","previous_offer_presented","previous_purchase","health_business_previously_discussed","existing_business"] as const;
export type OfferType=keyof typeof OFFER_TYPES;
export interface Offer {offer_id:string;offer_type:OfferType;offer_name:string;description:string;duration:string;price:{currency:"TWD";amount:number|null;display:string};cta:string;notes:string}
export interface ConsultationSettings {consultation_context:{client_stage:keyof typeof CLIENT_STAGES;client_stage_custom?:string;consultation_mode:keyof typeof CONSULTATION_MODES;consultation_mode_custom?:string;past_contact:Record<typeof HISTORY_FLAGS[number],boolean>;allow_health_business_discussion:boolean};selected_offer:Offer;backup_offer:Offer|null;coach_notes:string}

export function presetOffer(type:OfferType):Offer {return {offer_id:type.toLowerCase(),offer_type:type,offer_name:OFFER_TYPES[type],description:"",duration:"",price:{currency:"TWD",amount:null,display:""},cta:"",notes:""};}

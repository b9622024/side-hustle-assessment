import { describe, expect, it } from "vitest";
import { buildCoachJsonExport, serializeFullAssessmentJson } from "../src/report/build-coach-export.js";
import { scoreAssessment } from "../src/scoring/engine.js";
import type { CoachAssessmentDetail } from "../src/lib/coach/data.js";
import type { DiagnosticProfile } from "../src/diagnostic/profile.js";
import { buildDiagnosticProfile } from "../src/diagnostic/profile.js";

const answers={Q1:"A",Q2:"A",Q3:"C",Q4:"C",Q5:"D",Q6:"B",Q7:"A",Q8:"A",Q9:"A",Q10:"A"} as const;
const scoring=scoreAssessment({displayName:"JSON 測試",birthDate:"1989-01-17",birthTime:"11:45",birthPlace:"台南市",businessStatus:"NONE",answers});
const record={id:1,report_id:"SH-20260813-ABC123",display_name:"JSON 測試",birth_date:"1989-01-17",birth_time:"11:45:00",birth_place:"台南市",business_status:"NONE",created_at:"2026-08-13T00:00:00.000Z",answers,
  astrology_profile:{sun:{sign:"摩羯座",element:"EARTH",modality:"CARDINAL"}},scoring_snapshot:scoring,scoring_version:"side-hustle-scoring-v2-rc1",client_reports:[],} as CoachAssessmentDetail;

describe("coach full JSON export",()=>{
  it("contains all required top-level sections and complete RC1 trace",()=>{
    const result=buildCoachJsonExport(record);
    expect(Object.keys(result)).toEqual(expect.arrayContaining(["report_meta","respondent","birth_data","business_status","astrology","numerology","questionnaire","scoring_trace","behavior_profile","side_hustle_types","readiness","business_fit","risk_flags","routing","cross_analysis","data_quality"]));
    expect(result.report_meta.scoring_version).toBe("side-hustle-scoring-v2-rc1");
    expect(result.scoring_trace).not.toBeNull();
    expect(Object.keys(result.scoring_trace!)).toEqual(expect.arrayContaining(["question_answers","formal_question_weights","routing_question_weights","behavior_raw_scores","behavior_dimension_v1","formal_behavior_dimension_v2","routing_behavior_dimension_v1","routing_behavior_dimension_v2","formal_type_precalibrated","formal_type_final","type_percentile_method","type_percentile_reference_version","type_percentile","display_fit_index","type_ranking","type_state","readiness_components","readiness_score","stranger_interaction","business_fit_components","business_fit_score","risk_flags","force_d_trace","routing_trace","system_route"]));
    expect(result.side_hustle_types.formal_primary_type).toBe(scoring.rankedTypes[0]?.type);
    expect(result.side_hustle_types.formal_secondary_type).toBe(scoring.rankedTypes[1]?.type);
    expect(Object.keys(result.side_hustle_types.types)).toHaveLength(6);
    expect(result.scoring_trace?.astrology_scoring_trace).toEqual(expect.objectContaining({ source_points: ["sun"], normalized_weights: { sun: 1 } }));
    expect(result.scoring_trace?.diagnostic_questions_excluded_from_formal_scoring).toEqual(["Q11", "Q12", "Q13"]);
    expect(result.diagnostic_profile).toBeNull();
  });
  it("serializes Kiki client-report friction and spectrum snapshots without recalculation",()=>{
    const frictions = [
      { key: "START_HESITATION", label: "啟動猶豫", score: 5.297185436796, guidance: "先把第一步縮小到能在 30 分鐘內完成，讓回饋取代反覆評估。" },
      { key: "CONSISTENCY_PRESSURE", label: "穩定投入壓力", score: 5.062702053357, guidance: "用固定但輕量的週節奏累積，避免一開始就設定過重產量。" },
      { key: "SYSTEM_RESISTANCE", label: "系統配合阻力", score: 2.111118584394, guidance: "保留可調整空間，同時只建立一套最必要的追蹤流程。" },
      { key: "STRANGER_INTERACTION_PRESSURE", label: "陌生互動壓力", score: 1.456750705128, guidance: "先從熟人轉介、內容暖身或小型對談建立互動安全感。" },
      { key: "RESULT_ANXIETY", label: "成果焦慮", score: 5.912702053358, guidance: "把短期指標改為完成次數與有效回饋，不只看收入結果。" },
    ];
    const spectrums = [
      { key: "FREEDOM_VS_STRUCTURE", left: "自由摸索", right: "明確系統", score: 7.088881415607 },
      { key: "ANALYSIS_VS_ACTION", left: "分析準備", right: "行動嘗試", score: 3.084631963467 },
      { key: "BEHIND_SCENES_VS_EXPRESSION", left: "幕後執行", right: "對外表達", score: 4.646182093104 },
      { key: "TIME_VS_CAPITAL", left: "時間經營", right: "資本配置", score: 2.914195384027 },
    ];
    const clientRecord = { ...record, client_reports: [{ report_data: { frictions, spectrums } }] } as unknown as CoachAssessmentDetail;
    const result = buildCoachJsonExport(clientRecord);
    expect(result.client_frictions?.map((item) => item.score)).toEqual(frictions.map((item) => item.score));
    expect(result.execution_spectrums?.map((item) => item.position)).toEqual(spectrums.map((item) => item.score));
    expect(result.client_frictions?.every((item) => item.scale.max === 10 && Boolean(item.client_interpretation))).toBe(true);
    expect(result.execution_spectrums?.every((item) => item.scale.max === 10)).toBe(true);
  });
  it("serializes Q11-Q13 from the persisted diagnostic profile without changing canonical copy/download output",()=>{
    const diagnostic_profile: DiagnosticProfile={schema_version:"2.2.0-rc1",motivation:{question_id:"Q11",code:"SIDE_HUSTLE_STUCK",label:"已經開始副業，但發展不如預期"},current_status:{question_id:"Q12",code:"OFFER_EXISTS",label:"已經有商品、服務或商城"},bottlenecks:{question_id:"Q13",applicable:true,selected:[{code:"TRAFFIC",label:"不知道去哪裡找客戶"},{code:"PROSPECTING",label:"不會陌生開發"}],other_text:null}};
    const diagnosticRecord={...record,diagnostic_profile} as CoachAssessmentDetail;
    const built=buildCoachJsonExport(diagnosticRecord);
    expect(built.diagnostic_profile).toEqual({ ...diagnostic_profile, diagnostic_stage: "TRAFFIC_BOTTLENECK", legacy_current_status: { code: "OFFER_EXISTS", label: "已經有商品、服務或商城" } });
    expect(built.diagnostic_interpretation).toEqual(expect.objectContaining({ next_step_route: "CLIENT_ACQUISITION", bottleneck_profile: expect.objectContaining({ primary_code: "TRAFFIC", secondary_code: "PROSPECTING" }) }));
    expect(built.routing_context).toEqual(expect.objectContaining({ system_route: scoring.route, conversation_strategy: expect.any(Object) }));
    expect(built.coach_summary).toEqual(expect.objectContaining({ business_status: "NONE", action_stage: "OFFER_EXISTS", diagnostic_stage: "TRAFFIC_BOTTLENECK", primary_bottleneck: "TRAFFIC", next_step_route: "CLIENT_ACQUISITION" }));
    expect(built.questionnaire.answers.slice(-3)).toEqual([
      {id:"Q11",answer_code:"SIDE_HUSTLE_STUCK"},
      {id:"Q12",answer_code:"OFFER_EXISTS"},
      {id:"Q13",answer_codes:["TRAFFIC","PROSPECTING"],other_text:null},
    ]);
    expect(JSON.parse(serializeFullAssessmentJson(diagnosticRecord))).toEqual(built);
  });
  it("round-trips Case F OTHER text through reopen and canonical export",()=>{
    const diagnostic_profile: DiagnosticProfile={schema_version:"2.2.0-rc1",motivation:{question_id:"Q11",code:"SIDE_HUSTLE_STUCK",label:"已經開始副業，但發展不如預期"},current_status:{question_id:"Q12",code:"SIDE_HUSTLE_ACTIVE",label:"已經開始經營副業"},bottlenecks:{question_id:"Q13",applicable:true,selected:[{code:"OTHER",label:"其他"}],other_text:"不知道怎麼定價"}};
    const reopened={...record,diagnostic_profile} as CoachAssessmentDetail;
    const copied=JSON.parse(serializeFullAssessmentJson(reopened));
    const downloaded=JSON.parse(serializeFullAssessmentJson(reopened));
    expect(copied).toEqual(downloaded);
    expect(copied.diagnostic_profile.bottlenecks.other_text).toBe("不知道怎麼定價");
    expect(copied.questionnaire.answers.at(-1)).toEqual({id:"Q13",answer_codes:["OTHER"],other_text:"不知道怎麼定價"});
  });
  it("keeps existing business status separate from the new-route action stage",()=>{
    const diagnostic_profile = buildDiagnosticProfile({ motivationCode: "CAREER_EXIT", currentStatusV2: "READY_TO_TEST", bottleneckAnswers: [] });
    const built = buildCoachJsonExport({ ...record, business_status: "STABLE", diagnostic_profile } as CoachAssessmentDetail);
    expect(built.business_status.code).toBe("STABLE");
    expect(built.diagnostic_profile?.current_status.code).toBe("READY_TO_TEST");
    expect(built.diagnostic_profile?.diagnostic_stage).toBe("CAREER_TRANSITION_TESTING_READY");
    expect(built.diagnostic_profile?.legacy_current_status).toBeUndefined();
    expect(built.coach_summary).toEqual(expect.objectContaining({ business_status: "STABLE", action_stage: "READY_TO_TEST", diagnostic_stage: "CAREER_TRANSITION_TESTING_READY" }));
  });
  it("serializes one canonical snapshot with stable identity and versions",()=>{
    const built=buildCoachJsonExport(record);
    const parsed=JSON.parse(serializeFullAssessmentJson(record));
    expect(parsed).toEqual(built);
    expect(parsed.report_meta.report_id).toBe(record.report_id);
    expect(parsed.report_meta.scoring_version).toBe(record.scoring_version);
    expect(parsed.routing.system_route).toBe(scoring.route);
    expect(Object.keys(parsed.side_hustle_types.types)).toEqual(expect.arrayContaining(["SYSTEM_OPERATOR","CONTENT_INFLUENCER","CONSULTING_SERVICE","RELATIONSHIP_BUILDER","PROFESSIONAL_SKILL","CAPITAL_ALLOCATOR"]));
  });
  it("renormalizes available astrology weights and preserves full numerology profile",()=>{
    const result=buildCoachJsonExport(record);
    expect(result.astrology.data_completeness.normalized_weights).toEqual({sun:1});
    expect(result.astrology.data_completeness.excluded_points).toEqual(["moon","ascendant"]);
    expect(result.numerology).toEqual(expect.objectContaining({life_path_number:9,birthday_number:8,is_master_number:false}));
    expect(Object.keys(result.numerology.digit_counts)).toHaveLength(9);
  });
});

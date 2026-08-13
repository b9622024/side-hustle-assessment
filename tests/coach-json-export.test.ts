import { describe, expect, it } from "vitest";
import { buildCoachJsonExport, serializeFullAssessmentJson } from "../src/report/build-coach-export.js";
import { scoreAssessment } from "../src/scoring/engine.js";
import type { CoachAssessmentDetail } from "../src/lib/coach/data.js";

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

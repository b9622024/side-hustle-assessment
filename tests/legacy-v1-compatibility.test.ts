import { describe, expect, it } from "vitest";
import { buildCoachJsonExport } from "../src/report/build-coach-export.js";
import type { CoachAssessmentDetail } from "../src/lib/coach/data.js";
import type { ScoringResult } from "../src/scoring/types.js";

const legacySnapshot={
  dimensions:{A:1,C:4.666666666667,S:4.584415584416,I:1.551724137931,R:1,P:1.457142857143,K:1},
  behaviorTypes:{SYSTEM_OPERATOR:4.1,CONTENT_INFLUENCER:1.3,CONSULTING_SERVICE:1.4,RELATIONSHIP_BUILDER:1.2,PROFESSIONAL_SKILL:3.2,CAPITAL_ALLOCATOR:1.1},
  rankedTypes:[{type:"SYSTEM_OPERATOR",score:4.1},{type:"PROFESSIONAL_SKILL",score:3.2},{type:"CONSULTING_SERVICE",score:1.4},{type:"CONTENT_INFLUENCER",score:1.3},{type:"RELATIONSHIP_BUILDER",score:1.2},{type:"CAPITAL_ALLOCATOR",score:1.1}],
  typeState:"CLEAR",readiness:{score:4.925,level:"READY_HIGH"},businessFit:{score:4.286444315027,rawScore:2.9,level:"HIGH"},riskFlags:[],route:"B",consultationPriority:"MEDIUM",aiMarketingPotential:"MEDIUM",
  rawDimensions:{A:0,C:11,S:17.25,I:2,R:0,P:2,K:0},dimensionMax:{A:13.75,C:12,S:19.25,I:14.5,R:9.5,P:17.5,K:13.5},frictions:{},spectrums:{},strangerInteraction:{score:4.5,type:"CONTENT_ATTRACTION",label:"內容吸引型"},warnings:[],
} as unknown as ScoringResult;

const record={id:1,report_id:"SH-20260812-ABC123",display_name:"V1 測試者",birth_date:"1989-01-17",birth_time:null,birth_place:"台南市",business_status:"NONE",created_at:"2026-08-12T00:00:00.000Z",
  answers:{Q1:"A",Q2:"A",Q3:"D",Q4:"A",Q5:"D",Q6:"C",Q7:"A",Q8:"A",Q9:"C",Q10:"A"},astrology_profile:{sun:{sign:"摩羯座",element:"EARTH",modality:"CARDINAL"}},
  scoring_snapshot:legacySnapshot,scoring_version:"side-hustle-scoring-1.0.1",client_reports:[],
} as CoachAssessmentDetail;

describe("V1 snapshot compatibility",()=>{
  it("exports the original V1 result without recalculating or replacing it",()=>{
    const before=JSON.stringify(record.scoring_snapshot);
    const exported=buildCoachJsonExport(record);
    expect(exported.report_meta.scoring_version).toBe("side-hustle-scoring-1.0.1");
    expect(exported.report_meta.legacy_result_preserved).toBe(true);
    expect(exported.scoring_trace).toBeNull();
    expect(exported.behavior_profile.dimensions.A?.score).toBe(1);
    expect(exported.side_hustle_types.ranking[0]).toEqual({type:"SYSTEM_OPERATOR",score:4.1});
    expect(JSON.stringify(record.scoring_snapshot)).toBe(before);
  });
});

import {describe,expect,it} from "vitest";
import {QUESTION_IDS,scoreAssessment} from "../src/scoring/index.js";
import type {Answers,AssessmentInput} from "../src/scoring/index.js";

const run=(s:string,status:AssessmentInput["businessStatus"]="NONE")=>scoreAssessment({
  displayName:"Golden",birthDate:"1990-01-15",businessStatus:status,
  answers:Object.fromEntries(QUESTION_IDS.map((q,i)=>[q,s[i]])) as Answers
});

const golden=[
  {name:"系統輪廓",answers:"AADADCAACA",status:"NONE",dimensions:{A:1,C:4.666666666667,S:4.584415584416,I:1.551724137931,R:1,P:1.457142857143,K:1},readiness:4.925,businessFit:2.914502164502,route:"D",primary:"SYSTEM_OPERATOR"},
  {name:"內容輪廓",answers:"BBBBCBCBBB",status:"STABLE",dimensions:{A:4.127272727273,C:1.333333333333,S:1.623376623377,I:3.896551724138,R:2.263157894737,P:1.914285714286,K:1},readiness:4.325,businessFit:2.272114376851,route:"D",primary:"CONTENT_INFLUENCER"},
  {name:"資本輪廓",answers:"DDADDDCDDD",status:"NONE",dimensions:{A:2.236363636364,C:1.416666666667,S:2.246753246753,I:1,R:1.421052631579,P:2.2,K:4.407407407407},readiness:2.725,businessFit:1.919478241057,route:"D",primary:"CAPITAL_ALLOCATOR"},
  {name:"顧問輪廓",answers:"CACCCBACAC",status:"TRIED_NOT_ACTIVE",dimensions:{A:1.290909090909,C:2.333333333333,S:2.090909090909,I:1,R:4.157894736842,P:4.314285714286,K:1},readiness:4.575,businessFit:3.166195033037,route:"D",primary:"CONSULTING_SERVICE"}
] as const;

describe("Golden Profiles V1",()=>{
  it.each(golden)("固定 $name 的核心輸出",profile=>{
    const r=run(profile.answers,profile.status);
    expect(r.dimensions).toEqual(profile.dimensions);
    expect(r.readiness.score).toBe(profile.readiness);
    expect(r.businessFit.score).toBe(profile.businessFit);
    expect(r.route).toBe(profile.route);
    expect(r.rankedTypes[0]?.type).toBe(profile.primary);
  });
});

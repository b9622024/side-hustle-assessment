import {describe,expect,it} from "vitest";
import {QUESTION_IDS,calculateAstrologyTypes,calculateNumerologyTypes,scoreAssessment} from "../src/scoring/index.js";
import type {Answers,AssessmentInput} from "../src/scoring/index.js";

const run=(s:string,status:AssessmentInput["businessStatus"]="NONE")=>scoreAssessment({
  displayName:"Golden",birthDate:"1990-01-15",businessStatus:status,
  answers:Object.fromEntries(QUESTION_IDS.map((q,i)=>[q,s[i]])) as Answers
});

const golden=[
  {name:"系統輪廓",answers:"AADADCAACA",status:"NONE",dimensions:{A:1,C:4.666666666667,S:4.584415584416,I:1.551724137931,R:1,P:1.457142857143,K:1},readiness:4.925,businessFit:4.286444315027,route:"B",primary:"SYSTEM_OPERATOR"},
  {name:"內容輪廓",answers:"BBBBCBCBBB",status:"STABLE",dimensions:{A:4.127272727273,C:1.333333333333,S:1.623376623377,I:3.896551724138,R:2.263157894737,P:1.914285714286,K:1},readiness:4.325,businessFit:2.807192062917,route:"C",primary:"CONTENT_INFLUENCER"},
  {name:"資本輪廓",answers:"DDADDDCDDD",status:"NONE",dimensions:{A:2.236363636364,C:1.416666666667,S:2.246753246753,I:1,R:1.421052631579,P:2.2,K:4.407407407407},readiness:2.725,businessFit:1.995162618901,route:"D",primary:"CAPITAL_ALLOCATOR"},
  {name:"顧問輪廓",answers:"CACCCBACAC",status:"TRIED_NOT_ACTIVE",dimensions:{A:1.290909090909,C:2.333333333333,S:2.090909090909,I:1,R:4.157894736842,P:4.314285714286,K:1},readiness:4.575,businessFit:4.866027628685,route:"A",primary:"CONSULTING_SERVICE"}
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

const personality={astrology:calculateAstrologyTypes({sun:{element:"EARTH",modality:"CARDINAL"}}),numerology:calculateNumerologyTypes(9)};
const calibratedGolden=[
  {name:"A Route",answers:"AAAAABACAC",status:"NONE",businessFit:4.695916557799,readiness:4.65,route:"A",primary:"CONSULTING_SERVICE",primaryScore:3.168703007519},
  {name:"B Route",answers:"AAAAAAAABB",status:"NONE",businessFit:3.954480348794,readiness:4.85,route:"B",primary:"SYSTEM_OPERATOR",primaryScore:3.217646103896},
  {name:"C Route",answers:"AAAAAAAAAA",status:"ACTIVE",businessFit:4.801179439555,readiness:4.925,route:"C",primary:"SYSTEM_OPERATOR",primaryScore:3.416834415584},
  {name:"D Route",answers:"ADAAAADAAA",status:"NONE",businessFit:4.062707569294,readiness:3.175,route:"D",primary:"SYSTEM_OPERATOR",primaryScore:3.035795454545},
] as const;

describe("Calibrated Golden Profiles V1.0.1",()=>{
  it.each(calibratedGolden)("固定 $name 的人格合併與 Routing",profile=>{
    const r=scoreAssessment({displayName:"Golden",birthDate:"1989-01-17",businessStatus:profile.status,answers:Object.fromEntries(QUESTION_IDS.map((q,i)=>[q,profile.answers[i]])) as Answers},personality);
    expect(r.finalTypes).toBeDefined();
    expect(r.businessFit.score).toBe(profile.businessFit);
    expect(r.readiness.score).toBe(profile.readiness);
    expect(r.route).toBe(profile.route);
    expect(r.rankedTypes[0]).toEqual({type:profile.primary,score:profile.primaryScore});
  });
});

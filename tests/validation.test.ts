import { describe, expect, it } from "vitest";
import { CONFIG_GAPS, DIMENSIONS, QUESTION_IDS, SIDE_HUSTLE_TYPES, calculateAstrologyTypes, calculateLifePath, calculateNumerologyTypes, config, mergeFinalTypes, scoreAssessment, scoreBehaviorDimensions, validateInput } from "../src/scoring/index.js";
import type { Answers, AssessmentInput, Option } from "../src/scoring/index.js";

const answers=(values:string):Answers=>Object.fromEntries(QUESTION_IDS.map((q,i)=>[q,values[i]])) as Answers;
const input=(values:string,status:AssessmentInput["businessStatus"]="NONE",birthDate="1990-01-15"):AssessmentInput=>({displayName:"測試者",birthDate,businessStatus:status,answers:answers(values)});

const syntheticCases:[string,AssessmentInput][]=[
  ["明顯系統型",input("AADA DCAACA".replaceAll(" ",""))],
  ["明顯內容型",input("BBBBCBCBBB")],
  ["明顯顧問型",input("CACCCBACAC")],
  ["明顯關係型",input("CACCCAAACA")],
  ["明顯技能型",input("CADCADACCC")],
  ["明顯資本型",input("DDADDDCDDD")],
  ["混合型",input("ABCABCBACA")],
  ["探索型",input("DCABCDABCD")],
  ["現有事業系統型",input("AADA DCAACA".replaceAll(" ",""),"ACTIVE")],
  ["現有穩定事業內容型",input("BBBBCBCBBB","STABLE")],
  ["曾嘗試顧問型",input("CACCCBACAC","TRIED_NOT_ACTIVE")],
  ["無出生時間",input("AAAAAAAAAA")],
  ["生命靈數11出生日期",input("ABCDABCDAB","NONE","1990-01-01")],
  ["生命靈數22出生日期",input("BCDABCDABC","NONE","2000-01-20")],
  ["生命靈數33出生日期",input("CDABCDABCD","NONE","1995-09-09")],
  ["F1",input("ADAAAAAAAA")],
  ["F2",input("AAAAADAAAA")],
  ["F3",input("AAAAAADAAA")],
  ["F4",input("AAAAAAADAA")],
  ["High Flags >= 2",input("ADAAAADAAA")],
];

describe("Scoring Config audit",()=>{
  it("uses the calibrated V1.0.1 versions while retaining V1.0.0 as base",()=>{
    expect(config.meta.config_version).toBe("side-hustle-scoring-config-1.0.1");
    expect(config.meta.scoring_engine_version).toBe("side-hustle-scoring-1.0.1");
    expect(config.meta.base_config_version).toBe("side-hustle-scoring-config-1.0.0");
  });
  it("has ten questions and four options per question",()=>{
    expect(config.questionnaire.map(q=>q.id)).toEqual([...QUESTION_IDS]);
    config.questionnaire.forEach(q=>expect(Object.keys(q.options).sort()).toEqual(["A","B","C","D"]));
  });
  it("derives the documented dynamic maxima",()=>{
    const result=scoreBehaviorDimensions(answers("AAAAAAAAAA"));
    expect(result.maximum).toEqual(config.dimension_normalization.computed_max_raw_v1);
  });
  it("all configured weights sum to one",()=>{
    const total=(x:Record<string,number>)=>Object.values(x).reduce((a,b)=>a+b,0);
    Object.values(config.type_formulas).forEach(f=>expect(total(f.weights)).toBeCloseTo(1,12));
    expect(total(Object.fromEntries(Object.entries(config.readiness.components).map(([k,v])=>[k,v.weight])))).toBeCloseTo(1,12);
    expect(total(config.business_fit.weights)).toBeCloseTo(1,12);
    Object.entries(config.frictions).filter(([k])=>k!=="normalization_helpers").forEach(([,v])=>expect(total((v as any).formula_weights)).toBeCloseTo(1,12));
    Object.values(config.execution_spectrums).forEach(v=>expect(total(v.formula_weights)).toBeCloseTo(1,12));
  });
  it("provides complete personality matrices and preserves the behavior guardrail",()=>{
    expect(CONFIG_GAPS).toEqual({astrologyTypeMatrix:false,numerologyTypeMatrix:false});
    const behavior=scoreAssessment(input("AAAAAAAAAA")).behaviorTypes;
    const personality={astrology:calculateAstrologyTypes({sun:{element:"FIRE",modality:"CARDINAL"}}),numerology:calculateNumerologyTypes(11)};
    const final=mergeFinalTypes(behavior,personality);
    SIDE_HUSTLE_TYPES.forEach(type=>{
      expect(final[type]).toBeGreaterThanOrEqual(1);
      expect(final[type]).toBeLessThanOrEqual(5);
      if(behavior[type]<3) expect(final[type]).toBeLessThanOrEqual(3.4);
    });
  });
  it("renormalizes astrology weights when birth time components are unavailable",()=>{
    const sunOnly=calculateAstrologyTypes({sun:{element:"EARTH",modality:"CARDINAL"}});
    expect(sunOnly.SYSTEM_OPERATOR).toBe(4.5);
  });
  it("retains master life-path numbers",()=>{
    expect(calculateLifePath("1990-01-01")).toBe(3);
    expect(calculateLifePath("2000-01-08")).toBe(11);
    expect(calculateLifePath("2000-09-29")).toBe(22);
    expect(calculateLifePath("1989-01-14")).toBe(33);
  });
});

describe("20 synthetic profiles",()=>{
  it.each(syntheticCases)("%s remains within every score range",(_name,profile)=>{
    const result=scoreAssessment(profile);
    expect(Object.values(result.dimensions)).toHaveLength(7);
    Object.values(result.dimensions).forEach(v=>expect(v).toBeGreaterThanOrEqual(1));
    Object.values(result.dimensions).forEach(v=>expect(v).toBeLessThanOrEqual(5));
    expect(Object.keys(result.behaviorTypes).sort()).toEqual([...SIDE_HUSTLE_TYPES].sort());
    Object.values(result.behaviorTypes).forEach(v=>expect(v).toBeGreaterThanOrEqual(1));
    Object.values(result.behaviorTypes).forEach(v=>expect(v).toBeLessThanOrEqual(5));
    Object.values(result.frictions).forEach(v=>expect(v).toBeGreaterThanOrEqual(0));
    Object.values(result.frictions).forEach(v=>expect(v).toBeLessThanOrEqual(10));
    Object.values(result.spectrums).forEach(v=>expect(v).toBeGreaterThanOrEqual(0));
    Object.values(result.spectrums).forEach(v=>expect(v).toBeLessThanOrEqual(10));
    expect(result.readiness.score).toBeGreaterThanOrEqual(1);
    expect(result.readiness.score).toBeLessThanOrEqual(5);
    expect(result.businessFit.score).toBeGreaterThanOrEqual(1);
    expect(result.businessFit.score).toBeLessThanOrEqual(5);
    expect(["A","B","C","D"]).toContain(result.route);
    expect(result.rankedTypes).toHaveLength(6);
  });
});

describe("risk flags and input validation",()=>{
  it.each([["F1","ADAAAAAAAA"],["F2","AAAAADAAAA"],["F3","AAAAAADAAA"],["F4","AAAAAAADAA"]])("detects %s",(id,values)=>{
    expect(scoreAssessment(input(values)).riskFlags.map(f=>f.id)).toContain(id);
  });
  it("two HIGH flags force route D",()=>{
    const result=scoreAssessment(input("ADAAAADAAA"));
    expect(result.riskFlags.filter(f=>f.severity==="HIGH")).toHaveLength(2);
    expect(result.route).toBe("D");
  });
  it("rejects missing answers",()=>{
    const invalid=input("AAAAAAAAAA");
    delete (invalid.answers as Partial<Answers>).Q10;
    expect(()=>validateInput(invalid)).toThrow("INVALID_OR_MISSING_ANSWER:Q10");
  });
  it("rejects malformed dates and times",()=>{
    expect(()=>validateInput({...input("AAAAAAAAAA"),birthDate:"not-a-date"})).toThrow("INVALID_BIRTH_DATE");
    expect(()=>validateInput({...input("AAAAAAAAAA"),birthTime:"25:90"})).toThrow("INVALID_BIRTH_TIME");
  });
});

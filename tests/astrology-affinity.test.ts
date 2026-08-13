import {describe,expect,it} from "vitest";
import {calculateBasicAstrologyProfile} from "../src/astrology/basic-profile";
import {calculateAssessmentScoring} from "../src/report/build-client-report";
import type {AssessmentInput} from "../src/scoring/types";

const assessment:AssessmentInput={displayName:"Astrology isolation",birthDate:"1989-01-17",birthTime:"11:45",birthPlace:"台南市",businessStatus:"NONE",answers:{Q1:"C",Q2:"A",Q3:"C",Q4:"C",Q5:"C",Q6:"B",Q7:"A",Q8:"C",Q9:"A",Q10:"C"}};

describe("Astrology V2.1 affinity isolation",()=>{
  it("changes only report astrology fields for identical answers",()=>{
    const first=calculateAssessmentScoring(assessment,calculateBasicAstrologyProfile("1989-01-17","11:45","台南市"));
    const second=calculateAssessmentScoring(assessment,calculateBasicAstrologyProfile("1990-04-10","22:01","台北市"));
    expect(second.formalBehaviorDimensions).toEqual(first.formalBehaviorDimensions);
    expect(second.finalTypes).toEqual(first.finalTypes);
    expect(second.readiness).toEqual(first.readiness);
    expect(second.businessFit).toEqual(first.businessFit);
    expect(second.route).toBe(first.route);
    expect(second.astrologyReport?.types).not.toEqual(first.astrologyReport?.types);
  });

  it("bounds every modifier to ±0.25 and every final report score to 1–5",()=>{
    const result=calculateAssessmentScoring(assessment,calculateBasicAstrologyProfile("1989-01-17","11:45","台南市"));
    for(const item of Object.values(result.astrologyReport!.types)) {
      expect(item.astrology_type_affinity).toBeGreaterThanOrEqual(-1);
      expect(item.astrology_type_affinity).toBeLessThanOrEqual(1);
      expect(Math.abs(item.astrology_modifier)).toBeLessThanOrEqual(.25);
      expect(item.final_report_type_score).toBeGreaterThanOrEqual(1);
      expect(item.final_report_type_score).toBeLessThanOrEqual(5);
    }
  });

  it("uses Sun at 100% when Moon and Ascendant are unavailable",()=>{
    const result=calculateAssessmentScoring(assessment,calculateBasicAstrologyProfile("1989-01-17"));
    expect(result.astrologyReport?.normalized_point_weights).toEqual({sun:1});
  });
});

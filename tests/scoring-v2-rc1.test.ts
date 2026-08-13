import { describe, expect, it } from "vitest";
import { config } from "../src/scoring/config.js";
import { DIMENSIONS, SIDE_HUSTLE_TYPES } from "../src/scoring/types.js";
import type { Answers, AssessmentInput, BusinessStatus } from "../src/scoring/types.js";
import { scoreAssessment } from "../src/scoring/engine.js";

function input(answers:Answers,businessStatus:BusinessStatus="NONE",birthDate="1989-01-17"):AssessmentInput {
  return {displayName:"RC1 Test",birthDate,birthTime:"11:45",birthPlace:"台南市",businessStatus,answers};
}
function repeated(option:"A"|"B"|"C"|"D") {
  return Object.fromEntries(Array.from({length:10},(_,i)=>[`Q${i+1}`,option])) as Answers;
}

describe("Scoring Engine V2 RC1 FULL CONFIG",()=>{
  for (const golden of config.golden_cases) {
    it(`${golden.id} ${golden.label}`,()=>{
      const result=scoreAssessment(input(golden.input.answers as Answers,golden.input.business_status as BusinessStatus));
      expect(result.rankedTypes[0]?.type).toBe(golden.expected.primary_type);
      expect(result.rankedTypes[1]?.type).toBe(golden.expected.secondary_type);
      expect(result.typeState).toBe(golden.expected.type_state);
      expect(result.route).toBe(golden.expected.system_route);
      expect(result.readiness.score).toBeCloseTo(golden.expected.readiness,9);
      expect(result.businessFit.score).toBeCloseTo(golden.expected.routing_business_fit,6);
      for (const type of SIDE_HUSTLE_TYPES) expect(result.finalTypes[type]).toBeCloseTo(golden.expected.type_scores[type],5);
      for (const id of ["F1","F2","F3","F4"] as const) expect(result.riskFlags.some(flag=>flag.id===id)).toBe(golden.expected.risk_flags[id]);
    });
  }

  for (const option of ["A","B","C","D"] as const) {
    it(`extreme ${option.repeat(10)} stays in range and produces one route`,()=>{
      const result=scoreAssessment(input(repeated(option)));
      for (const dimension of DIMENSIONS) {
        expect(result.formalBehaviorDimensions[dimension]).toBeGreaterThanOrEqual(1);
        expect(result.formalBehaviorDimensions[dimension]).toBeLessThanOrEqual(5);
        expect(result.routingDimensions[dimension]).toBeGreaterThanOrEqual(1);
        expect(result.routingDimensions[dimension]).toBeLessThanOrEqual(5);
      }
      for (const type of SIDE_HUSTLE_TYPES) {
        expect(result.finalTypes[type]).toBeGreaterThanOrEqual(1);
        expect(result.finalTypes[type]).toBeLessThanOrEqual(5);
      }
      expect(result.readiness.score).toBeGreaterThanOrEqual(1);
      expect(result.readiness.score).toBeLessThanOrEqual(5);
      expect(result.businessFit.score).toBeGreaterThanOrEqual(1);
      expect(result.businessFit.score).toBeLessThanOrEqual(5);
      expect(["A","B","C","D"]).toContain(result.route);
      expect(result.scoringTrace.system_route).toBe(result.route);
    });
  }

  it("birth profile is isolated from every core score and route",()=>{
    const answers=config.golden_cases[2]!.input.answers as Answers;
    const first=scoreAssessment(input(answers,"NONE","1989-01-17"));
    const second=scoreAssessment(input(answers,"NONE","2000-12-31"));
    expect(second.formalBehaviorDimensions).toEqual(first.formalBehaviorDimensions);
    expect(second.finalTypes).toEqual(first.finalTypes);
    expect(second.readiness).toEqual(first.readiness);
    expect(second.businessFit).toEqual(first.businessFit);
    expect(second.route).toBe(first.route);
  });

  it("keeps formal and routing Q9/Q10 weights separate",()=>{
    const result=scoreAssessment(input(config.golden_cases[0]!.input.answers as Answers));
    expect(result.scoringTrace.formal_question_weights.Q4).toBe(1.25);
    expect(result.scoringTrace.formal_question_weights.Q9).toBe(1.25);
    expect(result.scoringTrace.formal_question_weights.Q10).toBe(1.25);
    expect(result.scoringTrace.routing_question_weights.Q4).toBe(1.25);
    expect(result.scoringTrace.routing_question_weights.Q9).toBe(1);
    expect(result.scoringTrace.routing_question_weights.Q10).toBe(1);
  });
});

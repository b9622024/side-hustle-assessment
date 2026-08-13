import { describe, expect, it } from "vitest";
import { scoreAssessment } from "../src/scoring/engine";
import { config } from "../src/scoring/config";
import type { Answers } from "../src/scoring/types";

function answers(value: "A"|"B"|"C"|"D"): Answers {
  return Object.fromEntries(config.questionnaire.map(question=>[question.id,value])) as Answers;
}
const input=(value:"A"|"B"|"C"|"D")=>({displayName:"Test",birthDate:"1989-01-17",answers:answers(value),businessStatus:"NONE" as const});

describe("V2.1 type percentile presentation layer",()=>{
  for(const answer of ["A","B","C","D"] as const) it(`keeps ${answer.repeat(10)} within display ranges without changing formal scores`,()=>{
    const result=scoreAssessment(input(answer));
    for(const [type,display] of Object.entries(result.typeDisplayScores)) {
      expect(display.formal_type_score).toBeCloseTo(result.finalTypes![type as keyof typeof result.finalTypes],10);
      expect(display.type_percentile).toBeGreaterThanOrEqual(0);
      expect(display.type_percentile).toBeLessThanOrEqual(1);
      expect(display.display_fit_index).toBeGreaterThanOrEqual(0);
      expect(display.display_fit_index).toBeLessThanOrEqual(10);
    }
  });

  it("is display-only and leaves routing inputs unchanged",()=>{
    const result=scoreAssessment(input("A"));
    expect(result.scoringTrace.type_percentile).toBeDefined();
    expect(result.scoringTrace.display_fit_index).toBeDefined();
    expect(result.route).toBe(result.scoringTrace.system_route);
  });
});

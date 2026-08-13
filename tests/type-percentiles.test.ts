import {describe,expect,it} from "vitest";
import meta from "../src/scoring/config/type-percentile-reference-v1/meta.json" with {type:"json"};
import {config} from "../src/scoring/config";
import {scoreAssessment} from "../src/scoring/engine";
import {SIDE_HUSTLE_TYPES,type Answers,type BusinessStatus} from "../src/scoring/types";
import {loadTypeReference,TYPE_PERCENTILE_METHOD,TYPE_PERCENTILE_REFERENCE_VERSION,typePercentile} from "../src/scoring/type-percentiles";

const input=(answers:Answers,businessStatus:BusinessStatus)=>({displayName:"Phase 2",birthDate:"1989-01-17",businessStatus,answers});

describe("Phase 2 theoretical empirical CDF",()=>{
  it("contains six independent, complete 4^10 distributions",()=>{
    expect(meta.version).toBe(TYPE_PERCENTILE_REFERENCE_VERSION);
    expect(meta.method).toBe(TYPE_PERCENTILE_METHOD);
    for(const type of SIDE_HUSTLE_TYPES) {
      const distribution=loadTypeReference(type);
      expect(distribution.total).toBe(4**10);
      expect(distribution.scores).toHaveLength(distribution.unique_scores);
      expect(distribution.cumulative_counts.at(-1)).toBe(4**10);
    }
  });

  it("uses right-continuous <= tie handling with full precision",()=>{
    for(const type of SIDE_HUSTLE_TYPES) {
      const distribution=loadTypeReference(type);
      const index=Math.floor(distribution.scores.length/2);
      expect(typePercentile(type,distribution.scores[index]!)).toBe(distribution.cumulative_counts[index]!/(4**10));
    }
  });

  for(const golden of config.golden_cases.slice(0,10)) it(`${golden.id} preserves formal RC1 and adds display-only values`,()=>{
    const result=scoreAssessment(input(golden.input.answers as Answers,golden.input.business_status as BusinessStatus));
    expect(result.rankedTypes[0]?.type).toBe(golden.expected.primary_type);
    expect(result.rankedTypes[1]?.type).toBe(golden.expected.secondary_type);
    expect(result.typeState).toBe(golden.expected.type_state);
    expect(result.route).toBe(golden.expected.system_route);
    expect(result.readiness.score).toBeCloseTo(golden.expected.readiness,9);
    expect(result.businessFit.score).toBeCloseTo(golden.expected.routing_business_fit,5);
    expect(result.scoringTrace.type_percentile_method).toBe(TYPE_PERCENTILE_METHOD);
    expect(result.scoringTrace.type_percentile_reference_version).toBe(TYPE_PERCENTILE_REFERENCE_VERSION);
    for(const type of SIDE_HUSTLE_TYPES) {
      expect(result.finalTypes[type]).toBeCloseTo(golden.expected.type_scores[type],5);
      expect(result.typeDisplayScores[type].formal_type_score).toBe(result.finalTypes[type]);
      expect(result.typeDisplayScores[type].type_percentile).toBeGreaterThanOrEqual(0);
      expect(result.typeDisplayScores[type].type_percentile).toBeLessThanOrEqual(1);
      expect(result.typeDisplayScores[type].display_fit_index).toBeGreaterThanOrEqual(0);
      expect(result.typeDisplayScores[type].display_fit_index).toBeLessThanOrEqual(10);
    }
  });
});

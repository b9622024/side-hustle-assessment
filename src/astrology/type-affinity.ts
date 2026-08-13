import type { AstrologyProfile } from "../report/types";
import { SIDE_HUSTLE_TYPES, type AstrologyElement, type AstrologyModality, type ScoringResult, type SideHustleType } from "../scoring/types";

const ELEMENT:Record<SideHustleType,Record<AstrologyElement,number>>={
  SYSTEM_OPERATOR:{FIRE:.1,EARTH:.8,AIR:.4,WATER:-.2},CONTENT_INFLUENCER:{FIRE:.9,EARTH:-.3,AIR:.8,WATER:.3},
  CONSULTING_SERVICE:{FIRE:.2,EARTH:.6,AIR:.7,WATER:.3},RELATIONSHIP_BUILDER:{FIRE:.2,EARTH:.1,AIR:.5,WATER:.9},
  PROFESSIONAL_SKILL:{FIRE:.2,EARTH:.8,AIR:.5,WATER:.1},CAPITAL_ALLOCATOR:{FIRE:.4,EARTH:.9,AIR:.2,WATER:-.4},
};
const MODALITY:Record<SideHustleType,Record<AstrologyModality,number>>={
  SYSTEM_OPERATOR:{CARDINAL:.5,FIXED:.8,MUTABLE:-.2},CONTENT_INFLUENCER:{CARDINAL:.5,FIXED:.2,MUTABLE:.8},
  CONSULTING_SERVICE:{CARDINAL:.6,FIXED:.3,MUTABLE:.5},RELATIONSHIP_BUILDER:{CARDINAL:.4,FIXED:.5,MUTABLE:.6},
  PROFESSIONAL_SKILL:{CARDINAL:.3,FIXED:.8,MUTABLE:.4},CAPITAL_ALLOCATOR:{CARDINAL:.6,FIXED:.7,MUTABLE:-.2},
};
const BASE_WEIGHTS={sun:.4,moon:.35,ascendant:.25} as const;

const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));

export function astrologyTypeLayer(scoring:ScoringResult,profile:AstrologyProfile) {
  const available=(Object.keys(BASE_WEIGHTS) as Array<keyof typeof BASE_WEIGHTS>).filter(key=>profile[key]);
  const total=available.reduce((sum,key)=>sum+BASE_WEIGHTS[key],0);
  const normalizedWeights=Object.fromEntries(available.map(key=>[key,BASE_WEIGHTS[key]/total])) as Partial<Record<keyof typeof BASE_WEIGHTS,number>>;
  const types=Object.fromEntries(SIDE_HUSTLE_TYPES.map(type=>{
    const affinity=available.reduce((sum,key)=>{
      const point=profile[key]!;
      return sum+(normalizedWeights[key]??0)*(ELEMENT[type][point.element]*.65+MODALITY[type][point.modality]*.35);
    },0);
    const bounded=clamp(affinity,-1,1);
    const modifier=bounded*.25;
    return [type,{formal_type_score:scoring.finalTypes[type],astrology_type_affinity:Number(bounded.toFixed(6)),astrology_modifier:Number(modifier.toFixed(6)),final_report_type_score:Number(clamp(scoring.finalTypes[type]+modifier,1,5).toFixed(6))}];
  })) as Record<SideHustleType,{formal_type_score:number;astrology_type_affinity:number;astrology_modifier:number;final_report_type_score:number}>;
  const formal=scoring.rankedTypes.map(item=>item.type);
  const report=SIDE_HUSTLE_TYPES.toSorted((a,b)=>types[b].final_report_type_score-types[a].final_report_type_score);
  return {types,normalized_point_weights:normalizedWeights,formal_primary_type:formal[0]!,formal_secondary_type:formal[1]!,report_primary_type:report[0]!,report_secondary_type:report[1]!,astrology_rank_adjustment:formal[0]!==report[0]||formal[1]!==report[1]};
}

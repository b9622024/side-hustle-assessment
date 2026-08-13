import { mkdirSync, writeFileSync } from "node:fs";
import { config } from "../src/scoring/config.js";
import { DIMENSIONS, QUESTION_IDS, SIDE_HUSTLE_TYPES } from "../src/scoring/types.js";
import type { Dimension, Option, SideHustleType } from "../src/scoring/types.js";

const counts=Object.fromEntries(SIDE_HUSTLE_TYPES.map(type=>[type,new Map<number,number>()])) as Record<SideHustleType,Map<number,number>>;
const clamp=(value:number)=>Math.min(5,Math.max(1,value));

for(let encoded=0;encoded<4**10;encoded++){
  let cursor=encoded;
  const raw=Object.fromEntries(DIMENSIONS.map(d=>[d,0])) as Record<Dimension,number>;
  for(let index=9;index>=0;index--){
    const option="ABCD"[cursor&3] as Option; cursor>>=2;
    const question=config.questionnaire[index]!;
    for(const dimension of DIMENSIONS) raw[dimension]+=question.options[option].dimensions[dimension]*question.weight;
  }
  const formal=Object.fromEntries(DIMENSIONS.map(d=>{
    const maximum=config.formal_behavior_dimension_scoring.v1_normalization.computed_max_raw[d];
    const v1=1+4*raw[d]/maximum;
    const p=config.formal_behavior_dimension_scoring.v2_calibration.parameters[d];
    return [d,clamp(3+(v1-p.reference_mean)*p.scale)];
  })) as Record<Dimension,number>;
  for(const type of SIDE_HUSTLE_TYPES){
    const weights=config.formal_type_engine.type_formulas[type].weights as Partial<Record<Dimension,number>>;
    const pre=Object.entries(weights).reduce((total,[d,w])=>total+formal[d as Dimension]*(w as number),0);
    const p=config.formal_type_engine.calibration.parameters[type];
    const score=Number(clamp(3+(pre-p.reference_mean)*p.scale).toFixed(12));
    counts[type].set(score,(counts[type].get(score)??0)+1);
  }
}

const total=4**10;
const distributions=Object.fromEntries(SIDE_HUSTLE_TYPES.map(type=>{
  const ordered=[...counts[type]].sort(([a],[b])=>a-b);
  const quantiles:number[]=[];
  let cumulative=0,index=0;
  for(let step=0;step<=1000;step++){
    const target=Math.max(1,Math.ceil(total*step/1000));
    while(index<ordered.length-1&&cumulative+ordered[index]![1]<target){cumulative+=ordered[index]![1];index++;}
    quantiles.push(ordered[index]![0]);
  }
  return [type,{total,unique_scores:ordered.length,percentile_definition:"empirical_cdf_from_complete_space",quantile_resolution:0.001,quantiles}];
}));

mkdirSync("src/scoring/config",{recursive:true});
writeFileSync("src/scoring/config/side-hustle-type-percentiles-v2.1.json",JSON.stringify({
  meta:{version:"side-hustle-type-percentiles-v2.1",source_scoring_version:"side-hustle-scoring-v2-rc1",response_space:total,generated_from:"complete_4^10_answer_space"},
  distributions,
},null,2)+"\n");

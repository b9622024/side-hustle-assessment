import { mkdirSync, writeFileSync } from "node:fs";
import { config } from "../src/scoring/config.js";
import { DIMENSIONS, SIDE_HUSTLE_TYPES } from "../src/scoring/types.js";
import type { Dimension, Option, SideHustleType } from "../src/scoring/types.js";

const TOTAL=4**10;
const VERSION="side-hustle-v2-rc1-theoretical-reference-1.0.0";
const counts=Object.fromEntries(SIDE_HUSTLE_TYPES.map(type=>[type,new Map<number,number>()])) as Record<SideHustleType,Map<number,number>>;
const clamp=(value:number)=>Math.min(5,Math.max(1,value));
const round=(value:number)=>Number(value.toFixed(12));

for(let encoded=0;encoded<TOTAL;encoded++) {
  let cursor=encoded;
  const raw=Object.fromEntries(DIMENSIONS.map(d=>[d,0])) as Record<Dimension,number>;
  for(let index=9;index>=0;index--) {
    const option="ABCD"[cursor&3] as Option;
    cursor>>=2;
    const question=config.questionnaire[index]!;
    for(const dimension of DIMENSIONS) raw[dimension]+=question.options[option].dimensions[dimension]*question.weight;
  }
  const formal=Object.fromEntries(DIMENSIONS.map(d=>{
    const maximum=config.formal_behavior_dimension_scoring.v1_normalization.computed_max_raw[d];
    const v1=round(1+4*raw[d]/maximum);
    const p=config.formal_behavior_dimension_scoring.v2_calibration.parameters[d];
    return [d,round(clamp(3+(v1-p.reference_mean)*p.scale))];
  })) as Record<Dimension,number>;
  for(const type of SIDE_HUSTLE_TYPES) {
    const weights=config.formal_type_engine.type_formulas[type].weights as Partial<Record<Dimension,number>>;
    const precalibrated=Object.entries(weights).reduce((sum,[d,w])=>sum+formal[d as Dimension]*(w as number),0);
    const p=config.formal_type_engine.calibration.parameters[type];
    const score=round(clamp(3+(precalibrated-p.reference_mean)*p.scale));
    counts[type].set(score,(counts[type].get(score)??0)+1);
  }
}

const distributions=Object.fromEntries(SIDE_HUSTLE_TYPES.map(type=>{
  const ordered=[...counts[type]].sort(([a],[b])=>a-b);
  let cumulative=0;
  const scores:number[]=[];
  const cumulative_counts:number[]=[];
  for(const [score,count] of ordered) {scores.push(score);cumulative+=count;cumulative_counts.push(cumulative);}
  if(cumulative!==TOTAL) throw new Error(`${type}: invalid total ${cumulative}`);
  return [type,{total:TOTAL,unique_scores:scores.length,scores,cumulative_counts}];
}));

const directory="src/scoring/config/type-percentile-reference-v1";
mkdirSync(directory,{recursive:true});
const encoded=Object.fromEntries(SIDE_HUSTLE_TYPES.map(type=>{
  const source=distributions[type];let previous=0;const bytes:number[]=[];
  const varint=(value:number)=>{while(value>=128){bytes.push((value&127)|128);value=Math.floor(value/128);}bytes.push(value);};
  for(let index=0;index<source.scores.length;index++) {const score=Math.round(source.scores[index]!*1e12);varint(score-previous);previous=score;varint(source.cumulative_counts[index]!-(source.cumulative_counts[index-1]??0));}
  return [type,Buffer.from(bytes).toString("base64")];
}));
for(const type of SIDE_HUSTLE_TYPES) writeFileSync(`${directory}/${type}.ts`,`export default ${JSON.stringify(encoded[type])} as const;\n`);
writeFileSync(`${directory}/meta.json`,JSON.stringify({version:VERSION,source_scoring_version:config.meta.config_version,response_space:TOTAL,method:"empirical_cdf_theoretical_4pow10",tie_strategy:"right_continuous_count_less_than_or_equal",generated_from:"complete_4^10_answer_space"}));

import meta from "../src/scoring/config/type-percentile-reference-v1/meta.json" with {type:"json"};
import {config} from "../src/scoring/config.js";
import {scoreAssessment} from "../src/scoring/engine.js";
import {SIDE_HUSTLE_TYPES,type Answers,type BusinessStatus} from "../src/scoring/types.js";
import {loadTypeReference} from "../src/scoring/type-percentiles.js";

const golden=config.golden_cases.slice(0,10).map(item=>{
  const result=scoreAssessment({displayName:item.id,birthDate:"1989-01-17",businessStatus:item.input.business_status as BusinessStatus,answers:item.input.answers as Answers});
  return {id:item.id,label:item.label,answers:item.input.answers,formal_type_final:result.finalTypes,type_percentile:Object.fromEntries(SIDE_HUSTLE_TYPES.map(type=>[type,result.typeDisplayScores[type].type_percentile])),display_fit_index:Object.fromEntries(SIDE_HUSTLE_TYPES.map(type=>[type,result.typeDisplayScores[type].display_fit_index])),formal_primary:result.rankedTypes[0]?.type,formal_secondary:result.rankedTypes[1]?.type,type_state:result.typeState};
});

const targets=[0,.05,.25,.5,.75,.95,1];
const distribution=Object.fromEntries(SIDE_HUSTLE_TYPES.map(type=>{
  const source=loadTypeReference(type);
  const values=targets.map(target=>{
    const ordinal=Math.max(1,Math.ceil(source.total*target));
    let low=0,high=source.cumulative_counts.length;
    while(low<high){const middle=(low+high)>>1;if(source.cumulative_counts[middle]!<ordinal)low=middle+1;else high=middle;}
    return source.cumulative_counts[low]!/source.total;
  });
  return [type,Object.fromEntries(["min","P5","P25","median","P75","P95","max"].map((key,index)=>[key,values[index]]))];
}));
console.log(JSON.stringify({reference_meta:meta,golden_cases:golden,percentile_distribution:distribution},null,2));

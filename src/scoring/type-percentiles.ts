import source from "./config/side-hustle-type-percentiles-v2.1.json" with {type:"json"};
import type { ScoreMap, SideHustleType } from "./types";

export interface TypeDisplayScore {formal_type_score:number;type_percentile:number;display_fit_index:number}
export function typePercentile(type:SideHustleType,score:number){
  const quantiles=source.distributions[type].quantiles;
  let low=0,high=quantiles.length;
  while(low<high){const mid=(low+high)>>1;if(quantiles[mid]!<=score)low=mid+1;else high=mid;}
  return Math.min(1,Math.max(0,(low-1)/1000));
}
export function buildTypeDisplayScores(scores:ScoreMap<SideHustleType>):Record<SideHustleType,TypeDisplayScore>{
  return Object.fromEntries(Object.entries(scores).map(([type,score])=>{const percentile=typePercentile(type as SideHustleType,score);return [type,{formal_type_score:score,type_percentile:percentile,display_fit_index:Number((percentile*10).toFixed(1))}];})) as Record<SideHustleType,TypeDisplayScore>;
}

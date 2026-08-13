import system from "./config/type-percentile-reference-v1/SYSTEM_OPERATOR";
import content from "./config/type-percentile-reference-v1/CONTENT_INFLUENCER";
import consulting from "./config/type-percentile-reference-v1/CONSULTING_SERVICE";
import relationship from "./config/type-percentile-reference-v1/RELATIONSHIP_BUILDER";
import professional from "./config/type-percentile-reference-v1/PROFESSIONAL_SKILL";
import capital from "./config/type-percentile-reference-v1/CAPITAL_ALLOCATOR";
import type { ScoreMap, SideHustleType } from "./types";

export const TYPE_PERCENTILE_METHOD="empirical_cdf_theoretical_4pow10" as const;
export const TYPE_PERCENTILE_REFERENCE_VERSION="side-hustle-v2-rc1-theoretical-reference-1.0.0" as const;
export interface TypeDisplayScore {formal_type_score:number;type_percentile:number;display_fit_index:number}
interface Distribution {total:number;unique_scores:number;scores:number[];cumulative_counts:number[]}
const cache=new Map<SideHustleType,Distribution>();
const encodedTypeReferences={SYSTEM_OPERATOR:system,CONTENT_INFLUENCER:content,CONSULTING_SERVICE:consulting,RELATIONSHIP_BUILDER:relationship,PROFESSIONAL_SKILL:professional,CAPITAL_ALLOCATOR:capital};
export function loadTypeReference(type:SideHustleType):Distribution {
  const existing=cache.get(type);if(existing)return existing;
  const binary=atob(encodedTypeReferences[type]);const bytes=Uint8Array.from(binary,character=>character.charCodeAt(0));let offset=0,score=0,cumulative=0;
  const varint=()=>{let value=0,multiplier=1;while(true){const byte=bytes[offset++]!;value+=(byte&127)*multiplier;if((byte&128)===0)return value;multiplier*=128;}};
  const scores:number[]=[],cumulative_counts:number[]=[];
  while(offset<bytes.length){score+=varint();cumulative+=varint();scores.push(score/1e12);cumulative_counts.push(cumulative);}
  const value={total:4**10,unique_scores:scores.length,scores,cumulative_counts};
  cache.set(type,value);return value;
}

export function typePercentile(type:SideHustleType,userScore:number) {
  const distribution=loadTypeReference(type);
  let low=0,high=distribution.scores.length;
  while(low<high) {
    const middle=(low+high)>>1;
    if(distribution.scores[middle]!<=userScore) low=middle+1;
    else high=middle;
  }
  return low===0?0:distribution.cumulative_counts[low-1]!/distribution.total;
}

export function buildTypeDisplayScores(scores:ScoreMap<SideHustleType>):Record<SideHustleType,TypeDisplayScore> {
  return Object.fromEntries(Object.entries(scores).map(([key,formalTypeScore])=>{
    const type=key as SideHustleType;
    const percentile=typePercentile(type,formalTypeScore);
    return [type,{formal_type_score:formalTypeScore,type_percentile:percentile,display_fit_index:Number((percentile*10).toFixed(1))}];
  })) as Record<SideHustleType,TypeDisplayScore>;
}

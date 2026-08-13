import { QUESTION_IDS, calculateRouting, scoreAssessment } from "../src/scoring/index.js";
import type { Answers, Route } from "../src/scoring/index.js";

const noneCounts:Record<Route,number>={A:0,B:0,C:0,D:0};
const activeCounts:Record<Route,number>={A:0,B:0,C:0,D:0};
const examples:Partial<Record<Route,string>>={};
let minBusinessFit=5;
let maxBusinessFit=1;

for(let encoded=0;encoded<4**10;encoded++){
  let cursor=encoded;
  const answers={} as Answers;
  for(let index=9;index>=0;index--){ answers[QUESTION_IDS[index]!]="ABCD"[cursor&3] as "A"|"B"|"C"|"D"; cursor>>=2; }
  const result=scoreAssessment({displayName:"Exhaustive",birthDate:"1989-01-17",businessStatus:"NONE",answers});
  noneCounts[result.route]++;
  minBusinessFit=Math.min(minBusinessFit,result.businessFit.score);
  maxBusinessFit=Math.max(maxBusinessFit,result.businessFit.score);
  examples[result.route]??=QUESTION_IDS.map(id=>answers[id]).join("");
  const activeRoute=calculateRouting("ACTIVE",result.routingDimensions,result.finalTypes,result.readiness.score,result.businessFit.score,result.riskFlags);
  activeCounts[activeRoute]++;
  examples[activeRoute]??=QUESTION_IDS.map(id=>answers[id]).join("");
}

for(const route of ["A","B","C","D"] as const){
  if(noneCounts[route]+activeCounts[route]===0) throw new Error(`UNREACHABLE_ROUTE:${route}`);
}
if(minBusinessFit<1 || maxBusinessFit>5) throw new Error(`BUSINESS_FIT_OUT_OF_RANGE:${minBusinessFit}:${maxBusinessFit}`);
console.log(JSON.stringify({totalAnswerSets:4**10,scoringVersion:"side-hustle-scoring-v2-rc1",noneCounts,activeCounts,minBusinessFit,maxBusinessFit,examples},null,2));

import { config, CONFIG_GAPS } from "./config";
import { DIMENSIONS, QUESTION_IDS, SIDE_HUSTLE_TYPES } from "./types";
import type { Answers, AssessmentInput, AstrologyScoringInput, Dimension, LifePathNumber, Option, PersonalityScores, QuestionId, RiskFlag, Route, ScoreMap, ScoringResult, ScoringTrace, SideHustleType, StrangerInteraction, TypeState } from "./types";
import { buildTypeDisplayScores } from "./type-percentiles";

const clamp = (value:number,min=1,max=5) => Math.min(max,Math.max(min,value));
const sum = (values:number[]) => values.reduce((a,b)=>a+b,0);
const roundInternal = (value:number) => Number(value.toFixed(12));
const norm10 = (value:number) => 10*(value-1)/4;
const reverseNorm10 = (value:number) => 10*(5-value)/4;
type DimensionLayer = { raw: ScoreMap<Dimension>; maximum: ScoreMap<Dimension>; v1: ScoreMap<Dimension>; v2: ScoreMap<Dimension>; weights: Record<QuestionId,number> };

export function validateInput(input: AssessmentInput): void {
  if (!input.displayName.trim()) throw new Error("INVALID_DISPLAY_NAME");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.birthDate) || Number.isNaN(Date.parse(`${input.birthDate}T00:00:00Z`))) throw new Error("INVALID_BIRTH_DATE");
  if (input.birthTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.birthTime)) throw new Error("INVALID_BIRTH_TIME");
  for (const id of QUESTION_IDS) if (!input.answers[id] || !["A","B","C","D"].includes(input.answers[id])) throw new Error(`INVALID_OR_MISSING_ANSWER:${id}`);
  if (!(input.businessStatus in config.business_status_options)) throw new Error("INVALID_BUSINESS_STATUS");
}

function scoreDimensionLayer(answers:Answers, routing:boolean):DimensionLayer {
  const raw=Object.fromEntries(DIMENSIONS.map(d=>[d,0])) as ScoreMap<Dimension>;
  const maximum=Object.fromEntries(DIMENSIONS.map(d=>[d,0])) as ScoreMap<Dimension>;
  const weights={} as Record<QuestionId,number>;
  for (const question of config.questionnaire) {
    const id=question.id as QuestionId;
    const option=answers[id] as Option;
    const override=routing ? config.routing_behavior_dimension_scoring.question_weight_overrides[id as "Q9"|"Q10"] : undefined;
    const weight=override ?? question.weight;
    weights[id]=weight;
    for (const d of DIMENSIONS) {
      raw[d]+=question.options[option].dimensions[d]*weight;
      maximum[d]+=Math.max(...Object.values(question.options).map(o=>o.dimensions[d]))*weight;
    }
  }
  const v1=Object.fromEntries(DIMENSIONS.map(d=>[d,1+4*raw[d]/maximum[d]])) as ScoreMap<Dimension>;
  const parameters=routing
    ? config.routing_behavior_dimension_scoring.v2_calibration.parameters
    : config.formal_behavior_dimension_scoring.v2_calibration.parameters;
  const v2=Object.fromEntries(DIMENSIONS.map(d=>{
    const p=parameters[d];
    return [d,clamp(3+(v1[d]-p.reference_mean)*p.scale)];
  })) as ScoreMap<Dimension>;
  return { raw:mapRound(raw), maximum:mapRound(maximum), v1:mapRound(v1), v2:mapRound(v2), weights };
}

export function scoreBehaviorDimensions(answers: Answers) {
  const layer=scoreDimensionLayer(answers,false);
  return {raw:layer.raw,maximum:layer.maximum,normalized:layer.v2,v1:layer.v1,weights:layer.weights};
}

export function calculateTypes(dimensions:ScoreMap<Dimension>):ScoreMap<SideHustleType> {
  return Object.fromEntries(SIDE_HUSTLE_TYPES.map(type=>{
    const weights=config.formal_type_engine.type_formulas[type].weights as Partial<Record<Dimension,number>>;
    return [type,sum(Object.entries(weights).map(([d,w])=>dimensions[d as Dimension]*(w as number)))];
  })) as ScoreMap<SideHustleType>;
}

export function calibrateTypes(precalibrated:ScoreMap<SideHustleType>):ScoreMap<SideHustleType> {
  return Object.fromEntries(SIDE_HUSTLE_TYPES.map(type=>{
    const p=config.formal_type_engine.calibration.parameters[type];
    return [type,clamp(3+(precalibrated[type]-p.reference_mean)*p.scale)];
  })) as ScoreMap<SideHustleType>;
}

export function rankTypes(scores:ScoreMap<SideHustleType>) {
  return SIDE_HUSTLE_TYPES.map(type=>({type,score:scores[type]})).sort((a,b)=>b.score-a.score || SIDE_HUSTLE_TYPES.indexOf(a.type)-SIDE_HUSTLE_TYPES.indexOf(b.type));
}
export function determineTypeState(ranked:ReturnType<typeof rankTypes>):TypeState {
  const [one,two,three]=ranked;
  if (!one||!two||!three) throw new Error("TYPE_RANKING_INCOMPLETE");
  if (one.score<3.5 || one.score-three.score<0.20) return "EXPLORATORY";
  if (one.score-two.score<0.45 && two.score>=3.5) return "MIXED";
  return "CLEAR";
}

function sourceValue(key:string,sources:Record<string,unknown>,answers:Answers,dimensions:ScoreMap<Dimension>) {
  if (key.endsWith("_reverse_norm")) return reverseNorm10(dimensions[key[0] as Dimension]);
  if (key.endsWith("_norm")) return norm10(dimensions[key[0] as Dimension]);
  return (sources[key] as Record<Option,number>)[answers[key as QuestionId]];
}
function calculateWeightedGroup(group:Record<string,any>,answers:Answers,dimensions:ScoreMap<Dimension>) {
  const result:Record<string,number>={};
  for (const [key,rule] of Object.entries(group)) {
    if (key==="normalization_helpers") continue;
    result[key]=roundInternal(clamp(sum(Object.entries(rule.formula_weights).map(([source,weight])=>sourceValue(source,rule.sources,answers,dimensions)*(weight as number))),0,10));
  }
  return result;
}
export const calculateFrictions=(a:Answers,d:ScoreMap<Dimension>)=>calculateWeightedGroup(config.client_metrics.frictions,a,d);
export const calculateSpectrums=(a:Answers,d:ScoreMap<Dimension>)=>calculateWeightedGroup(config.client_metrics.execution_spectrums,a,d);

function levelFor(score:number,levels:ReadonlyArray<{key:string;min:number;max:number}>) { return levels.find(x=>score>=x.min&&score<=x.max)?.key ?? "UNKNOWN"; }
export function calculateReadiness(answers:Answers) {
  const components:ScoringTrace["readiness_components"]={};
  for (const [key,c] of Object.entries(config.readiness.components)) {
    const question=c.question as QuestionId;
    const answer=answers[question];
    const optionScore=c.option_scores[answer];
    components[key]={question,answer,option_score:optionScore,weight:c.weight,weighted_score:optionScore*c.weight};
  }
  const score=sum(Object.values(components).map(c=>c.weighted_score));
  return {score,level:levelFor(score,config.readiness.levels),components};
}
export function calculateStrangerInteraction(answers:Answers):StrangerInteraction { return config.stranger_interaction.mapping[answers.Q6]; }
export function calculateBusinessFit(dimensions:ScoreMap<Dimension>,x:number) {
  const weights=config.business_fit.weights;
  const values={P:dimensions.P,S:dimensions.S,C:dimensions.C,R:dimensions.R,A:dimensions.A,X:x};
  const components=Object.fromEntries(Object.entries(values).map(([key,value])=>{
    const weight=weights[key as keyof typeof weights];
    return [key,{value,weight,weighted_score:value*weight}];
  })) as ScoringTrace["business_fit_components"];
  const score=sum(Object.values(components).map(c=>c.weighted_score));
  const level=score>=4?"HIGH":score>=3.4?"MEDIUM":"LOW";
  return {score,rawScore:score,level,components};
}
export function generateRiskFlags(answers:Answers):RiskFlag[] {
  return Object.entries(config.risk_flags).flatMap(([id,r])=>{
    if (id==="routing_roles" || !("trigger" in r)) return [];
    return answers[r.trigger.question as QuestionId]===r.trigger.option?[{id:id as RiskFlag["id"],label:r.label,severity:r.severity as RiskFlag["severity"],routingRole:config.risk_flags.routing_roles[id as keyof typeof config.risk_flags.routing_roles]}]:[];
  });
}

function calculateRoutingWithTrace(status:AssessmentInput["businessStatus"],dimensions:ScoreMap<Dimension>,types:ScoreMap<SideHustleType>,readiness:number,businessFit:number,flags:RiskFlag[]) {
  const has=(id:RiskFlag["id"])=>flags.some(f=>f.id===id);
  const lowPrsCount=[dimensions.P,dimensions.R,dimensions.S].filter(v=>v<2.8).length;
  const highRisk=has("F1")&&has("F3");
  const capitalLowServiceSystem=types.CAPITAL_ALLOCATOR>=4&&lowPrsCount>=2;
  const forceD=highRisk||capitalLowServiceSystem;
  const aDimensions=[dimensions.P,dimensions.R,dimensions.S].filter(v=>v>=3.5).length;
  const routeA=businessFit>=3.55&&readiness>=3.8&&!has("F1")&&!has("F3")&&aDimensions>=2;
  const cTypeMatch=[types.SYSTEM_OPERATOR,types.CONTENT_INFLUENCER,types.PROFESSIONAL_SKILL].some(v=>v>=3.8);
  const routeC=(status==="ACTIVE"||status==="STABLE")&&cTypeMatch;
  const b1=businessFit>=3.35;
  const b2=businessFit>=3.15&&readiness>=3.2;
  const b3=businessFit>=3.05&&readiness>=3.4&&has("F4");
  const routeB=b1||b2||b3;
  let route:Route="D";
  if (forceD) route="D"; else if(routeA) route="A"; else if(routeC) route="C"; else if(routeB) route="B";
  return {
    route,
    forceDTrace:{matched:forceD,high_risk:highRisk,capital_low_service_system:capitalLowServiceSystem,low_prs_count:lowPrsCount},
    routingTrace:[
      {rule:"FORCE_D" as const,matched:forceD,detail:{highRisk,capitalLowServiceSystem,lowPrsCount}},
      {rule:"A" as const,matched:!forceD&&routeA,detail:{businessFit,readiness,noF1:!has("F1"),noF3:!has("F3"),qualifiedDimensions:aDimensions}},
      {rule:"C" as const,matched:!forceD&&!routeA&&routeC,detail:{businessStatus:status,qualifiedType:cTypeMatch}},
      {rule:"B" as const,matched:!forceD&&!routeA&&!routeC&&routeB,detail:{condition1:b1,condition2:b2,condition3:b3,F2Ignored:true}},
      {rule:"D" as const,matched:route==="D",detail:{fallback:!forceD&&!routeA&&!routeC&&!routeB}},
    ],
  };
}
export function calculateRouting(status:AssessmentInput["businessStatus"],dimensions:ScoreMap<Dimension>,types:ScoreMap<SideHustleType>,readiness:number,businessFit:number,flags:RiskFlag[]):Route {
  return calculateRoutingWithTrace(status,dimensions,types,readiness,businessFit,flags).route;
}
export function calculateAiPotential(status:AssessmentInput["businessStatus"],types:ScoreMap<SideHustleType>,d:ScoreMap<Dimension>) {
  const count=[types.SYSTEM_OPERATOR,types.CONTENT_INFLUENCER,types.PROFESSIONAL_SKILL,d.A,d.S].filter(x=>x>=3.8).length;
  if ((status==="ACTIVE"||status==="STABLE")&&count>=2) return "HIGH" as const;
  if (((status==="ACTIVE"||status==="STABLE")&&count>=1)||count>=2) return "MEDIUM" as const;
  return "LOW" as const;
}
export function calculateConsultationPriority(route:Route,businessFit:number,readiness:number,ai:"HIGH"|"MEDIUM"|"LOW") {
  if (route==="A"||(route==="B"&&businessFit>=4)||(route==="C"&&ai==="HIGH")) return "HIGH" as const;
  if (route==="B"||route==="C"||(route==="D"&&readiness>=3.6)) return "MEDIUM" as const;
  return "LOW" as const;
}

export function scoreAssessment(input:AssessmentInput,_legacyPersonality?:PersonalityScores):ScoringResult {
  validateInput(input);
  const formal=scoreDimensionLayer(input.answers,false);
  const routing=scoreDimensionLayer(input.answers,true);
  const precalibrated=calculateTypes(formal.v2);
  const finalTypes=calibrateTypes(precalibrated);
  const typeDisplayScores=buildTypeDisplayScores(finalTypes);
  const ranked=rankTypes(finalTypes);
  const typeState=determineTypeState(ranked);
  const readiness=calculateReadiness(input.answers);
  const strangerInteraction=calculateStrangerInteraction(input.answers);
  const businessFit=calculateBusinessFit(routing.v2,strangerInteraction.score);
  const riskFlags=generateRiskFlags(input.answers);
  const routingResult=calculateRoutingWithTrace(input.businessStatus,routing.v2,finalTypes,readiness.score,businessFit.score,riskFlags);
  const aiMarketingPotential=calculateAiPotential(input.businessStatus,finalTypes,formal.v2);
  const routingTrace=JSON.parse(JSON.stringify(routingResult.routingTrace)) as ScoringTrace["routing_trace"];
  const scoringTrace:ScoringTrace={
    question_answers:{...input.answers}, formal_question_weights:formal.weights, routing_question_weights:routing.weights,
    behavior_raw_scores:formal.raw, behavior_dimension_v1:formal.v1, formal_behavior_dimension_v2:formal.v2,
    routing_behavior_dimension_v1:routing.v1, routing_behavior_dimension_v2:routing.v2,
    formal_type_precalibrated:mapRound(precalibrated), formal_type_final:mapRound(finalTypes),
    type_percentile:Object.fromEntries(SIDE_HUSTLE_TYPES.map(type=>[type,typeDisplayScores[type].type_percentile])) as ScoreMap<SideHustleType>,
    display_fit_index:Object.fromEntries(SIDE_HUSTLE_TYPES.map(type=>[type,typeDisplayScores[type].display_fit_index])) as ScoreMap<SideHustleType>, type_ranking:ranked, type_state:typeState,
    readiness_components:readiness.components, readiness_score:readiness.score, stranger_interaction:strangerInteraction,
    business_fit_components:businessFit.components, business_fit_score:businessFit.score, risk_flags:riskFlags,
    force_d_trace:routingResult.forceDTrace, routing_trace:routingTrace, system_route:routingResult.route,
  };
  return {
    scoringVersion:"side-hustle-scoring-v2-rc1",rawDimensions:formal.raw,dimensionMax:formal.maximum,dimensions:formal.v2,
    formalBehaviorDimensions:formal.v2,routingDimensions:routing.v2,behaviorTypes:mapRound(precalibrated),finalTypes:mapRound(finalTypes),
    rankedTypes:ranked,typeState,frictions:calculateFrictions(input.answers,formal.v2),spectrums:calculateSpectrums(input.answers,formal.v2),
    readiness:{score:readiness.score,level:readiness.level},strangerInteraction,
    businessFit:{score:businessFit.score,rawScore:businessFit.rawScore,level:businessFit.level},riskFlags,aiMarketingPotential,
    route:routingResult.route,consultationPriority:calculateConsultationPriority(routingResult.route,businessFit.score,readiness.score,aiMarketingPotential),warnings:[],scoringTrace,typeDisplayScores,
  };
}

export function calculateLifePath(birthDate:string):LifePathNumber {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) throw new Error("INVALID_BIRTH_DATE");
  let value=birthDate.replaceAll("-","").split("").reduce((total,digit)=>total+Number(digit),0);
  while (value>9&&value!==11&&value!==22&&value!==33) value=String(value).split("").reduce((total,digit)=>total+Number(digit),0);
  return value as LifePathNumber;
}

// V1 API compatibility. Birth profiles are intentionally isolated in RC1;
// these values can be displayed or used by cross analysis, never by scoreAssessment.
export function calculateAstrologyTypes(_input:AstrologyScoringInput):ScoreMap<SideHustleType> {
  return Object.fromEntries(SIDE_HUSTLE_TYPES.map(type=>[type,3])) as ScoreMap<SideHustleType>;
}
export function calculateNumerologyTypes(_lifePath:LifePathNumber):ScoreMap<SideHustleType> {
  return Object.fromEntries(SIDE_HUSTLE_TYPES.map(type=>[type,3])) as ScoreMap<SideHustleType>;
}
export function mergeFinalTypes(behavior:ScoreMap<SideHustleType>,_personality?:PersonalityScores) { return {...behavior}; }
function mapRound<K extends string>(record:Record<K,number>) { return Object.fromEntries(Object.entries(record).map(([k,v])=>[k,roundInternal(v as number)])) as Record<K,number>; }
export { CONFIG_GAPS };

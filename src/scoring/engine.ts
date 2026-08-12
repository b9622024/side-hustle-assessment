import { config, CONFIG_GAPS } from "./config.js";
import { DIMENSIONS, QUESTION_IDS, SIDE_HUSTLE_TYPES } from "./types.js";
import type { Answers, AssessmentInput, AstrologyScoringInput, Dimension, LifePathNumber, Option, PersonalityScores, QuestionId, RiskFlag, Route, ScoreMap, ScoringResult, SideHustleType } from "./types.js";

const clamp = (value:number,min:number,max:number) => Math.min(max,Math.max(min,value));
const sum = (values:number[]) => values.reduce((a,b)=>a+b,0);
const round = (value:number,digits=12) => Number(value.toFixed(digits));
const norm = (value:number) => 10*(value-1)/4;
const reverseNorm = (value:number) => 10*(5-value)/4;

export function validateInput(input: AssessmentInput): void {
  if (!input.displayName.trim()) throw new Error("INVALID_DISPLAY_NAME");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.birthDate) || Number.isNaN(Date.parse(`${input.birthDate}T00:00:00Z`))) throw new Error("INVALID_BIRTH_DATE");
  if (input.birthTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.birthTime)) throw new Error("INVALID_BIRTH_TIME");
  for (const id of QUESTION_IDS) if (!input.answers[id] || !["A","B","C","D"].includes(input.answers[id])) throw new Error(`INVALID_OR_MISSING_ANSWER:${id}`);
  if (!(input.businessStatus in config.business_status_options)) throw new Error("INVALID_BUSINESS_STATUS");
}

export function scoreBehaviorDimensions(answers: Answers) {
  const raw=Object.fromEntries(DIMENSIONS.map(d=>[d,0])) as ScoreMap<Dimension>;
  const maximum=Object.fromEntries(DIMENSIONS.map(d=>[d,0])) as ScoreMap<Dimension>;
  for (const question of config.questionnaire) {
    const id=question.id as QuestionId;
    const option=answers[id] as Option;
    const selected=question.options[option];
    for (const d of DIMENSIONS) {
      raw[d]+=selected.dimensions[d]*question.weight;
      maximum[d]+=Math.max(...Object.values(question.options).map(o=>o.dimensions[d]))*question.weight;
    }
  }
  const normalized=Object.fromEntries(DIMENSIONS.map(d=>[d,clamp(1+4*raw[d]/maximum[d],1,5)])) as ScoreMap<Dimension>;
  return {raw:mapRound(raw),maximum:mapRound(maximum),normalized:mapRound(normalized)};
}

export function calculateTypes(dimensions: ScoreMap<Dimension>): ScoreMap<SideHustleType> {
  return Object.fromEntries(SIDE_HUSTLE_TYPES.map(type=>{
    const weights=config.type_formulas[type].weights as Partial<Record<Dimension,number>>;
    return [type,round(sum(Object.entries(weights).map(([d,w])=>dimensions[d as Dimension]*(w as number))))];
  })) as ScoreMap<SideHustleType>;
}

export function mergeFinalTypes(behavior:ScoreMap<SideHustleType>, personality?:PersonalityScores) {
  if (!personality) throw new Error("PERSONALITY_MATRICES_MISSING");
  const {behavior_weight:b,numerology_weight:n,astrology_weight:a,guardrail}=config.personality_merge;
  return Object.fromEntries(SIDE_HUSTLE_TYPES.map(type=>{
    let score=behavior[type]*b+personality.numerology[type]*n+personality.astrology[type]*a;
    if (behavior[type]<guardrail.if_behavior_type_score_below) score=Math.min(score,guardrail.final_type_score_cap);
    return [type,round(clamp(score,1,5))];
  })) as ScoreMap<SideHustleType>;
}

export function calculateAstrologyTypes(input:AstrologyScoringInput):ScoreMap<SideHustleType> {
  const components=(["sun","moon","ascendant"] as const).flatMap(key=>input[key]?[{key,value:input[key]!}]:[]);
  const weights=config.astrology_type_matrix.component_weights;
  const availableWeight=sum(components.map(({key})=>weights[key]));
  return Object.fromEntries(SIDE_HUSTLE_TYPES.map(type=>[type,round(sum(components.map(({key,value})=>{
    const base=config.astrology_type_matrix.element_scores[value.element][type];
    const adjustment=config.astrology_type_matrix.modality_adjustments[value.modality][type];
    return clamp(base+adjustment,1,5)*weights[key]/availableWeight;
  })))])) as ScoreMap<SideHustleType>;
}

export function calculateNumerologyTypes(lifePath:LifePathNumber):ScoreMap<SideHustleType> {
  return config.numerology_type_matrix[String(lifePath) as keyof typeof config.numerology_type_matrix] as ScoreMap<SideHustleType>;
}

export function calculateLifePath(birthDate:string):LifePathNumber {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) throw new Error("INVALID_BIRTH_DATE");
  let value=birthDate.replaceAll("-","").split("").reduce((total,digit)=>total+Number(digit),0);
  while (value>9 && value!==11 && value!==22 && value!==33) value=String(value).split("").reduce((total,digit)=>total+Number(digit),0);
  return value as LifePathNumber;
}

export function rankTypes(scores:ScoreMap<SideHustleType>) { return SIDE_HUSTLE_TYPES.map(type=>({type,score:scores[type]})).sort((a,b)=>b.score-a.score || a.type.localeCompare(b.type)); }
export function determineTypeState(ranked:ReturnType<typeof rankTypes>):ScoringResult["typeState"] {
  const [one,two,three]=ranked;
  if (!one||!two||!three) throw new Error("TYPE_RANKING_INCOMPLETE");
  if (one.score<3.5 || (one.score-two.score<0.25 && two.score-three.score<0.25)) return "EXPLORATORY";
  if (one.score-two.score<0.35 && one.score>=3.5 && two.score>=3.5) return "MIXED";
  return "CLEAR";
}

function sourceValue(key:string,sources:Record<string,unknown>,answers:Answers,dimensions:ScoreMap<Dimension>) {
  if (key.endsWith("_reverse_norm")) return reverseNorm(dimensions[key[0] as Dimension]);
  if (key.endsWith("_norm")) return norm(dimensions[key[0] as Dimension]);
  const table=sources[key] as Record<Option,number>;
  return table[answers[key as QuestionId]];
}
function calculateWeightedGroup(group:Record<string,any>,answers:Answers,dimensions:ScoreMap<Dimension>) {
  const result:Record<string,number>={};
  for (const [key,rule] of Object.entries(group)) {
    if (key==="normalization_helpers") continue;
    result[key]=round(clamp(sum(Object.entries(rule.formula_weights).map(([source,weight])=>sourceValue(source,rule.sources,answers,dimensions)*(weight as number))),0,10));
  }
  return result;
}
export const calculateFrictions=(a:Answers,d:ScoreMap<Dimension>)=>calculateWeightedGroup(config.frictions,a,d);
export const calculateSpectrums=(a:Answers,d:ScoreMap<Dimension>)=>calculateWeightedGroup(config.execution_spectrums,a,d);

function levelFor(score:number,levels:ReadonlyArray<{key:string;min:number;max:number}>) { return levels.find(x=>score>=x.min&&score<=x.max)?.key ?? "UNKNOWN"; }
export function calculateReadiness(answers:Answers) {
  const score=round(sum(Object.values(config.readiness.components).map(c=>c.option_scores[answers[c.question as QuestionId]]*c.weight)));
  return {score,level:levelFor(score,config.readiness.levels)};
}
export function calculateStrangerInteraction(answers:Answers) { return config.stranger_interaction.mapping[answers.Q6]; }
export function calculateBusinessFit(dimensions:ScoreMap<Dimension>,x:number) {
  const w=config.business_fit.weights;
  const raw=dimensions.P*w.P+dimensions.S*w.S+dimensions.C*w.C+dimensions.R*w.R+dimensions.A*w.A+x*w.X;
  const c=config.business_fit_calibration;
  const score=round(clamp(c.output_min+(raw-c.raw_min)*(c.output_max-c.output_min)/(c.raw_max-c.raw_min),c.output_min,c.output_max));
  return {score,rawScore:round(raw),level:levelFor(score,config.business_fit.levels)};
}
export function generateRiskFlags(answers:Answers):RiskFlag[] {
  return Object.entries(config.risk_flags).flatMap(([id,r])=>answers[r.trigger.question as QuestionId]===r.trigger.option?[{id:id as RiskFlag["id"],label:r.label,severity:r.severity as RiskFlag["severity"]}]:[]);
}
export function calculateAiPotential(status:AssessmentInput["businessStatus"],types:ScoreMap<SideHustleType>,d:ScoreMap<Dimension>) {
  const metrics=[types.SYSTEM_OPERATOR,types.CONTENT_INFLUENCER,types.PROFESSIONAL_SKILL,d.A,d.S];
  const count=metrics.filter(x=>x>=3.8).length;
  if ((status==="ACTIVE"||status==="STABLE")&&count>=2) return "HIGH" as const;
  if ((status==="ACTIVE"||status==="STABLE")&&count>=1 || count>=2) return "MEDIUM" as const;
  return "LOW" as const;
}

export function calculateRouting(status:AssessmentInput["businessStatus"],dimensions:ScoreMap<Dimension>,types:ScoreMap<SideHustleType>,readiness:number,businessFit:number,flags:RiskFlag[]):Route {
  const high=flags.filter(f=>f.severity==="HIGH").length;
  const has=(id:string)=>flags.some(f=>f.id===id);
  const forceD=(businessFit<3.4&&readiness<3.6)||(types.CAPITAL_ALLOCATOR>=4&&[dimensions.P,dimensions.R,dimensions.S].filter(v=>v<3.2).length>=2)||high>=2;
  if (forceD) return "D";
  const routeA=businessFit>=4&&readiness>=3.8&&!has("F1")&&!has("F3")&&[dimensions.P,dimensions.R,dimensions.S].filter(v=>v>=config.routing_calibration.route_a_dimension_threshold).length>=2&&high<2;
  if (routeA) return "A";
  const routeC=(status==="ACTIVE"||status==="STABLE")&&[types.SYSTEM_OPERATOR,types.CONTENT_INFLUENCER,types.PROFESSIONAL_SKILL].some(v=>v>=config.routing_calibration.route_c_type_threshold);
  if (routeC) return "C";
  const routeB=(businessFit>=3.4&&businessFit<=3.999999)||(config.routing_calibration.route_b_includes_high_fit_not_a_or_c&&businessFit>=4)||(businessFit>=4&&readiness>=3&&readiness<=3.799999)||has("F2")||has("F4");
  return routeB?"B":"D";
}
export function calculateConsultationPriority(route:Route,businessFit:number,readiness:number,ai:"HIGH"|"MEDIUM"|"LOW") {
  if (route==="A"||(route==="B"&&businessFit>=4)||(route==="C"&&ai==="HIGH")) return "HIGH" as const;
  if (route==="B"||route==="C"||(route==="D"&&readiness>=3.6)) return "MEDIUM" as const;
  return "LOW" as const;
}

export function scoreAssessment(input:AssessmentInput,personality?:PersonalityScores):ScoringResult {
  validateInput(input);
  const behavior=scoreBehaviorDimensions(input.answers);
  const behaviorTypes=calculateTypes(behavior.normalized);
  const warnings:string[]=[];
  let finalTypes:ScoreMap<SideHustleType>|undefined;
  if (personality) finalTypes=mergeFinalTypes(behaviorTypes,personality);
  else warnings.push("PERSONALITY_INPUT_NOT_PROVIDED");
  const typesForRouting=finalTypes??behaviorTypes;
  const ranked=rankTypes(typesForRouting);
  const frictions=calculateFrictions(input.answers,behavior.normalized);
  const spectrums=calculateSpectrums(input.answers,behavior.normalized);
  const readiness=calculateReadiness(input.answers);
  const strangerInteraction=calculateStrangerInteraction(input.answers);
  const businessFit=calculateBusinessFit(behavior.normalized,strangerInteraction.score);
  const riskFlags=generateRiskFlags(input.answers);
  const aiMarketingPotential=calculateAiPotential(input.businessStatus,typesForRouting,behavior.normalized);
  const route=calculateRouting(input.businessStatus,behavior.normalized,typesForRouting,readiness.score,businessFit.score,riskFlags);
  return {rawDimensions:behavior.raw,dimensionMax:behavior.maximum,dimensions:behavior.normalized,behaviorTypes,finalTypes,rankedTypes:ranked,typeState:determineTypeState(ranked),frictions,spectrums,readiness,strangerInteraction,businessFit,riskFlags,aiMarketingPotential,route,consultationPriority:calculateConsultationPriority(route,businessFit.score,readiness.score,aiMarketingPotential),warnings};
}

function mapRound<K extends string>(record:Record<K,number>) { return Object.fromEntries(Object.entries(record).map(([k,v])=>[k,round(v as number)])) as Record<K,number>; }
export { CONFIG_GAPS };

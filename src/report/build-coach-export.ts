import { config } from "../scoring/config";
import { calculateLifePath } from "../scoring/engine";
import type { CoachAssessmentDetail } from "../lib/coach/data";
import type { Dimension, QuestionId } from "../scoring/types";

const MASTER_NUMBERS=[11,22,33] as const;
function reduceNumber(value:number) {
  let current=value;
  while(current>9&&!MASTER_NUMBERS.includes(current as 11|22|33)) current=String(current).split("").reduce((total,digit)=>total+Number(digit),0);
  return current;
}
function numerologyProfile(birthDate:string) {
  const digitCounts=Object.fromEntries(Array.from({length:9},(_,index)=>[String(index+1),0])) as Record<string,number>;
  for(const digit of birthDate.replaceAll("-","").split("")) if(digit!=="0") digitCounts[digit]=(digitCounts[digit]??0)+1;
  const lifePath=calculateLifePath(birthDate);
  return {life_path_number:lifePath,birthday_number:reduceNumber(Number(birthDate.slice(8,10))),digit_counts:digitCounts,
    repeated_digits:Object.entries(digitCounts).filter(([,count])=>count>1).map(([digit,count])=>({digit:Number(digit),count})),
    missing_digits:Object.entries(digitCounts).filter(([,count])=>count===0).map(([digit])=>Number(digit)),
    is_master_number:MASTER_NUMBERS.includes(lifePath as 11|22|33),role:["interpretation","cross_analysis","birth_profile_display"]};
}
function astrologyProfile(record:CoachAssessmentDetail) {
  const astrology=record.astrology_profile;
  const points=(["sun","moon","ascendant"] as const).flatMap(key=>astrology[key]?[{key,...astrology[key]!}]:[]);
  const baseWeights={sun:.4,moon:.35,ascendant:.25};
  const availableWeight=points.reduce((total,point)=>total+baseWeights[point.key],0);
  const element_distribution:Record<string,number>={FIRE:0,EARTH:0,AIR:0,WATER:0};
  const modality_distribution:Record<string,number>={CARDINAL:0,FIXED:0,MUTABLE:0};
  for(const point of points) { const weight=baseWeights[point.key]/availableWeight; element_distribution[point.element]=(element_distribution[point.element]??0)+weight; modality_distribution[point.modality]=(modality_distribution[point.modality]??0)+weight; }
  return {sun:astrology.sun,moon:astrology.moon??null,ascendant:astrology.ascendant??null,
    normalized_point_weights:Object.fromEntries(points.map(point=>[point.key,baseWeights[point.key]/availableWeight])),element_distribution,modality_distribution,
    data_completeness:{available_points:points.map(point=>point.key),missing_points:(["sun","moon","ascendant"] as const).filter(key=>!astrology[key]),ratio:points.length/3},affects_formal_scoring:false};
}

export function buildCoachJsonExport(record:CoachAssessmentDetail) {
  const scoring=record.scoring_snapshot;
  const clientReport=record.client_reports[0]?.report_data;
  const questionnaire=config.questionnaire.map(question=>{const id=question.id as QuestionId;const answer=record.answers[id];return {id,text:question.text,answer,answer_text:question.options[answer].text};});
  const dimensions=scoring.formalBehaviorDimensions??scoring.dimensions;
  const finalTypes=scoring.finalTypes??Object.fromEntries(scoring.rankedTypes.map(item=>[item.type,item.score]));
  return {
    report_meta:{report_id:record.report_id,report_type:"side_hustle_suitability_action",report_display_name:"副業適性測驗",report_document_name:"副業適性行動報告",
      model_version:"side-hustle-report-v2-rc1",questionnaire_version:config.meta.questionnaire_version,scoring_version:record.scoring_version,
      routing_version:"side-hustle-routing-v2-rc1",astrology_version:"basic-sun-profile-1.0.0",numerology_version:"numerology-birth-date-reduction-1.0.0",
      created_at:record.created_at,updated_at:record.created_at,...(record.scoring_version!==config.meta.config_version?{legacy_result_preserved:true}: {})},
    respondent:{display_name:record.display_name},birth_data:{date:record.birth_date,time:record.birth_time,place:record.birth_place},
    business_status:{code:record.business_status,label:config.business_status_options[record.business_status]},astrology:astrologyProfile(record),numerology:numerologyProfile(record.birth_date),
    questionnaire:{version:config.meta.questionnaire_version,answers:questionnaire},scoring_trace:scoring.scoringTrace??null,
    behavior_profile:{scale:{min:1,max:5,display_decimals:1},dimensions:Object.fromEntries(Object.entries(dimensions).map(([key,score])=>[key,{label:config.dimensions[key as Dimension].label,score}])),formal_dimensions:scoring.formalBehaviorDimensions??null,routing_dimensions:scoring.routingDimensions??null},
    side_hustle_types:{type_state:scoring.typeState,ranking:scoring.rankedTypes,scores:finalTypes,source:"behavior_only"},readiness:scoring.readiness,business_fit:scoring.businessFit,risk_flags:scoring.riskFlags,
    routing:{system_route:scoring.route,label:config.routing.rules[scoring.route].label,consultation_priority:scoring.consultationPriority},
    cross_analysis:{scoring_isolation_verified:true,birth_profile_role:"interpretation_and_cross_analysis_only",summary:clientReport?.astrology.summary??null},
    coach_insights:{ai_marketing_potential:scoring.aiMarketingPotential,active_risk_flags:scoring.riskFlags.map(flag=>({id:flag.id,label:flag.label,severity:flag.severity,routing_role:flag.routingRole??null})),primary_type:scoring.rankedTypes[0]??null,secondary_type:scoring.rankedTypes[1]??null},
  };
}

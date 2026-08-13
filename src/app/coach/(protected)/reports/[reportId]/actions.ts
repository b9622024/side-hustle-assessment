"use server";
import {revalidatePath} from "next/cache";
import {getSupabaseAdmin} from "../../../../../lib/supabase/admin";
import {CLIENT_STAGES,CONSULTATION_MODES,OFFER_TYPES,type ConsultationSettings} from "../../../../../consultation/types";

function validText(value:unknown,max=2000){return typeof value==="string"&&value.length<=max;}
export async function saveConsultationSettings(reportId:string,value:ConsultationSettings){
  if(!/^SH-\d{8}-[A-F0-9]{6}$/.test(reportId)) throw new Error("INVALID_REPORT_ID");
  if(!value||!(value.consultation_context.client_stage in CLIENT_STAGES)||!(value.consultation_context.consultation_mode in CONSULTATION_MODES)||!(value.selected_offer.offer_type in OFFER_TYPES)||!validText(value.coach_notes,10000)) throw new Error("INVALID_CONSULTATION_SETTINGS");
  const {error}=await getSupabaseAdmin().from("assessments").update({consultation_settings:value,updated_at:new Date().toISOString()}).eq("report_id",reportId);
  if(error) throw new Error("CONSULTATION_SAVE_FAILED",{cause:error});
  revalidatePath(`/coach/reports/${reportId}`);
  return {ok:true};
}

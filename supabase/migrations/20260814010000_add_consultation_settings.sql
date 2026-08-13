alter table public.assessments
  add column consultation_setting jsonb;

alter table public.assessments
  add constraint assessments_consultation_setting_object_check
  check (consultation_setting is null or jsonb_typeof(consultation_setting) = 'object');

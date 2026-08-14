alter table public.assessments
  add column if not exists diagnostic_profile jsonb;

alter table public.assessments
  add constraint assessments_diagnostic_profile_object_check
  check (diagnostic_profile is null or jsonb_typeof(diagnostic_profile) = 'object');

create or replace function public.save_assessment_with_report(
  p_assessment jsonb,
  p_report jsonb
) returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  assessment_record_id bigint;
begin
  insert into public.assessments (
    report_id,
    display_name,
    birth_date,
    birth_time,
    birth_place,
    business_status,
    answers,
    diagnostic_profile,
    astrology_profile,
    scoring_snapshot,
    scoring_version
  ) values (
    p_assessment->>'report_id',
    p_assessment->>'display_name',
    (p_assessment->>'birth_date')::date,
    nullif(p_assessment->>'birth_time', '')::time,
    p_assessment->>'birth_place',
    p_assessment->>'business_status',
    p_assessment->'answers',
    p_assessment->'diagnostic_profile',
    p_assessment->'astrology_profile',
    p_assessment->'scoring_snapshot',
    p_assessment->>'scoring_version'
  )
  returning id into assessment_record_id;

  insert into public.client_reports (
    assessment_id,
    report_id,
    report_data,
    generated_at
  ) values (
    assessment_record_id,
    p_report->>'report_id',
    p_report->'report_data',
    (p_report->>'generated_at')::timestamptz
  );

  return assessment_record_id;
end;
$$;

revoke all on function public.save_assessment_with_report(jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.save_assessment_with_report(jsonb, jsonb) to service_role;

comment on column public.assessments.diagnostic_profile is 'V2.2 diagnostic input layer. Excluded from formal scoring.';

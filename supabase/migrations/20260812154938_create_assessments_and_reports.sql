create table public.assessments (
  id bigint generated always as identity primary key,
  report_id text not null unique check (report_id ~ '^SH-[0-9]{8}-[A-F0-9]{6}$'),
  display_name text not null check (char_length(display_name) between 1 and 80),
  birth_date date not null,
  birth_time time,
  birth_place text not null check (char_length(birth_place) between 1 and 160),
  business_status text not null check (business_status in ('NONE', 'TRIED_NOT_ACTIVE', 'ACTIVE', 'STABLE')),
  answers jsonb not null check (jsonb_typeof(answers) = 'object'),
  astrology_profile jsonb not null check (jsonb_typeof(astrology_profile) = 'object'),
  scoring_snapshot jsonb not null check (jsonb_typeof(scoring_snapshot) = 'object'),
  scoring_version text not null,
  created_at timestamptz not null default now(),
  unique (id, report_id)
);

create table public.client_reports (
  id bigint generated always as identity primary key,
  assessment_id bigint not null unique,
  report_id text not null unique,
  report_data jsonb not null check (jsonb_typeof(report_data) = 'object'),
  generated_at timestamptz not null,
  created_at timestamptz not null default now(),
  foreign key (assessment_id, report_id)
    references public.assessments(id, report_id)
    on delete cascade
);

create index assessments_created_at_idx on public.assessments (created_at desc);
create index assessments_display_name_idx on public.assessments (display_name);
create index client_reports_created_at_idx on public.client_reports (created_at desc);

alter table public.assessments enable row level security;
alter table public.client_reports enable row level security;

revoke all on table public.assessments from public, anon, authenticated;
revoke all on table public.client_reports from public, anon, authenticated;
revoke all on sequence public.assessments_id_seq from public, anon, authenticated;
revoke all on sequence public.client_reports_id_seq from public, anon, authenticated;
grant select, insert, update, delete on table public.assessments to service_role;
grant select, insert, update, delete on table public.client_reports to service_role;
grant usage, select on sequence public.assessments_id_seq to service_role;
grant usage, select on sequence public.client_reports_id_seq to service_role;

create function public.save_assessment_with_report(
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

comment on table public.assessments is 'Private raw assessment and coach-side scoring snapshots.';
comment on table public.client_reports is 'Private client-safe report projections. Access is server-only.';

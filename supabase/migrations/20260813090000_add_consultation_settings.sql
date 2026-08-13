alter table public.assessments
  add column if not exists consultation_settings jsonb,
  add column if not exists updated_at timestamptz;

comment on column public.assessments.consultation_settings is
  'Nullable coach-authored context. Legacy reports remain unchanged until first explicit save.';

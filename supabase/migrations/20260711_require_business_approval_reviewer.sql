alter table if exists public.business_profiles
  drop constraint if exists business_profiles_approved_requires_reviewer;

alter table if exists public.business_profiles
  add constraint business_profiles_approved_requires_reviewer
  check (
    status <> 'approved'
    or (reviewed_by is not null and reviewed_at is not null)
  );

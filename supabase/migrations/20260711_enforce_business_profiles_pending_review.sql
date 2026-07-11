alter table if exists public.business_profiles
  alter column status set default 'pending';

create or replace function public.enforce_business_profile_manual_review()
returns trigger
language plpgsql
as $$
begin
  if TG_OP = 'INSERT' and (new.reviewed_by is null or new.reviewed_at is null) then
    new.status := 'pending';
    new.reviewed_by := null;
    new.reviewed_at := null;
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_business_profile_manual_review on public.business_profiles;
create trigger enforce_business_profile_manual_review
  before insert on public.business_profiles
  for each row
  execute function public.enforce_business_profile_manual_review();

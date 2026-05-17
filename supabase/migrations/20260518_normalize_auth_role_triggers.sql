create or replace function public.handle_new_user()
returns trigger as $$
declare
  requested_role text := coalesce(new.raw_user_meta_data->>'role', 'buyer');
  profile_role public.user_role;
begin
  profile_role := case requested_role
    when 'client' then 'buyer'::public.user_role
    when 'provider' then 'seller'::public.user_role
    when 'seller' then 'seller'::public.user_role
    when 'admin' then 'admin'::public.user_role
    else 'buyer'::public.user_role
  end;

  insert into public.user_profiles (id, role, email, full_name)
  values (
    new.id,
    profile_role,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

create or replace function public.handle_new_eloo_user()
returns trigger as $$
declare
  requested_role text := coalesce(new.raw_user_meta_data->>'role', 'client');
  profile_role public.eloo_user_role;
begin
  profile_role := case requested_role
    when 'buyer' then 'client'::public.eloo_user_role
    when 'client' then 'client'::public.eloo_user_role
    when 'seller' then 'provider'::public.eloo_user_role
    when 'provider' then 'provider'::public.eloo_user_role
    when 'admin' then 'admin'::public.eloo_user_role
    else 'client'::public.eloo_user_role
  end;

  insert into public.eloo_profiles (id, role, email, first_name, last_name)
  values (
    new.id,
    profile_role,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

begin;

create temporary table private_flow_context as
select
  gen_random_uuid() as inquiry_id,
  gen_random_uuid() as conversation_id,
  (
    select id
    from public.sellers
    where status = 'approved' and country_code is not null
    order by created_at
    limit 1
  ) as provider_id,
  (
    select id
    from auth.users
    where id <> (
      select id from public.sellers where status = 'approved' and country_code is not null order by created_at limit 1
    )
    order by created_at
    limit 1
  ) as buyer_id,
  (
    select id
    from auth.users
    where id not in (
      select id from public.sellers where status = 'approved' and country_code is not null order by created_at limit 1
    )
    order by created_at desc
    limit 1
  ) as outsider_id;

do $$
begin
  if exists (
    select 1
    from private_flow_context
    where provider_id is null or buyer_id is null or outsider_id is null or buyer_id = outsider_id
  ) then
    raise exception 'Private flow test requires three distinct existing users.';
  end if;
end $$;

insert into public.service_inquiries (
  id,
  user_id,
  email,
  country,
  country_code,
  status,
  request_visibility,
  target_provider_id,
  provider_decision_status,
  job_description
)
select
  inquiry_id,
  buyer_id,
  'private-flow-test@invalid.example',
  'Ireland',
  'IE',
  'submitted',
  'private',
  provider_id,
  'pending',
  'Private flow test\n\nRequirements are visible only to the selected provider.'
from private_flow_context;

insert into public.eloo_conversations (
  id,
  client_id,
  provider_id,
  inquiry_id,
  is_active
)
select conversation_id, buyer_id, provider_id, inquiry_id, true
from private_flow_context;

insert into public.eloo_messages (conversation_id, sender_id, content, attachments)
select conversation_id, buyer_id, 'PRIVATE JOB REQUIREMENTS', '[]'::jsonb
from private_flow_context;

grant select on private_flow_context to authenticated;

select set_config(
  'request.jwt.claims',
  json_build_object('sub', (select buyer_id from private_flow_context), 'role', 'authenticated')::text,
  true
);
set local role authenticated;
do $$
begin
  if (select count(*) from public.service_inquiries where id = (select inquiry_id from private_flow_context)) <> 1 then
    raise exception 'Buyer cannot view their private request.';
  end if;
  if (select count(*) from public.eloo_messages where conversation_id = (select conversation_id from private_flow_context)) <> 1 then
    raise exception 'Buyer cannot view the requirements message.';
  end if;
end $$;
reset role;

select set_config(
  'request.jwt.claims',
  json_build_object('sub', (select provider_id from private_flow_context), 'role', 'authenticated')::text,
  true
);
set local role authenticated;
do $$
begin
  if (select count(*) from public.service_inquiries where id = (select inquiry_id from private_flow_context)) <> 1 then
    raise exception 'Target provider cannot view the private request.';
  end if;
  if (select count(*) from public.eloo_messages where conversation_id = (select conversation_id from private_flow_context)) <> 1 then
    raise exception 'Target provider cannot view the requirements message.';
  end if;
end $$;
reset role;

select set_config(
  'request.jwt.claims',
  json_build_object('sub', (select outsider_id from private_flow_context), 'role', 'authenticated')::text,
  true
);
set local role authenticated;
do $$
begin
  if (select count(*) from public.service_inquiries where id = (select inquiry_id from private_flow_context)) <> 0 then
    raise exception 'Unrelated user can view a private request.';
  end if;
  if (select count(*) from public.eloo_messages where conversation_id = (select conversation_id from private_flow_context)) <> 0 then
    raise exception 'Unrelated user can view a private requirements message.';
  end if;
end $$;
reset role;

update public.service_inquiries
set
  provider_decision_status = 'accepted',
  provider_decision_at = now()
where id = (select inquiry_id from private_flow_context)
  and target_provider_id = (select provider_id from private_flow_context)
  and provider_decision_status = 'pending';

insert into public.bids (inquiry_id, provider_id, amount, status)
select inquiry_id, provider_id, 125, 'pending'
from private_flow_context;

do $$
begin
  if not exists (
    select 1
    from public.service_inquiries inquiry
    join public.bids bid on bid.inquiry_id = inquiry.id
    join private_flow_context context on context.inquiry_id = inquiry.id
    where inquiry.provider_decision_status = 'accepted'
      and inquiry.target_provider_id = bid.provider_id
      and bid.status = 'pending'
  ) then
    raise exception 'Accepted provider quote is not payable.';
  end if;
end $$;

rollback;

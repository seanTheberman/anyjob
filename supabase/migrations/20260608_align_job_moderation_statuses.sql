alter type if exists public.inquiry_status add value if not exists 'approved';
alter type if exists public.inquiry_status add value if not exists 'rejected';
alter type if exists public.inquiry_status add value if not exists 'more_info_needed';
alter type if exists public.inquiry_status add value if not exists 'pending_for_review';

alter table if exists public.business_work_posts
  drop constraint if exists business_work_posts_status_check;

alter table if exists public.business_work_posts
  add constraint business_work_posts_status_check
  check (
    status in (
      'submitted',
      'approved',
      'rejected',
      'more_info_needed',
      'pending_for_review',
      'filled',
      'cancelled',
      'completed'
    )
  );

create index if not exists idx_business_work_posts_status on public.business_work_posts(status);

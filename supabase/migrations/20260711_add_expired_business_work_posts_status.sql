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
      'completed',
      'expired'
    )
  );

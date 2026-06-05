create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null default '',
  cover_image_url text,
  category text not null default 'Guides',
  author_name text not null default 'AnyJob Team',
  status text not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blog_posts_status_check check (status in ('draft', 'published'))
);

create index if not exists idx_blog_posts_status_published_at on public.blog_posts(status, published_at desc);
create index if not exists idx_blog_posts_slug on public.blog_posts(slug);

alter table public.blog_posts enable row level security;

drop policy if exists "Published blog posts are public" on public.blog_posts;
create policy "Published blog posts are public"
  on public.blog_posts for select
  using (status = 'published');

create or replace function public.set_blog_posts_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  if new.status = 'published' and old.status is distinct from 'published' and new.published_at is null then
    new.published_at = now();
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_blog_posts_updated_at on public.blog_posts;
create trigger set_blog_posts_updated_at
  before update on public.blog_posts
  for each row execute function public.set_blog_posts_updated_at();

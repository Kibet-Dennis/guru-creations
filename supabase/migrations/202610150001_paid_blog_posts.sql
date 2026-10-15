create table if not exists public.paid_posts (
  id uuid primary key default gen_random_uuid(),
  author_name text not null check (char_length(author_name) between 1 and 80),
  author_email text not null check (char_length(author_email) between 3 and 254),
  title text not null check (char_length(title) between 8 and 120),
  excerpt text not null check (char_length(excerpt) between 30 and 240),
  content text not null check (char_length(content) between 300 and 12000),
  category text not null check (
    category in (
      'Football',
      'Digital Culture',
      'Creator Economy',
      'AI & Technology',
      'Media & Marketing',
      'Trending Topics'
    )
  ),
  plan text not null check (plan in ('24h', '3d', '7d', '30d')),
  amount_usd integer not null check (amount_usd in (2, 5, 10, 25)),
  amount_kes integer check (amount_kes is null or amount_kes > 0),
  payment_currency text not null check (payment_currency in ('USD', 'KES')),
  payment_provider text not null check (payment_provider in ('mpesa', 'stripe', 'paypal')),
  payment_reference text unique,
  provider_data jsonb not null default '{}'::jsonb,
  image_url text,
  status text not null default 'pending'
    check (status in ('pending', 'published', 'expired', 'failed')),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  published_at timestamptz,
  expires_at timestamptz
);

create index if not exists paid_posts_publication_idx
  on public.paid_posts (published_at desc)
  where status = 'published';

alter table public.paid_posts enable row level security;

revoke all on public.paid_posts from anon, authenticated;
grant all on public.paid_posts to service_role;

grant select (
  id,
  author_name,
  title,
  excerpt,
  content,
  category,
  image_url,
  published_at,
  expires_at,
  status
) on public.paid_posts to anon, authenticated;

create policy "Visitors can read current paid posts"
  on public.paid_posts
  for select
  to anon, authenticated
  using (status = 'published' and expires_at > now());

create table if not exists public.blog_submission_limits (
  client_hash text primary key,
  window_started_at timestamptz not null default now(),
  submission_count integer not null default 1
);

alter table public.blog_submission_limits enable row level security;
revoke all on public.blog_submission_limits from anon, authenticated;
grant all on public.blog_submission_limits to service_role;

create or replace function public.allow_blog_submission(client_hash text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  allowed boolean;
begin
  insert into public.blog_submission_limits as limits (
    client_hash,
    window_started_at,
    submission_count
  )
  values (allow_blog_submission.client_hash, now(), 1)
  on conflict (client_hash) do update
  set
    window_started_at = case
      when limits.window_started_at <= now() - interval '1 hour' then now()
      else limits.window_started_at
    end,
    submission_count = case
      when limits.window_started_at <= now() - interval '1 hour' then 1
      else limits.submission_count + 1
    end
  returning submission_count <= 5 into allowed;

  return allowed;
end;
$$;

revoke all on function public.allow_blog_submission(text) from public, anon, authenticated;
grant execute on function public.allow_blog_submission(text) to service_role;

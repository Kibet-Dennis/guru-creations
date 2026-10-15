alter table public.paid_posts
  add column if not exists media jsonb not null default '[]'::jsonb,
  add column if not exists media_public jsonb not null default '[]'::jsonb,
  add column if not exists draft_expires_at timestamptz not null default (now() + interval '24 hours'),
  add column if not exists checkout_token_hash text,
  add column if not exists checkout_started_at timestamptz;

grant select (media_public) on public.paid_posts to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'blog-post-private-images',
    'blog-post-private-images',
    false,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'blog-post-private-videos',
    'blog-post-private-videos',
    false,
    104857600,
    array['video/mp4', 'video/webm']
  ),
  (
    'blog-post-public',
    'blog-post-public',
    true,
    104857600,
    array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Guest post media is server managed" on storage.objects;
create policy "Guest post media is server managed"
  on storage.objects
  as restrictive
  for all
  to anon, authenticated
  using (
    bucket_id not in (
      'blog-post-private-images',
      'blog-post-private-videos',
      'blog-post-public'
    )
  )
  with check (
    bucket_id not in (
      'blog-post-private-images',
      'blog-post-private-videos',
      'blog-post-public'
    )
  );

create index if not exists paid_posts_draft_expiry_idx
  on public.paid_posts (draft_expires_at)
  where status = 'pending';

create index if not exists paid_posts_live_expiry_idx
  on public.paid_posts (expires_at)
  where status = 'published';

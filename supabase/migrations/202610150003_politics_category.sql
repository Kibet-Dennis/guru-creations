alter table public.paid_posts
  drop constraint if exists paid_posts_category_check;

alter table public.paid_posts
  add constraint paid_posts_category_check
  check (
    category in (
      'Football',
      'Digital Culture',
      'Creator Economy',
      'AI & Technology',
      'Media & Marketing',
      'Trending Topics',
      'Politics & Elections'
    )
  );

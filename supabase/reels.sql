
-- NexaGram Reels table

create table if not exists public.reels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  video_url text not null,
  caption text not null default '' check (char_length(caption) <= 2200),
  created_at timestamptz not null default now()
);

create index if not exists reels_created_at_idx
on public.reels(created_at desc);

alter table public.reels enable row level security;

drop policy if exists "Reels are viewable by everyone"
on public.reels;

create policy "Reels are viewable by everyone"
on public.reels
for select
using (true);

drop policy if exists "Users can create their own reels"
on public.reels;

create policy "Users can create their own reels"
on public.reels
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own reels"
on public.reels;

create policy "Users can delete their own reels"
on public.reels
for delete
using (auth.uid() = user_id);

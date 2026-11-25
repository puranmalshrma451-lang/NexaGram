-- NexaGram starter schema. Run this entire file in Supabase SQL Editor.
-- Row Level Security is enabled on every user-facing table.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (char_length(username) between 3 and 24),
  full_name text,
  bio text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  caption text not null default '' check (char_length(caption) <= 2200),
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  kind text not null check (kind in ('like','comment','follow')),
  post_id uuid references public.posts(id) on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists posts_created_at_idx on public.posts(created_at desc);
create index if not exists posts_user_id_idx on public.posts(user_id);
create index if not exists comments_post_id_idx on public.comments(post_id);
create index if not exists messages_pair_idx on public.messages(sender_id, receiver_id, created_at);

-- Automatically create a profile after signup.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  desired_username text;
begin
  desired_username := coalesce(new.raw_user_meta_data->>'username', 'member_' || substr(new.id::text, 1, 8));
  insert into public.profiles (id, username)
  values (new.id, desired_username)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.follows enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;

create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "Posts are viewable by everyone" on public.posts for select using (true);
create policy "Users can create their own posts" on public.posts for insert with check (auth.uid() = user_id);
create policy "Users can update their own posts" on public.posts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own posts" on public.posts for delete using (auth.uid() = user_id);

create policy "Likes are viewable by everyone" on public.likes for select using (true);
create policy "Users can like as themselves" on public.likes for insert with check (auth.uid() = user_id);
create policy "Users can remove their own likes" on public.likes for delete using (auth.uid() = user_id);

create policy "Comments are viewable by everyone" on public.comments for select using (true);
create policy "Users can comment as themselves" on public.comments for insert with check (auth.uid() = user_id);
create policy "Users can delete their own comments" on public.comments for delete using (auth.uid() = user_id);

create policy "Follows are viewable by everyone" on public.follows for select using (true);
create policy "Users can follow as themselves" on public.follows for insert with check (auth.uid() = follower_id);
create policy "Users can unfollow themselves" on public.follows for delete using (auth.uid() = follower_id);

create policy "Only conversation participants can read messages" on public.messages for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Users can send messages as themselves" on public.messages for insert with check (auth.uid() = sender_id);
create policy "Only recipient can update message" on public.messages for update using (auth.uid() = receiver_id) with check (auth.uid() = receiver_id);

create policy "Users can read their notifications" on public.notifications for select using (auth.uid() = recipient_id);
create policy "Users can mark their notifications read" on public.notifications for update using (auth.uid() = recipient_id) with check (auth.uid() = recipient_id);

-- Allow Realtime for posts/messages. Enable Realtime for these tables in Dashboard if needed.

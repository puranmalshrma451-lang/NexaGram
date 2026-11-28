
-- NexaGram Follows improvement

create index if not exists follows_following_idx
on public.follows(following_id);

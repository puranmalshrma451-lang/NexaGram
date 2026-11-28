
-- NexaGram Notifications improvements

create index if not exists notifications_recipient_idx
on public.notifications(recipient_id, created_at desc);

drop policy if exists "Users can read their notifications"
on public.notifications;

create policy "Users can read their notifications"
on public.notifications
for select
using (auth.uid() = recipient_id);

drop policy if exists "Users can mark their notifications read"
on public.notifications;

create policy "Users can mark their notifications read"
on public.notifications
for update
using (auth.uid() = recipient_id)
with check (auth.uid() = recipient_id);

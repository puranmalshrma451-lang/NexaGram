
-- NexaGram Messages improvements

create index if not exists messages_receiver_idx
on public.messages(receiver_id, created_at desc);

drop policy if exists "Users can send messages as themselves"
on public.messages;

create policy "Users can send messages as themselves"
on public.messages
for insert
with check (
  auth.uid() = sender_id
  and sender_id <> receiver_id
);

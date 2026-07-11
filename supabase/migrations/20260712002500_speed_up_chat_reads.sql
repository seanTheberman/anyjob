create index if not exists idx_eloo_conversations_client_active_last_message
  on public.eloo_conversations(client_id, is_active, last_message_at desc)
  where client_id is not null;

create index if not exists idx_eloo_conversations_provider_active_last_message
  on public.eloo_conversations(provider_id, is_active, last_message_at desc)
  where provider_id is not null;

create index if not exists idx_eloo_messages_conversation_created_at
  on public.eloo_messages(conversation_id, created_at desc)
  where conversation_id is not null;

create index if not exists idx_eloo_messages_unread_by_conversation
  on public.eloo_messages(conversation_id, is_read, sender_id)
  where conversation_id is not null and is_read = false;

update public.app_content_entries
set
  value = case
    when value = 'Post a job' then 'What do you need help with?'
    else value
  end,
  default_value = 'What do you need help with?',
  updated_at = now()
where content_key = 'home.hero.search';

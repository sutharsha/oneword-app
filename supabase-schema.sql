-- ============================================
-- OneWord App - Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================

-- Profiles (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text,
  avatar_url text,
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Daily prompts
create table public.prompts (
  id uuid default gen_random_uuid() primary key,
  question text not null,
  active_date date unique not null,
  created_at timestamptz default now() not null
);

alter table public.prompts enable row level security;

create policy "Prompts are viewable by everyone"
  on public.prompts for select using (true);

-- Words (the core content)
create table public.words (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  word text not null check (length(word) <= 45 and word ~ '^[a-zA-Z''\-]+$'),
  prompt_id uuid references public.prompts(id) on delete set null,
  created_at timestamptz default now() not null
);

alter table public.words enable row level security;

create policy "Words are viewable by everyone"
  on public.words for select using (true);

create policy "Authenticated users can post words"
  on public.words for insert with check (auth.uid() = user_id);

create policy "Users can delete own words"
  on public.words for delete using (auth.uid() = user_id);

-- Reactions
create table public.reactions (
  id uuid default gen_random_uuid() primary key,
  word_id uuid references public.words(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  emoji text not null check (emoji in ('🔥', '👀', '💀', '❤️', '🤔')),
  created_at timestamptz default now() not null,
  unique(word_id, user_id) -- one reaction per user per word
);

alter table public.reactions enable row level security;

create policy "Reactions are viewable by everyone"
  on public.reactions for select using (true);

create policy "Authenticated users can react"
  on public.reactions for insert with check (auth.uid() = user_id);

create policy "Users can remove own reactions"
  on public.reactions for delete using (auth.uid() = user_id);

-- Indexes
create index words_created_at_idx on public.words (created_at desc);
create index words_user_id_idx on public.words (user_id);
create index words_prompt_id_idx on public.words (prompt_id);
create index reactions_word_id_idx on public.reactions (word_id);

-- Seed some prompts
insert into public.prompts (question, active_date) values
  ('How are you feeling today?', current_date),
  ('What''s the best city?', current_date + 1),
  ('What scares you?', current_date + 2),
  ('What do you want most?', current_date + 3),
  ('Describe your job.', current_date + 4),
  ('What''s overrated?', current_date + 5),
  ('What''s underrated?', current_date + 6),
  ('Your comfort food?', current_date + 7),
  ('What''s broken?', current_date + 8),
  ('One word for humanity.', current_date + 9);

-- Function to get today's prompt
create or replace function get_todays_prompt()
returns table (id uuid, question text, active_date date) as $$
  select id, question, active_date
  from public.prompts
  where active_date = current_date
  limit 1;
$$ language sql stable;

-- Function to handle new user signup (auto-create profile)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || left(new.id::text, 8)),
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', 'Anonymous'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

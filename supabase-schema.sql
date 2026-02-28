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

-- One word per user per prompt
alter table public.words
  add constraint words_user_id_prompt_id_unique unique (user_id, prompt_id);

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

-- ============================================
-- Phase 3: Social & Engagement
-- ============================================

-- Follows
create table public.follows (
  id uuid default gen_random_uuid() primary key,
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  unique(follower_id, following_id),
  check (follower_id != following_id)
);

alter table public.follows enable row level security;

create policy "Follows are viewable by everyone"
  on public.follows for select using (true);

create policy "Authenticated users can follow"
  on public.follows for insert with check (auth.uid() = follower_id);

create policy "Users can unfollow"
  on public.follows for delete using (auth.uid() = follower_id);

create index follows_follower_id_idx on public.follows (follower_id);
create index follows_following_id_idx on public.follows (following_id);

-- Notifications
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  actor_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('reaction', 'follow')),
  word_id uuid references public.words(id) on delete cascade,
  emoji text,
  read boolean default false not null,
  created_at timestamptz default now() not null
);

alter table public.notifications enable row level security;

create policy "Users can view own notifications"
  on public.notifications for select using (auth.uid() = user_id);

create policy "Authenticated users can create notifications"
  on public.notifications for insert with check (auth.uid() = actor_id);

create policy "Users can update own notifications"
  on public.notifications for update using (auth.uid() = user_id);

create policy "Users can delete own notifications"
  on public.notifications for delete using (auth.uid() = user_id);

create index notifications_user_id_idx on public.notifications (user_id, read, created_at desc);
create index notifications_actor_id_idx on public.notifications (actor_id);

-- Streaks (added to profiles)
alter table public.profiles
  add column current_streak integer default 0 not null,
  add column longest_streak integer default 0 not null,
  add column last_post_date date;

-- Function to update streak when a word is posted
create or replace function public.update_streak()
returns trigger as $$
declare
  v_last_date date;
  v_current int;
  v_longest int;
  v_today date := current_date;
begin
  select last_post_date, current_streak, longest_streak
  into v_last_date, v_current, v_longest
  from public.profiles
  where id = new.user_id;

  if v_last_date = v_today then
    return new;
  elsif v_last_date = v_today - 1 then
    v_current := v_current + 1;
  else
    v_current := 1;
  end if;

  if v_current > v_longest then
    v_longest := v_current;
  end if;

  update public.profiles
  set current_streak = v_current,
      longest_streak = v_longest,
      last_post_date = v_today
  where id = new.user_id;

  return new;
end;
$$ language plpgsql security definer;

create trigger on_word_posted
  after insert on public.words
  for each row execute function public.update_streak();

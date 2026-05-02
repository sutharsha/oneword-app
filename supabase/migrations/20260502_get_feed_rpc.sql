-- Single-call feed payload for the home feed tabs.
-- Returns today's prompt, current user's post status, following empty state,
-- and feed words with profile + reaction data in one database round-trip.

create or replace function public.get_feed(
  p_filter text default 'today',
  p_user_id uuid default null
)
returns jsonb
language plpgsql
stable
security invoker
as $$
declare
  v_prompt record;
  v_has_posted boolean := false;
  v_following_ids uuid[] := '{}';
  v_following_empty boolean := false;
  v_words jsonb := '[]'::jsonb;
begin
  select id, question, active_date
  into v_prompt
  from public.prompts
  where active_date = current_date
  limit 1;

  if p_user_id is not null and v_prompt.id is not null then
    select exists(
      select 1
      from public.words
      where user_id = p_user_id
        and prompt_id = v_prompt.id
      limit 1
    ) into v_has_posted;
  end if;

  if p_filter = 'following' and p_user_id is not null then
    select coalesce(array_agg(following_id), '{}')
    into v_following_ids
    from public.follows
    where follower_id = p_user_id;

    v_following_empty := cardinality(v_following_ids) = 0;
  elsif p_filter = 'following' then
    v_following_empty := true;
  end if;

  if not v_following_empty then
    with filtered_words as (
      select
        w.id,
        w.word,
        w.user_id,
        w.prompt_id,
        w.created_at,
        p.username,
        p.display_name,
        p.avatar_url,
        p.current_streak,
        coalesce(rt.total, 0) as reaction_total,
        coalesce(rc.counts, '{}'::jsonb) as reaction_counts,
        ur.emoji as user_reaction
      from public.words w
      join public.profiles p on p.id = w.user_id
      left join lateral (
        select count(*)::int as total
        from public.reactions r
        where r.word_id = w.id
      ) rt on true
      left join lateral (
        select jsonb_object_agg(emoji, reaction_count) as counts
        from (
          select emoji, count(*)::int as reaction_count
          from public.reactions r
          where r.word_id = w.id
          group by emoji
        ) reaction_groups
      ) rc on true
      left join lateral (
        select emoji
        from public.reactions r
        where r.word_id = w.id
          and p_user_id is not null
          and r.user_id = p_user_id
        limit 1
      ) ur on true
      where
        case
          when p_filter in ('today', 'popular') then w.created_at >= date_trunc('day', now())
          when p_filter = 'week' then w.created_at >= date_trunc('day', now()) - interval '7 days'
          when p_filter = 'following' then w.user_id = any(v_following_ids)
          else true
        end
      order by
        case when p_filter = 'popular' then coalesce(rt.total, 0) end desc nulls last,
        w.created_at desc
      limit 50
    )
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', id,
          'word', word,
          'user_id', user_id,
          'prompt_id', prompt_id,
          'created_at', created_at,
          'profile', jsonb_build_object(
            'username', username,
            'display_name', display_name,
            'avatar_url', avatar_url,
            'current_streak', current_streak
          ),
          'reaction_counts', reaction_counts,
          'reaction_total', reaction_total,
          'user_reaction', user_reaction
        )
        order by
          case when p_filter = 'popular' then reaction_total end desc nulls last,
          created_at desc
      ),
      '[]'::jsonb
    ) into v_words
    from filtered_words;
  end if;

  return jsonb_build_object(
    'todaysPrompt', case when v_prompt.id is null then null else jsonb_build_object(
      'id', v_prompt.id,
      'question', v_prompt.question,
      'active_date', v_prompt.active_date
    ) end,
    'hasPostedToday', v_has_posted,
    'followingEmpty', v_following_empty,
    'words', v_words
  );
end;
$$;

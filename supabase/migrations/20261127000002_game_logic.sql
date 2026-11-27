-- =====================================================================
-- Tenfold: game logic. Every function that touches answers, scores or
-- private data is SECURITY DEFINER and checks auth.uid() itself.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Rate limiting (fixed window per user + action)
-- ---------------------------------------------------------------------
create or replace function public.check_rate_limit(p_action text, p_max int, p_window_seconds int)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_window timestamptz;
  v_hits int;
begin
  if v_uid is null then return; end if;
  v_window := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  insert into rate_limits (user_id, action, window_start, hits)
  values (v_uid, p_action, v_window, 1)
  on conflict (user_id, action, window_start) do update set hits = rate_limits.hits + 1
  returning hits into v_hits;
  if v_hits > p_max then
    raise exception 'RATE_LIMITED: too many requests, please slow down' using errcode = 'P0001';
  end if;
  -- opportunistic cleanup
  if random() < 0.01 then
    delete from rate_limits where window_start < now() - interval '2 days';
  end if;
end $$;

create or replace function public.require_user()
returns uuid language plpgsql stable security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '28000';
  end if;
  return v_uid;
end $$;

create or replace function public.require_admin()
returns uuid language plpgsql stable security definer set search_path = public as $$
declare v_uid uuid := public.require_user();
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  return v_uid;
end $$;

-- ---------------------------------------------------------------------
-- New user bootstrap
-- ---------------------------------------------------------------------
create or replace function public.default_avatar()
returns jsonb language sql immutable as $$
  select jsonb_build_object(
    'skin','s3','hair','short','hairColor','brown','eyes','round','mouth','smile',
    'outfit','tee','outfitColor','violet','hat','none','accessory','none','background','midnight')
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_username text := coalesce(new.raw_user_meta_data->>'username', '');
  v_country text := upper(coalesce(new.raw_user_meta_data->>'country', ''));
begin
  if v_username !~ '^[A-Za-z0-9_]{3,20}$'
     or exists (select 1 from profiles where username = v_username::citext) then
    v_username := 'player_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;
  if v_country !~ '^[A-Z]{2}$' then v_country := null; end if;

  insert into profiles (id, username, country) values (new.id, v_username, v_country);
  insert into avatars (user_id, config) values (new.id, public.default_avatar());
  insert into user_stats (user_id) values (new.id);
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.username_available(p_username text)
returns boolean language sql stable security definer set search_path = public as $$
  select p_username ~ '^[A-Za-z0-9_]{3,20}$'
     and not exists (select 1 from profiles where username = p_username::citext)
$$;

-- ---------------------------------------------------------------------
-- Daily quiz generation (balanced categories and difficulty)
-- ---------------------------------------------------------------------
create or replace function public.generate_daily_quiz(p_date date)
returns bigint language plpgsql security definer set search_path = public as $$
declare
  v_quiz_id bigint;
  v_categories text[] := array['history','science','geography','sport',
                               'entertainment','technology','literature','general'];
  v_slots_cat text[];
  v_slots_diff int[] := array[1,1,1,2,2,2,2,3,3,3];
  v_picked bigint[] := '{}';
  v_qid bigint;
  v_extra text[];
  i int;
begin
  select id into v_quiz_id from daily_quizzes where quiz_date = p_date;
  if v_quiz_id is not null then return v_quiz_id; end if;

  -- 8 categories once each, plus 2 distinct extras, shuffled.
  select array_agg(c order by random()) into v_slots_cat from unnest(v_categories) c;
  select array_agg(c) into v_extra from (select c from unnest(v_categories) c order by random() limit 2) s;
  v_slots_cat := v_slots_cat || v_extra;

  for i in 1..10 loop
    v_qid := null;
    -- Pass 1: matching category + difficulty, not used in the last 90 days.
    -- Pass 2: matching category, any difficulty.
    -- Pass 3: any category, least used.
    select q.id into v_qid from questions q
     where q.pool = 'daily' and q.is_active
       and q.category = v_slots_cat[i] and q.difficulty = v_slots_diff[i]
       and q.id <> all(v_picked)
       and (q.last_used_on is null or q.last_used_on < p_date - 90)
       and not exists (select 1 from daily_quiz_questions dq join daily_quizzes d on d.id = dq.quiz_id
                        where dq.question_id = q.id and d.quiz_date >= p_date)
     order by q.times_used, random() limit 1;
    if v_qid is null then
      select q.id into v_qid from questions q
       where q.pool = 'daily' and q.is_active and q.category = v_slots_cat[i]
         and q.id <> all(v_picked)
         and not exists (select 1 from daily_quiz_questions dq join daily_quizzes d on d.id = dq.quiz_id
                          where dq.question_id = q.id and d.quiz_date >= p_date)
       order by (q.last_used_on is not null and q.last_used_on >= p_date - 90),
                abs(q.difficulty - v_slots_diff[i]), q.times_used, random() limit 1;
    end if;
    if v_qid is null then
      select q.id into v_qid from questions q
       where q.pool = 'daily' and q.is_active and q.id <> all(v_picked)
       order by q.last_used_on nulls first, q.times_used, random() limit 1;
    end if;
    if v_qid is null then
      raise exception 'NOT_ENOUGH_QUESTIONS: add more active daily questions';
    end if;
    v_picked := v_picked || v_qid;
  end loop;

  insert into daily_quizzes (quiz_date, auto_generated, created_by)
  values (p_date, true, auth.uid()) returning id into v_quiz_id;

  -- Order easy -> hard for a satisfying difficulty curve.
  insert into daily_quiz_questions (quiz_id, position, question_id)
  select v_quiz_id, row_number() over (order by q.difficulty, random()), q.id
    from questions q where q.id = any(v_picked);

  update questions set times_used = times_used + 1,
         last_used_on = greatest(coalesce(last_used_on, p_date), p_date)
   where id = any(v_picked);

  return v_quiz_id;
end $$;

-- Today's quiz always exists: scheduled by an admin, or generated on demand.
create or replace function public.ensure_today_quiz()
returns bigint language sql security definer set search_path = public as $$
  select public.generate_daily_quiz(public.utc_today())
$$;

-- ---------------------------------------------------------------------
-- Scoring
--   Correct answer: 500 base + up to 500 speed bonus (linear over 15s).
--   Wrong or timed out: 0.  Max 1,000 per question, 10,000 per quiz.
-- ---------------------------------------------------------------------
create or replace function public.score_answer(p_correct boolean, p_elapsed_ms int)
returns int language sql immutable as $$
  select case when not p_correct then 0
    else 500 + round(500.0 * greatest(0, 15000 - least(greatest(p_elapsed_ms, 0), 15000)) / 15000)::int
  end
$$;

-- ---------------------------------------------------------------------
-- Gameplay
-- ---------------------------------------------------------------------
create or replace function public.start_attempt(p_mode text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := public.require_user();
  v_quiz_id bigint;
  v_today date := public.utc_today();
  v_attempt quiz_attempts%rowtype;
begin
  if p_mode not in ('ranked','practice') then raise exception 'BAD_MODE'; end if;
  if exists (select 1 from profiles where id = v_uid and is_banned) then
    raise exception 'BANNED: this account cannot play' using errcode = '42501';
  end if;

  if p_mode = 'ranked' then
    v_quiz_id := public.ensure_today_quiz();
    select * into v_attempt from quiz_attempts
     where user_id = v_uid and quiz_id = v_quiz_id and mode = 'ranked';
    if found then
      if v_attempt.finished_at is not null then
        raise exception 'ALREADY_PLAYED: you have already played today''s quiz';
      end if;
      return jsonb_build_object('attempt_id', v_attempt.id, 'mode', 'ranked', 'resumed', true,
        'quiz_date', v_attempt.quiz_date, 'quiz_number', public.quiz_number(v_attempt.quiz_date), 'total', 10);
    end if;
    perform public.check_rate_limit('start_attempt', 40, 3600);
    insert into quiz_attempts (user_id, mode, quiz_id, quiz_date)
    values (v_uid, 'ranked', v_quiz_id, v_today) returning * into v_attempt;
    insert into attempt_answers (attempt_id, position, question_id)
    select v_attempt.id, position, question_id from daily_quiz_questions where quiz_id = v_quiz_id;
  else
    perform public.check_rate_limit('start_attempt', 40, 3600);
    -- Discard unfinished practice runs.
    delete from quiz_attempts where user_id = v_uid and mode = 'practice' and finished_at is null;
    insert into quiz_attempts (user_id, mode, quiz_date)
    values (v_uid, 'practice', v_today) returning * into v_attempt;
    -- Practice never uses today's or future ranked questions.
    insert into attempt_answers (attempt_id, position, question_id)
    select v_attempt.id, row_number() over (order by q.difficulty, random()), q.id
      from (
        select q.id, q.difficulty from questions q
         where q.is_active
           and not exists (select 1 from daily_quiz_questions dq join daily_quizzes d on d.id = dq.quiz_id
                            where dq.question_id = q.id and d.quiz_date >= v_today)
           and (q.pool = 'practice'
                or exists (select 1 from daily_quiz_questions dq join daily_quizzes d on d.id = dq.quiz_id
                            where dq.question_id = q.id and d.quiz_date < v_today))
         order by random() limit 10) q;
    if (select count(*) from attempt_answers where attempt_id = v_attempt.id) < 10 then
      raise exception 'NOT_ENOUGH_QUESTIONS: practice pool is too small';
    end if;
  end if;

  return jsonb_build_object('attempt_id', v_attempt.id, 'mode', p_mode, 'resumed', false,
    'quiz_date', v_attempt.quiz_date, 'quiz_number', public.quiz_number(v_attempt.quiz_date), 'total', 10);
end $$;

-- Marks served questions whose time ran out as timed out.
create or replace function public.expire_answers(p_attempt uuid)
returns void language sql security definer set search_path = public as $$
  update attempt_answers
     set answered_at = served_at + interval '15 seconds', selected_index = null,
         is_correct = false, points = 0, elapsed_ms = 15000
   where attempt_id = p_attempt and served_at is not null and answered_at is null
     and now() > served_at + interval '16.5 seconds'
$$;

create or replace function public.next_question(p_attempt uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := public.require_user();
  v_attempt quiz_attempts%rowtype;
  v_row attempt_answers%rowtype;
  v_q questions%rowtype;
  v_elapsed int;
begin
  select * into v_attempt from quiz_attempts where id = p_attempt and user_id = v_uid for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if v_attempt.finished_at is not null then
    return jsonb_build_object('done', true);
  end if;

  perform public.expire_answers(p_attempt);

  select * into v_row from attempt_answers
   where attempt_id = p_attempt and answered_at is null order by position limit 1;
  if not found then
    return public.finalize_attempt(p_attempt) || jsonb_build_object('done', true);
  end if;

  if v_row.served_at is null then
    update attempt_answers set served_at = now()
     where attempt_id = p_attempt and position = v_row.position
     returning * into v_row;
  end if;

  select * into v_q from questions where id = v_row.question_id;
  v_elapsed := (extract(epoch from (now() - v_row.served_at)) * 1000)::int;

  -- Never includes correct_index or explanation.
  return jsonb_build_object(
    'done', false,
    'position', v_row.position,
    'total', 10,
    'category', v_q.category,
    'difficulty', v_q.difficulty,
    'prompt', v_q.prompt,
    'options', to_jsonb(v_q.options),
    'time_limit_ms', 15000,
    'remaining_ms', greatest(0, 15000 - v_elapsed),
    'score_so_far', (select coalesce(sum(points), 0) from attempt_answers where attempt_id = p_attempt),
    'history', (select jsonb_agg(is_correct order by position) from attempt_answers where attempt_id = p_attempt)
  );
end $$;

create or replace function public.submit_answer(p_attempt uuid, p_position int, p_choice int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := public.require_user();
  v_attempt quiz_attempts%rowtype;
  v_row attempt_answers%rowtype;
  v_q questions%rowtype;
  v_elapsed int;
  v_correct boolean;
  v_points int;
  v_choice int := p_choice;
  v_remaining int;
  v_result jsonb;
begin
  perform public.check_rate_limit('submit_answer', 120, 60);
  select * into v_attempt from quiz_attempts where id = p_attempt and user_id = v_uid for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if v_attempt.finished_at is not null then raise exception 'ATTEMPT_FINISHED'; end if;
  if v_choice is not null and (v_choice < 0 or v_choice > 3) then raise exception 'BAD_CHOICE'; end if;

  select * into v_row from attempt_answers
   where attempt_id = p_attempt and position = p_position for update;
  if not found or v_row.served_at is null then raise exception 'QUESTION_NOT_SERVED'; end if;
  if v_row.answered_at is not null then raise exception 'ALREADY_ANSWERED'; end if;

  v_elapsed := (extract(epoch from (now() - v_row.served_at)) * 1000)::int;
  -- 1.5s grace for network latency; beyond that it is a timeout.
  if v_elapsed > 16500 then v_choice := null; end if;
  v_elapsed := least(v_elapsed, 15000);

  select * into v_q from questions where id = v_row.question_id;
  v_correct := v_choice is not null and v_choice = v_q.correct_index;
  v_points := public.score_answer(v_correct, v_elapsed);

  update attempt_answers
     set answered_at = now(), selected_index = v_choice, is_correct = v_correct,
         points = v_points, elapsed_ms = v_elapsed
   where attempt_id = p_attempt and position = p_position;

  select count(*) into v_remaining from attempt_answers
   where attempt_id = p_attempt and answered_at is null;

  v_result := jsonb_build_object(
    'position', p_position,
    'correct', v_correct,
    'timed_out', v_choice is null,
    'selected_index', v_choice,
    'correct_index', v_q.correct_index,
    'explanation', v_q.explanation,
    'points', v_points,
    'elapsed_ms', v_elapsed,
    'score_so_far', (select coalesce(sum(points), 0) from attempt_answers where attempt_id = p_attempt),
    'done', v_remaining = 0);

  if v_remaining = 0 then
    v_result := v_result || jsonb_build_object('summary', public.finalize_attempt(p_attempt));
  end if;
  return v_result;
end $$;

-- ---------------------------------------------------------------------
-- Finalisation: score, stats, streaks, leaderboards, achievements, flags
-- ---------------------------------------------------------------------
create or replace function public.finalize_attempt(p_attempt uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  a quiz_attempts%rowtype;
  s user_stats%rowtype;
  v_score int; v_correct int; v_time int; v_fastest int; v_avg_correct numeric;
  v_new_streak int;
  v_new_achievements jsonb := '[]'::jsonb;
  v_rank bigint;
begin
  select * into a from quiz_attempts where id = p_attempt for update;
  if a.finished_at is not null then
    return jsonb_build_object('attempt_id', a.id, 'score', a.score, 'correct_count', a.correct_count);
  end if;

  select coalesce(sum(points),0), count(*) filter (where is_correct), coalesce(sum(elapsed_ms),0),
         min(elapsed_ms) filter (where is_correct), avg(elapsed_ms) filter (where is_correct)
    into v_score, v_correct, v_time, v_fastest, v_avg_correct
    from attempt_answers where attempt_id = p_attempt;

  update quiz_attempts set finished_at = now(), score = v_score, correct_count = v_correct,
         total_time_ms = v_time
   where id = p_attempt returning * into a;

  if a.mode = 'practice' then
    update user_stats set practice_games = practice_games + 1, updated_at = now() where user_id = a.user_id;
    return jsonb_build_object('attempt_id', a.id, 'mode', 'practice', 'score', v_score,
      'correct_count', v_correct, 'total_time_ms', v_time, 'max_score', 10000,
      'new_achievements', '[]'::jsonb);
  end if;

  -- Streaks (UTC days)
  select * into s from user_stats where user_id = a.user_id for update;
  if s.last_played_date = a.quiz_date - 1 then v_new_streak := s.current_streak + 1;
  elsif s.last_played_date = a.quiz_date then v_new_streak := greatest(s.current_streak, 1);
  else v_new_streak := 1;
  end if;

  update user_stats set
    current_streak = v_new_streak,
    best_streak = greatest(best_streak, v_new_streak),
    last_played_date = greatest(coalesce(last_played_date, a.quiz_date), a.quiz_date),
    games_played = games_played + 1,
    total_score = total_score + v_score,
    best_score = greatest(best_score, v_score),
    perfect_games = perfect_games + (v_correct = 10)::int,
    total_correct = total_correct + v_correct,
    fastest_correct_ms = case when v_fastest is null then fastest_correct_ms
                              else least(coalesce(fastest_correct_ms, v_fastest), v_fastest) end,
    updated_at = now()
  where user_id = a.user_id returning * into s;

  -- Leaderboards
  insert into leaderboard_entries (period, period_key, user_id, score, games, total_time_ms)
  values ('daily', a.quiz_date::text, a.user_id, v_score, 1, v_time),
         ('weekly', public.week_key(a.quiz_date), a.user_id, v_score, 1, v_time),
         ('alltime', 'all', a.user_id, v_score, 1, v_time)
  on conflict (period, period_key, user_id) do update set
    score = leaderboard_entries.score + excluded.score,
    games = leaderboard_entries.games + 1,
    total_time_ms = leaderboard_entries.total_time_ms + excluded.total_time_ms,
    updated_at = now();

  -- Anti-cheat heuristics: flag for admin review (does not block the score).
  if v_correct >= 8 and v_avg_correct < 1200 then
    insert into score_flags (attempt_id, user_id, reason, details)
    values (a.id, a.user_id, 'implausibly_fast',
            jsonb_build_object('avg_correct_ms', round(v_avg_correct), 'correct', v_correct, 'score', v_score));
    update quiz_attempts set is_flagged = true where id = a.id;
  elsif v_fastest is not null and v_fastest < 350 then
    insert into score_flags (attempt_id, user_id, reason, details)
    values (a.id, a.user_id, 'sub_human_reaction', jsonb_build_object('fastest_ms', v_fastest, 'score', v_score));
    update quiz_attempts set is_flagged = true where id = a.id;
  end if;

  v_new_achievements := public.award_achievements(a.user_id, v_score, v_correct, v_fastest, v_avg_correct, s);

  select r into v_rank from (
    select user_id, rank() over (order by score desc, total_time_ms asc) r
      from leaderboard_entries where period = 'daily' and period_key = a.quiz_date::text
  ) x where user_id = a.user_id;

  return jsonb_build_object('attempt_id', a.id, 'mode', 'ranked', 'score', v_score,
    'correct_count', v_correct, 'total_time_ms', v_time, 'max_score', 10000,
    'current_streak', s.current_streak, 'best_streak', s.best_streak,
    'daily_rank', v_rank,
    'new_achievements', v_new_achievements);
end $$;

create or replace function public.award_achievements(
  p_user uuid, p_score int, p_correct int, p_fastest int, p_avg_correct numeric, s public.user_stats)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_ids text[] := '{}';
  v_out jsonb;
begin
  if s.games_played >= 1   then v_ids := v_ids || 'first_quiz'::text; end if;
  if s.games_played >= 10  then v_ids := v_ids || 'games_10'::text; end if;
  if s.games_played >= 50  then v_ids := v_ids || 'games_50'::text; end if;
  if s.games_played >= 100 then v_ids := v_ids || 'games_100'::text; end if;
  if s.games_played >= 365 then v_ids := v_ids || 'games_365'::text; end if;
  if s.current_streak >= 3   then v_ids := v_ids || 'streak_3'::text; end if;
  if s.current_streak >= 7   then v_ids := v_ids || 'streak_7'::text; end if;
  if s.current_streak >= 14  then v_ids := v_ids || 'streak_14'::text; end if;
  if s.current_streak >= 30  then v_ids := v_ids || 'streak_30'::text; end if;
  if s.current_streak >= 100 then v_ids := v_ids || 'streak_100'::text; end if;
  if p_correct = 10          then v_ids := v_ids || 'perfect_1'::text; end if;
  if s.perfect_games >= 5    then v_ids := v_ids || 'perfect_5'::text; end if;
  if p_fastest is not null and p_fastest < 2000 then v_ids := v_ids || 'speed_quick'::text; end if;
  if p_correct >= 8 and p_avg_correct < 4000 then v_ids := v_ids || 'speed_blitz'::text; end if;
  if p_score >= 7000 then v_ids := v_ids || 'score_7000'::text; end if;
  if p_score >= 9000 then v_ids := v_ids || 'score_9000'::text; end if;

  with ins as (
    insert into user_achievements (user_id, achievement_id)
    select p_user, id from achievements where id = any(v_ids)
    on conflict do nothing
    returning achievement_id
  ), rewards as (
    insert into user_cosmetics (user_id, cosmetic_id, source)
    select p_user, a.reward_cosmetic_id, 'achievement:' || a.id
      from achievements a join ins on ins.achievement_id = a.id
     where a.reward_cosmetic_id is not null
    on conflict do nothing
    returning cosmetic_id
  )
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', a.id, 'name', a.name, 'description', a.description, 'icon', a.icon,
           'reward', (select jsonb_build_object('id', c.id, 'name', c.name)
                        from cosmetics c where c.id = a.reward_cosmetic_id))), '[]'::jsonb)
    into v_out
    from achievements a join ins on ins.achievement_id = a.id
   where (select count(*) from rewards) >= 0;
  return v_out;
end $$;

-- Close out ranked attempts abandoned before the day ended (cron-safe).
create or replace function public.finalize_stale_attempts()
returns int language plpgsql security definer set search_path = public as $$
declare r record; n int := 0;
begin
  for r in select id from quiz_attempts
            where finished_at is null and started_at < now() - interval '30 minutes'
  loop
    update attempt_answers set served_at = coalesce(served_at, now() - interval '20 seconds')
     where attempt_id = r.id and answered_at is null;
    perform public.expire_answers(r.id);
    perform public.finalize_attempt(r.id);
    n := n + 1;
  end loop;
  return n;
end $$;

-- Full review after finishing (owner only): questions, picks, answers.
create or replace function public.get_attempt_review(p_attempt uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_uid uuid := public.require_user();
  a quiz_attempts%rowtype;
begin
  select * into a from quiz_attempts where id = p_attempt and (user_id = v_uid or public.is_admin());
  if not found then raise exception 'NOT_FOUND'; end if;
  if a.finished_at is null then raise exception 'NOT_FINISHED'; end if;
  return jsonb_build_object(
    'attempt_id', a.id, 'mode', a.mode, 'quiz_date', a.quiz_date,
    'quiz_number', public.quiz_number(a.quiz_date),
    'score', a.score, 'correct_count', a.correct_count, 'total_time_ms', a.total_time_ms,
    'max_score', 10000,
    'daily_rank', case when a.mode = 'ranked' then (
       select r from (select user_id, rank() over (order by score desc, total_time_ms) r
                        from leaderboard_entries where period = 'daily' and period_key = a.quiz_date::text) x
        where x.user_id = a.user_id) end,
    'answers', (select jsonb_agg(jsonb_build_object(
        'position', aa.position, 'category', q.category, 'difficulty', q.difficulty,
        'prompt', q.prompt, 'options', to_jsonb(q.options), 'correct_index', q.correct_index,
        'selected_index', aa.selected_index, 'is_correct', aa.is_correct, 'points', aa.points,
        'elapsed_ms', aa.elapsed_ms, 'explanation', q.explanation) order by aa.position)
      from attempt_answers aa join questions q on q.id = aa.question_id where aa.attempt_id = a.id));
end $$;

-- Public share card: score and right/wrong grid only, never questions or answers.
create or replace function public.get_share_card(p_attempt uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'username', p.username, 'avatar', av.config,
    'country', case when p.show_country then p.country end,
    'quiz_date', a.quiz_date, 'quiz_number', public.quiz_number(a.quiz_date),
    'score', a.score, 'correct_count', a.correct_count, 'max_score', 10000,
    'grid', (select jsonb_agg(jsonb_build_object('c', aa.is_correct, 'p', aa.points) order by aa.position)
               from attempt_answers aa where aa.attempt_id = a.id),
    'streak', st.current_streak)
  from quiz_attempts a
  join profiles p on p.id = a.user_id
  left join avatars av on av.user_id = a.user_id
  left join user_stats st on st.user_id = a.user_id
  where a.id = p_attempt and a.mode = 'ranked' and a.finished_at is not null and not p.is_banned
$$;

-- ---------------------------------------------------------------------
-- Avatars and profile settings
-- ---------------------------------------------------------------------
create or replace function public.get_my_cosmetics()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', c.id, 'slot', c.slot, 'value', c.value, 'name', c.name, 'rarity', c.rarity,
    'is_free', c.is_free, 'unlock_hint', c.unlock_hint,
    'unlocked', c.is_free or uc.user_id is not null) order by c.slot, c.sort), '[]'::jsonb)
  from cosmetics c
  left join user_cosmetics uc on uc.cosmetic_id = c.id and uc.user_id = auth.uid()
$$;

create or replace function public.save_avatar(p_config jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := public.require_user();
  v_slot text;
  v_clean jsonb := '{}'::jsonb;
  v_val text;
begin
  perform public.check_rate_limit('save_avatar', 60, 3600);
  for v_slot in select unnest(array['skin','hair','hairColor','eyes','mouth','outfit',
                                    'outfitColor','hat','accessory','background']) loop
    v_val := p_config->>v_slot;
    if v_val is null then v_val := public.default_avatar()->>v_slot; end if;
    if not exists (
      select 1 from cosmetics c
       where c.slot = v_slot and c.value = v_val
         and (c.is_free or exists (select 1 from user_cosmetics uc
                                    where uc.user_id = v_uid and uc.cosmetic_id = c.id))) then
      raise exception 'LOCKED_ITEM: % "%" is not unlocked', v_slot, v_val;
    end if;
    v_clean := v_clean || jsonb_build_object(v_slot, v_val);
  end loop;
  insert into avatars (user_id, config, updated_at) values (v_uid, v_clean, now())
  on conflict (user_id) do update set config = excluded.config, updated_at = now();
  return v_clean;
end $$;

create or replace function public.change_username(p_username text)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := public.require_user();
begin
  perform public.check_rate_limit('change_username', 5, 86400);
  if p_username !~ '^[A-Za-z0-9_]{3,20}$' then
    raise exception 'INVALID_USERNAME: 3-20 letters, numbers or underscores';
  end if;
  if exists (select 1 from profiles where username = p_username::citext and id <> v_uid) then
    raise exception 'USERNAME_TAKEN: that username is taken';
  end if;
  update profiles set username = p_username, username_changed_at = now() where id = v_uid;
end $$;

-- ---------------------------------------------------------------------
-- Dashboard
-- ---------------------------------------------------------------------
create or replace function public.get_dashboard()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := public.require_user();
  v_today date := public.utc_today();
  p profiles%rowtype;
  s user_stats%rowtype;
  v_attempt quiz_attempts%rowtype;
  v_rank bigint; v_players bigint;
begin
  perform public.ensure_today_quiz();
  select * into p from profiles where id = v_uid;
  select * into s from user_stats where user_id = v_uid;
  select * into v_attempt from quiz_attempts
   where user_id = v_uid and mode = 'ranked' and quiz_date = v_today;

  select count(*) into v_players from leaderboard_entries where period = 'daily' and period_key = v_today::text;
  select r into v_rank from (select user_id, rank() over (order by score desc, total_time_ms) r
      from leaderboard_entries where period = 'daily' and period_key = v_today::text) x where x.user_id = v_uid;

  return jsonb_build_object(
    'profile', jsonb_build_object('id', p.id, 'username', p.username, 'country', p.country,
                 'is_admin', p.is_admin, 'is_banned', p.is_banned),
    'avatar', (select config from avatars where user_id = v_uid),
    'today', jsonb_build_object(
       'quiz_date', v_today, 'quiz_number', public.quiz_number(v_today),
       'status', case when v_attempt.id is null then 'not_started'
                      when v_attempt.finished_at is null then 'in_progress' else 'finished' end,
       'attempt_id', v_attempt.id, 'score', v_attempt.score, 'correct_count', v_attempt.correct_count,
       'rank', v_rank, 'players', v_players,
       -- Streak is "alive" if played yesterday or today.
       'streak_at_risk', s.current_streak > 0 and s.last_played_date = v_today - 1),
    'stats', jsonb_build_object(
       'current_streak', case when s.last_played_date >= v_today - 1 then s.current_streak else 0 end,
       'best_streak', s.best_streak, 'games_played', s.games_played,
       'average_score', case when s.games_played > 0 then round(s.total_score::numeric / s.games_played) else 0 end,
       'best_score', s.best_score, 'perfect_games', s.perfect_games,
       'accuracy', case when s.games_played > 0 then round(100.0 * s.total_correct / (s.games_played * 10)) else 0 end,
       'practice_games', s.practice_games),
    'recent_achievements', (select coalesce(jsonb_agg(x order by x->>'earned_at' desc), '[]'::jsonb) from (
       select jsonb_build_object('id', a.id, 'name', a.name, 'icon', a.icon, 'description', a.description,
                                 'earned_at', ua.earned_at) x
         from user_achievements ua join achievements a on a.id = ua.achievement_id
        where ua.user_id = v_uid order by ua.earned_at desc limit 4) t),
    'achievement_count', (select count(*) from user_achievements where user_id = v_uid),
    'achievement_total', (select count(*) from achievements),
    'history', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (
       select jsonb_build_object('attempt_id', id, 'quiz_date', quiz_date,
                'quiz_number', public.quiz_number(quiz_date), 'score', score,
                'correct_count', correct_count) x
         from quiz_attempts where user_id = v_uid and mode = 'ranked' and finished_at is not null
        order by quiz_date desc limit 7) t)
  );
end $$;

-- ---------------------------------------------------------------------
-- Leaderboards
--   p_period: daily | weekly | alltime
--   p_scope:  global | country | friends
-- ---------------------------------------------------------------------
create or replace function public.friend_ids(p_user uuid)
returns setof uuid language sql stable security definer set search_path = public as $$
  select case when requester_id = p_user then addressee_id else requester_id end
    from friendships where status = 'accepted' and p_user in (requester_id, addressee_id)
$$;

create or replace function public.get_leaderboard(
  p_period text default 'daily', p_scope text default 'global', p_country text default null,
  p_key text default null, p_limit int default 50, p_offset int default 0)
returns table (rank bigint, user_id uuid, username text, avatar jsonb, country text,
               score bigint, games int, total_time_ms bigint, is_me boolean)
language plpgsql stable security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_key text;
begin
  if p_period not in ('daily','weekly','alltime') then raise exception 'BAD_PERIOD'; end if;
  if p_scope not in ('global','country','friends') then raise exception 'BAD_SCOPE'; end if;
  v_key := coalesce(p_key, case p_period when 'daily' then public.utc_today()::text
                                         when 'weekly' then public.week_key(public.utc_today())
                                         else 'all' end);
  if p_scope = 'friends' and v_uid is null then return; end if;

  return query
  select rank() over (order by le.score desc, le.total_time_ms asc),
         le.user_id, p.username::text, av.config,
         case when p.show_country then p.country::text end,
         le.score, le.games, le.total_time_ms, le.user_id = v_uid
    from leaderboard_entries le
    join profiles p on p.id = le.user_id
    left join avatars av on av.user_id = le.user_id
   where le.period = p_period and le.period_key = v_key and not p.is_banned
     and (p_scope <> 'country' or (p.show_country and p.country = upper(p_country)))
     and (p_scope <> 'friends' or le.user_id = v_uid or le.user_id in (select public.friend_ids(v_uid)))
   order by le.score desc, le.total_time_ms asc
   limit least(greatest(p_limit, 1), 100) offset greatest(p_offset, 0);
end $$;

create or replace function public.get_my_rank(
  p_period text default 'daily', p_scope text default 'global', p_country text default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_key text; v_out jsonb;
begin
  if v_uid is null then return null; end if;
  v_key := case p_period when 'daily' then public.utc_today()::text
                         when 'weekly' then public.week_key(public.utc_today()) else 'all' end;
  select jsonb_build_object('rank', r, 'score', score, 'of', n) into v_out from (
    select le.user_id, le.score,
           rank() over (order by le.score desc, le.total_time_ms asc) r,
           count(*) over () n
      from leaderboard_entries le join profiles p on p.id = le.user_id
     where le.period = p_period and le.period_key = v_key and not p.is_banned
       and (p_scope <> 'country' or (p.show_country and p.country = upper(p_country)))
       and (p_scope <> 'friends' or le.user_id = v_uid or le.user_id in (select public.friend_ids(v_uid)))
  ) x where x.user_id = v_uid;
  return v_out;
end $$;

-- ---------------------------------------------------------------------
-- Public profiles (privacy-aware)
-- ---------------------------------------------------------------------
create or replace function public.get_public_profile(p_username text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  p profiles%rowtype;
  s user_stats%rowtype;
  v_me boolean;
  v_today date := public.utc_today();
  v_friend text;
begin
  select * into p from profiles where username = p_username::citext;
  if not found or (p.is_banned and not public.is_admin()) then return null; end if;
  select * into s from user_stats where user_id = p.id;
  v_me := coalesce(p.id = v_uid, false);

  select case when f.status = 'accepted' then 'friends'
              when f.requester_id = v_uid then 'outgoing' else 'incoming' end
    into v_friend
    from friendships f
   where v_uid is not null and least(f.requester_id, f.addressee_id) = least(p.id, v_uid)
     and greatest(f.requester_id, f.addressee_id) = greatest(p.id, v_uid);

  return jsonb_build_object(
    'id', p.id, 'username', p.username, 'bio', p.bio, 'is_me', v_me,
    'joined', p.created_at,
    'friendship', coalesce(v_friend, 'none'),
    'country', case when v_me or p.show_country then p.country end,
    'avatar', (select config from avatars where user_id = p.id),
    'privacy', case when v_me then jsonb_build_object('show_country', p.show_country,
       'show_stats', p.show_stats, 'show_history', p.show_history,
       'show_achievements', p.show_achievements) end,
    'stats', case when v_me or p.show_stats then jsonb_build_object(
       'games_played', s.games_played,
       'average_score', case when s.games_played > 0 then round(s.total_score::numeric / s.games_played) else 0 end,
       'best_score', s.best_score,
       'current_streak', case when s.last_played_date >= v_today - 1 then s.current_streak else 0 end,
       'best_streak', s.best_streak, 'perfect_games', s.perfect_games,
       'accuracy', case when s.games_played > 0 then round(100.0 * s.total_correct / (s.games_played * 10)) else 0 end) end,
    'ranks', case when v_me or p.show_stats then jsonb_build_object(
       'daily', (select r from (select user_id, rank() over (order by score desc, total_time_ms) r
                   from leaderboard_entries where period='daily' and period_key = v_today::text) x where x.user_id = p.id),
       'weekly', (select r from (select user_id, rank() over (order by score desc, total_time_ms) r
                   from leaderboard_entries where period='weekly' and period_key = public.week_key(v_today)) x where x.user_id = p.id),
       'alltime', (select r from (select user_id, rank() over (order by score desc, total_time_ms) r
                   from leaderboard_entries where period='alltime' and period_key = 'all') x where x.user_id = p.id)) end,
    'achievements', case when v_me or p.show_achievements then (
       select coalesce(jsonb_agg(jsonb_build_object('id', a.id, 'name', a.name, 'icon', a.icon,
                'description', a.description, 'category', a.category, 'earned_at', ua.earned_at)
                order by a.sort), '[]'::jsonb)
         from user_achievements ua join achievements a on a.id = ua.achievement_id where ua.user_id = p.id) end,
    'achievement_total', (select count(*) from achievements),
    'recent', case when v_me or p.show_history then (
       select coalesce(jsonb_agg(x), '[]'::jsonb) from (
         select jsonb_build_object('quiz_date', quiz_date, 'quiz_number', public.quiz_number(quiz_date),
                  'score', score, 'correct_count', correct_count) x
           from quiz_attempts where user_id = p.id and mode = 'ranked' and finished_at is not null
          order by quiz_date desc limit 10) t) end
  );
end $$;

-- ---------------------------------------------------------------------
-- Friends
-- ---------------------------------------------------------------------
create or replace function public.search_users(p_query text)
returns table (user_id uuid, username text, avatar jsonb, country text, friendship text)
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := public.require_user();
begin
  perform public.check_rate_limit('search_users', 60, 60);
  if char_length(coalesce(p_query, '')) < 2 then return; end if;
  return query
  select p.id, p.username::text, av.config, case when p.show_country then p.country::text end,
         coalesce((select case when f.status = 'accepted' then 'friends'
                               when f.requester_id = v_uid then 'outgoing' else 'incoming' end
                     from friendships f
                    where least(f.requester_id, f.addressee_id) = least(p.id, v_uid)
                      and greatest(f.requester_id, f.addressee_id) = greatest(p.id, v_uid)), 'none')
    from profiles p left join avatars av on av.user_id = p.id
   where p.username ilike replace(replace(replace(p_query, '\', '\\'), '%', '\%'), '_', '\_') || '%'
     and p.id <> v_uid and not p.is_banned
   order by char_length(p.username), p.username limit 20;
end $$;

create or replace function public.send_friend_request(p_username text)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := public.require_user();
  v_target uuid;
  f friendships%rowtype;
begin
  perform public.check_rate_limit('friend_request', 30, 3600);
  select id into v_target from profiles where username = p_username::citext and not is_banned;
  if v_target is null then raise exception 'NOT_FOUND: no such player'; end if;
  if v_target = v_uid then raise exception 'BAD_REQUEST: you cannot add yourself'; end if;

  select * into f from friendships
   where least(requester_id, addressee_id) = least(v_uid, v_target)
     and greatest(requester_id, addressee_id) = greatest(v_uid, v_target);
  if found then
    if f.status = 'accepted' then return 'friends'; end if;
    if f.addressee_id = v_uid then  -- they asked me already: accept
      update friendships set status = 'accepted', responded_at = now() where id = f.id;
      return 'friends';
    end if;
    return 'outgoing';
  end if;
  insert into friendships (requester_id, addressee_id) values (v_uid, v_target);
  return 'outgoing';
end $$;

create or replace function public.respond_friend_request(p_request bigint, p_accept boolean)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := public.require_user();
begin
  if p_accept then
    update friendships set status = 'accepted', responded_at = now()
     where id = p_request and addressee_id = v_uid and status = 'pending';
  else
    delete from friendships where id = p_request and addressee_id = v_uid and status = 'pending';
  end if;
  if not found then raise exception 'NOT_FOUND'; end if;
end $$;

create or replace function public.get_friends()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'friends', coalesce((select jsonb_agg(jsonb_build_object('id', f.id, 'user_id', p.id, 'username', p.username,
          'avatar', av.config, 'country', case when p.show_country then p.country end,
          'streak', case when s.last_played_date >= public.utc_today() - 1 then s.current_streak else 0 end,
          'played_today', s.last_played_date = public.utc_today()) order by p.username)
        from friendships f
        join profiles p on p.id = case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end
        left join avatars av on av.user_id = p.id left join user_stats s on s.user_id = p.id
       where f.status = 'accepted' and auth.uid() in (f.requester_id, f.addressee_id)), '[]'::jsonb),
    'incoming', coalesce((select jsonb_agg(jsonb_build_object('id', f.id, 'user_id', p.id, 'username', p.username,
          'avatar', av.config, 'created_at', f.created_at) order by f.created_at desc)
        from friendships f join profiles p on p.id = f.requester_id left join avatars av on av.user_id = p.id
       where f.status = 'pending' and f.addressee_id = auth.uid()), '[]'::jsonb),
    'outgoing', coalesce((select jsonb_agg(jsonb_build_object('id', f.id, 'user_id', p.id, 'username', p.username,
          'avatar', av.config, 'created_at', f.created_at) order by f.created_at desc)
        from friendships f join profiles p on p.id = f.addressee_id left join avatars av on av.user_id = p.id
       where f.status = 'pending' and f.requester_id = auth.uid()), '[]'::jsonb))
$$;

-- ---------------------------------------------------------------------
-- Public landing info
-- ---------------------------------------------------------------------
create or replace function public.get_today_info()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'quiz_date', public.utc_today(),
    'quiz_number', public.quiz_number(public.utc_today()),
    'players_today', (select count(*) from leaderboard_entries
                       where period = 'daily' and period_key = public.utc_today()::text),
    'total_players', (select count(*) from profiles where not is_banned))
$$;

-- ---------------------------------------------------------------------
-- Admin
-- ---------------------------------------------------------------------
create or replace function public.admin_log(p_action text, p_target text, p_details jsonb)
returns void language sql security definer set search_path = public as $$
  insert into admin_audit_log (admin_id, action, target, details) values (auth.uid(), p_action, p_target, p_details)
$$;

create or replace function public.admin_analytics()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_today date := public.utc_today();
begin
  perform public.require_admin();
  return jsonb_build_object(
    'total_users', (select count(*) from profiles),
    'new_users_7d', (select count(*) from profiles where created_at > now() - interval '7 days'),
    'players_today', (select count(*) from quiz_attempts where mode='ranked' and quiz_date = v_today and finished_at is not null),
    'practice_today', (select count(*) from quiz_attempts where mode='practice' and quiz_date = v_today),
    'open_flags', (select count(*) from score_flags where status = 'open'),
    'active_questions', (select count(*) from questions where is_active),
    'unused_daily_questions', (select count(*) from questions where is_active and pool='daily' and times_used = 0),
    'scheduled_ahead', (select count(*) from daily_quizzes where quiz_date > v_today),
    'daily', (select coalesce(jsonb_agg(x order by x->>'date'), '[]'::jsonb) from (
       select jsonb_build_object('date', d::date, 'players', count(a.id),
                'avg_score', coalesce(round(avg(a.score)), 0)) x
         from generate_series(v_today - 13, v_today, interval '1 day') d
         left join quiz_attempts a on a.quiz_date = d::date and a.mode='ranked' and a.finished_at is not null
        group by d) t),
    'categories', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (
       select jsonb_build_object('category', q.category, 'answered', count(*),
                'accuracy', round(100.0 * avg(case when aa.is_correct then 1 else 0 end))) x
         from attempt_answers aa join questions q on q.id = aa.question_id
        where aa.answered_at is not null group by q.category order by q.category) t),
    'hardest', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (
       select jsonb_build_object('id', q.id, 'prompt', q.prompt, 'answered', count(*),
                'accuracy', round(100.0 * avg(case when aa.is_correct then 1 else 0 end))) x
         from attempt_answers aa join questions q on q.id = aa.question_id
        where aa.answered_at is not null group by q.id having count(*) >= 3
        order by avg(case when aa.is_correct then 1 else 0 end) limit 5) t));
end $$;

create or replace function public.admin_list_users(p_query text default '', p_limit int default 50, p_offset int default 0)
returns table (id uuid, username text, email text, country text, is_admin boolean, is_banned boolean,
               ban_reason text, games_played int, best_score int, flags bigint, created_at timestamptz,
               last_sign_in_at timestamptz)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  perform public.require_admin();
  return query
  select p.id, p.username::text, u.email::text, p.country::text, p.is_admin, p.is_banned, p.ban_reason,
         s.games_played, s.best_score,
         (select count(*) from score_flags f where f.user_id = p.id and f.status = 'open'),
         p.created_at, u.last_sign_in_at
    from profiles p join auth.users u on u.id = p.id left join user_stats s on s.user_id = p.id
   where coalesce(p_query, '') = '' or p.username ilike '%' || p_query || '%' or u.email ilike '%' || p_query || '%'
   order by p.created_at desc limit least(p_limit, 200) offset p_offset;
end $$;

create or replace function public.admin_set_ban(p_user uuid, p_banned boolean, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.require_admin();
  if p_user = auth.uid() then raise exception 'BAD_REQUEST: cannot ban yourself'; end if;
  update profiles set is_banned = p_banned, ban_reason = case when p_banned then p_reason end where id = p_user;
  perform public.admin_log(case when p_banned then 'ban' else 'unban' end, p_user::text,
                           jsonb_build_object('reason', p_reason));
end $$;

-- Replace an inappropriate username with a neutral one.
create or replace function public.admin_reset_username(p_user uuid)
returns text language plpgsql security definer set search_path = public as $$
declare v_old text; v_new text := 'player_' || substr(replace(p_user::text, '-', ''), 1, 8);
begin
  perform public.require_admin();
  select username into v_old from profiles where id = p_user;
  if exists (select 1 from profiles where username = v_new::citext and id <> p_user) then
    v_new := 'player_' || substr(md5(random()::text), 1, 10);
  end if;
  update profiles set username = v_new, username_changed_at = now() where id = p_user;
  perform public.admin_log('reset_username', p_user::text, jsonb_build_object('old', v_old, 'new', v_new));
  return v_new;
end $$;

create or replace function public.admin_set_admin(p_user uuid, p_admin boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.require_admin();
  if p_user = auth.uid() and not p_admin then raise exception 'BAD_REQUEST: cannot remove your own admin role'; end if;
  update profiles set is_admin = p_admin where id = p_user;
  perform public.admin_log('set_admin', p_user::text, jsonb_build_object('admin', p_admin));
end $$;

-- Review a flagged score: clear it, or void the attempt (removes it from leaderboards).
create or replace function public.admin_review_flag(p_flag bigint, p_action text)
returns void language plpgsql security definer set search_path = public as $$
declare f score_flags%rowtype; a quiz_attempts%rowtype;
begin
  perform public.require_admin();
  if p_action not in ('cleared','voided') then raise exception 'BAD_ACTION'; end if;
  select * into f from score_flags where id = p_flag for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  update score_flags set status = p_action, reviewed_by = auth.uid(), reviewed_at = now() where id = p_flag;
  select * into a from quiz_attempts where id = f.attempt_id;
  if p_action = 'voided' and not a.is_void then
    perform public.admin_void_attempt(a.id);
  elsif p_action = 'cleared' then
    update quiz_attempts set is_flagged = false where id = a.id;
  end if;
  perform public.admin_log('review_flag', p_flag::text, jsonb_build_object('action', p_action));
end $$;

create or replace function public.admin_void_attempt(p_attempt uuid)
returns void language plpgsql security definer set search_path = public as $$
declare a quiz_attempts%rowtype;
begin
  perform public.require_admin();
  select * into a from quiz_attempts where id = p_attempt for update;
  if not found or a.is_void or a.finished_at is null or a.mode <> 'ranked' then return; end if;
  update quiz_attempts set is_void = true where id = a.id;
  update leaderboard_entries set score = greatest(0, score - a.score), games = greatest(0, games - 1),
         total_time_ms = greatest(0, total_time_ms - a.total_time_ms), updated_at = now()
   where user_id = a.user_id and (
        (period = 'daily' and period_key = a.quiz_date::text)
     or (period = 'weekly' and period_key = public.week_key(a.quiz_date))
     or (period = 'alltime'));
  delete from leaderboard_entries where user_id = a.user_id and games = 0;
  update user_stats set total_score = greatest(0, total_score - a.score),
         games_played = greatest(0, games_played - 1),
         total_correct = greatest(0, total_correct - a.correct_count),
         best_score = coalesce((select max(score) from quiz_attempts
                                 where user_id = a.user_id and mode='ranked' and not is_void
                                   and finished_at is not null), 0)
   where user_id = a.user_id;
  perform public.admin_log('void_attempt', a.id::text, jsonb_build_object('score', a.score));
end $$;

create or replace function public.admin_list_flags(p_status text default 'open')
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  perform public.require_admin();
  return (select coalesce(jsonb_agg(x order by (x->>'created_at') desc), '[]'::jsonb) from (
    select jsonb_build_object('id', f.id, 'reason', f.reason, 'details', f.details, 'status', f.status,
             'created_at', f.created_at, 'attempt_id', f.attempt_id, 'user_id', f.user_id,
             'username', p.username, 'score', a.score, 'quiz_date', a.quiz_date,
             'timings', (select jsonb_agg(jsonb_build_object('pos', aa.position, 'ms', aa.elapsed_ms,
                           'ok', aa.is_correct) order by aa.position)
                           from attempt_answers aa where aa.attempt_id = a.id),
             'user_history', (select jsonb_build_object('games', count(*), 'avg', round(avg(score)),
                                'flags', (select count(*) from score_flags where user_id = f.user_id))
                                from quiz_attempts where user_id = f.user_id and mode='ranked' and finished_at is not null)) x
      from score_flags f join profiles p on p.id = f.user_id join quiz_attempts a on a.id = f.attempt_id
     where p_status = 'all' or f.status = p_status
     order by f.created_at desc limit 100) t);
end $$;

-- Admin quiz scheduling: set the 10 questions for a future date.
create or replace function public.admin_set_quiz(p_date date, p_question_ids bigint[])
returns bigint language plpgsql security definer set search_path = public as $$
declare v_quiz bigint; v_old bigint[];
begin
  perform public.require_admin();
  if p_date <= public.utc_today() then raise exception 'LOCKED: only future quizzes can be edited'; end if;
  if array_length(p_question_ids, 1) <> 10 or (select count(distinct x) from unnest(p_question_ids) x) <> 10 then
    raise exception 'BAD_REQUEST: a quiz needs exactly 10 different questions';
  end if;
  if (select count(*) from questions where id = any(p_question_ids) and is_active and pool = 'daily') <> 10 then
    raise exception 'BAD_REQUEST: all questions must be active daily-pool questions';
  end if;

  select id into v_quiz from daily_quizzes where quiz_date = p_date;
  if v_quiz is null then
    insert into daily_quizzes (quiz_date, auto_generated, created_by) values (p_date, false, auth.uid())
    returning id into v_quiz;
  else
    select array_agg(question_id) into v_old from daily_quiz_questions where quiz_id = v_quiz;
    update questions set times_used = greatest(0, times_used - 1) where id = any(v_old);
    delete from daily_quiz_questions where quiz_id = v_quiz;
    update daily_quizzes set auto_generated = false, created_by = auth.uid() where id = v_quiz;
  end if;
  insert into daily_quiz_questions (quiz_id, position, question_id)
  select v_quiz, ord, qid from unnest(p_question_ids) with ordinality as t(qid, ord);
  update questions set times_used = times_used + 1,
         last_used_on = greatest(coalesce(last_used_on, p_date), p_date)
   where id = any(p_question_ids);
  perform public.admin_log('set_quiz', p_date::text, jsonb_build_object('questions', p_question_ids));
  return v_quiz;
end $$;

create or replace function public.admin_generate_quiz(p_date date)
returns bigint language plpgsql security definer set search_path = public as $$
declare v_id bigint;
begin
  perform public.require_admin();
  if p_date <= public.utc_today() then raise exception 'LOCKED: only future quizzes can be generated'; end if;
  select id into v_id from daily_quizzes where quiz_date = p_date;
  if v_id is not null then
    update questions set times_used = greatest(0, times_used - 1)
     where id in (select question_id from daily_quiz_questions where quiz_id = v_id);
    delete from daily_quizzes where id = v_id;
  end if;
  v_id := public.generate_daily_quiz(p_date);
  perform public.admin_log('generate_quiz', p_date::text, '{}'::jsonb);
  return v_id;
end $$;

create or replace function public.admin_delete_quiz(p_date date)
returns void language plpgsql security definer set search_path = public as $$
declare v_id bigint;
begin
  perform public.require_admin();
  if p_date <= public.utc_today() then raise exception 'LOCKED: only future quizzes can be removed'; end if;
  select id into v_id from daily_quizzes where quiz_date = p_date;
  if v_id is null then return; end if;
  update questions set times_used = greatest(0, times_used - 1)
   where id in (select question_id from daily_quiz_questions where quiz_id = v_id);
  delete from daily_quizzes where id = v_id;
  perform public.admin_log('delete_quiz', p_date::text, '{}'::jsonb);
end $$;

-- ---------------------------------------------------------------------
-- Function privileges: nothing is callable unless granted here.
-- ---------------------------------------------------------------------
-- Revoke on our own functions only (extension functions such as citext's must stay usable).
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig from pg_proc p
     where p.pronamespace = 'public'::regnamespace
       and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f.sig);
  end loop;
end $$;

grant execute on function
  public.utc_today(), public.quiz_number(date), public.week_key(date), public.is_admin(),
  public.username_available(text), public.get_leaderboard(text, text, text, text, int, int),
  public.get_public_profile(text), public.get_share_card(uuid), public.get_today_info()
to anon, authenticated;

grant execute on function
  public.start_attempt(text), public.next_question(uuid), public.submit_answer(uuid, int, int),
  public.get_attempt_review(uuid), public.get_my_cosmetics(), public.save_avatar(jsonb),
  public.change_username(text), public.get_dashboard(), public.get_my_rank(text, text, text),
  public.search_users(text), public.send_friend_request(text), public.respond_friend_request(bigint, boolean),
  public.get_friends(),
  public.admin_analytics(), public.admin_list_users(text, int, int), public.admin_set_ban(uuid, boolean, text),
  public.admin_reset_username(uuid), public.admin_set_admin(uuid, boolean), public.admin_review_flag(bigint, text),
  public.admin_void_attempt(uuid), public.admin_list_flags(text), public.admin_set_quiz(date, bigint[]),
  public.admin_generate_quiz(date), public.admin_delete_quiz(date)
to authenticated;

-- Optional: with pg_cron enabled, close abandoned attempts and pre-build tomorrow's quiz.
-- select cron.schedule('tenfold-stale', '*/30 * * * *', 'select public.finalize_stale_attempts()');
-- select cron.schedule('tenfold-tomorrow', '5 0 * * *', $$select public.generate_daily_quiz(public.utc_today() + 1)$$);

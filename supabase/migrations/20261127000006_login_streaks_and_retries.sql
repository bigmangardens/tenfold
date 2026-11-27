-- =====================================================================
-- Tenfold: daily login streaks, and unlimited guesses per prompt.
--   * Login streak: consecutive UTC days a player opens the game while
--     signed in (separate from the play streak). Unlocks two avatar
--     backgrounds at 7 and 30 days.
--   * Guessing: an answer that isn't on the list no longer ends the
--     prompt. Players keep guessing until one is valid or time runs out.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Login streaks
-- ---------------------------------------------------------------------
alter table public.user_stats
  add column if not exists login_streak int not null default 0,
  add column if not exists best_login_streak int not null default 0,
  add column if not exists last_login_date date;

insert into public.cosmetics (id, slot, value, name, rarity, is_free, unlock_hint, sort) values
  ('background.dusk', 'background', 'dusk', 'Arcade dusk', 'rare', false, 'Log in 7 days in a row', 11),
  ('background.starlit', 'background', 'starlit', 'Starlit', 'epic', false, 'Log in 30 days in a row', 12)
on conflict (id) do nothing;

insert into public.achievements (id, name, description, icon, category, reward_cosmetic_id, sort) values
  ('login_7', 'Regular', 'Log in 7 days in a row', '📅', 'streak', 'background.dusk', 17),
  ('login_30', 'Night Owl', 'Log in 30 days in a row', '🦉', 'streak', 'background.starlit', 18)
on conflict (id) do nothing;

-- The old 'Regular' achievement (10 games) gets a clearer name.
update public.achievements set name = 'Seasoned' where id = 'games_10';

-- Records today's visit and returns the login streak (UTC days).
create or replace function public.touch_login()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := public.require_user();
  v_today date := public.utc_today();
  s user_stats%rowtype;
  v_ids text[] := '{}';
begin
  select * into s from user_stats where user_id = v_uid for update;
  if not found then return null; end if;
  if s.last_login_date is distinct from v_today then
    update user_stats set
      login_streak = case when s.last_login_date = v_today - 1 then s.login_streak + 1 else 1 end,
      best_login_streak = greatest(best_login_streak,
                                   case when s.last_login_date = v_today - 1 then s.login_streak + 1 else 1 end),
      last_login_date = v_today, updated_at = now()
    where user_id = v_uid returning * into s;

    if s.login_streak >= 7 then v_ids := v_ids || 'login_7'::text; end if;
    if s.login_streak >= 30 then v_ids := v_ids || 'login_30'::text; end if;
    if array_length(v_ids, 1) > 0 then
      with ins as (
        insert into user_achievements (user_id, achievement_id)
        select v_uid, id from achievements where id = any(v_ids)
        on conflict do nothing returning achievement_id)
      insert into user_cosmetics (user_id, cosmetic_id, source)
      select v_uid, a.reward_cosmetic_id, 'achievement:' || a.id
        from achievements a join ins on ins.achievement_id = a.id
       where a.reward_cosmetic_id is not null
      on conflict do nothing;
    end if;
  end if;
  return jsonb_build_object('login_streak', s.login_streak, 'best_login_streak', s.best_login_streak);
end $$;

-- Dashboard = previous dashboard + login streak (and records the visit).
alter function public.get_dashboard() rename to get_dashboard_base;
create or replace function public.get_dashboard()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_login jsonb;
begin
  v_login := public.touch_login();
  return public.get_dashboard_base() || jsonb_build_object('login', v_login);
end $$;

-- Public profile = previous profile + login streak (when stats are visible).
alter function public.get_public_profile(text) rename to get_public_profile_base;
create or replace function public.get_public_profile(p_username text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v jsonb := public.get_public_profile_base(p_username);
begin
  if v is null then return null; end if;
  if v->'stats' is not null and jsonb_typeof(v->'stats') = 'object' then
    v := jsonb_set(v, '{stats}', (v->'stats') || (
      select jsonb_build_object(
        'login_streak', case when s.last_login_date >= public.utc_today() - 1 then s.login_streak else 0 end,
        'best_login_streak', s.best_login_streak)
      from user_stats s where s.user_id = (v->>'id')::uuid));
  end if;
  return v;
end $$;

-- ---------------------------------------------------------------------
-- Unlimited guesses
-- ---------------------------------------------------------------------
alter table public.attempt_answers
  add column if not exists wrong_guesses int not null default 0;

drop function if exists public.submit_answer(uuid, int, text);

-- p_final = true when the timer has run out on the player's screen:
-- whatever is typed is then the last word (valid or not).
create or replace function public.submit_answer(p_attempt uuid, p_position int, p_text text, p_final boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := public.require_user();
  v_attempt quiz_attempts%rowtype;
  v_row attempt_answers%rowtype;
  v_q questions%rowtype;
  v_text text := nullif(left(btrim(coalesce(p_text, '')), 80), '');
  v_elapsed int;
  v_late boolean;
  v_match bigint;
  v_dist int;
  v_answer text;
  v_pct numeric;
  v_points int := 0;
  v_remaining int;
  v_result jsonb;
begin
  perform public.check_rate_limit('submit_answer', 240, 60);
  select * into v_attempt from quiz_attempts where id = p_attempt and user_id = v_uid for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if v_attempt.finished_at is not null then raise exception 'ATTEMPT_FINISHED'; end if;

  select * into v_row from attempt_answers
   where attempt_id = p_attempt and position = p_position for update;
  if not found or v_row.served_at is null then raise exception 'QUESTION_NOT_SERVED'; end if;
  if v_row.answered_at is not null then raise exception 'ALREADY_ANSWERED'; end if;

  v_elapsed := (extract(epoch from (now() - v_row.served_at)) * 1000)::int;
  -- 1.5s grace for network latency; beyond that it is a timeout.
  v_late := v_elapsed > public.time_limit_ms() + 1500;
  if v_late then v_text := null; end if;
  v_elapsed := least(v_elapsed, public.time_limit_ms());

  select * into v_q from questions where id = v_row.question_id;

  if v_text is not null then
    select m.answer_id, m.distance into v_match, v_dist from public.match_answer(v_q.id, v_text) m;
  end if;

  -- Not on the list, time remains: let the player guess again.
  if v_match is null and v_text is not null and not p_final and not v_late then
    if v_row.wrong_guesses >= 60 then
      raise exception 'RATE_LIMITED: too many guesses on this prompt';
    end if;
    update attempt_answers set wrong_guesses = wrong_guesses + 1
     where attempt_id = p_attempt and position = p_position;
    return jsonb_build_object('position', p_position, 'retry', true, 'typed', v_text,
                              'wrong_guesses', v_row.wrong_guesses + 1);
  end if;

  if v_match is not null then
    select s.answer, s.pct into v_answer, v_pct from public.answer_shares(v_q.id) s where s.id = v_match;
    v_points := public.rarity_points(v_pct);
    -- Only ranked answers shape rarity, so practice can't be used to skew it.
    if v_attempt.mode = 'ranked' then
      update question_answers set times_given = times_given + 1 where id = v_match;
    end if;
  end if;

  update attempt_answers
     set answered_at = now(), answer_text = v_text, answer_id = v_match, rarity_pct = v_pct,
         is_correct = v_match is not null, points = v_points, elapsed_ms = v_elapsed
   where attempt_id = p_attempt and position = p_position;

  select count(*) into v_remaining from attempt_answers
   where attempt_id = p_attempt and answered_at is null;

  v_result := jsonb_build_object(
    'position', p_position,
    'retry', false,
    'valid', v_match is not null,
    'timed_out', v_match is null,
    'typed', v_text,
    'answer', v_answer,
    'corrected', coalesce(v_dist, 0) > 0,
    'pct', v_pct,
    'points', v_points,
    'elapsed_ms', v_elapsed,
    'wrong_guesses', v_row.wrong_guesses,
    'note', v_q.explanation,
    'reveal', public.answer_reveal(v_q.id),
    'score_so_far', (select coalesce(sum(points), 0) from attempt_answers where attempt_id = p_attempt),
    'done', v_remaining = 0);

  if v_remaining = 0 then
    v_result := v_result || jsonb_build_object('summary', public.finalize_attempt(p_attempt));
  end if;
  return v_result;
end $$;

-- ---------------------------------------------------------------------
-- Function privileges
-- ---------------------------------------------------------------------
revoke execute on function public.touch_login(), public.get_dashboard_base(), public.get_public_profile_base(text),
  public.get_dashboard(), public.get_public_profile(text), public.submit_answer(uuid, int, text, boolean)
  from public, anon, authenticated;
grant execute on function public.get_public_profile(text) to anon, authenticated;
grant execute on function public.get_dashboard(), public.submit_answer(uuid, int, text, boolean) to authenticated;

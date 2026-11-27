-- =====================================================================
-- Tenfold: rare-answer mode.
--   Each prompt is open ("Name a country in Europe"). Players type an
--   answer, the server autocorrects it to the closest valid answer, and
--   scores it by rarity: the fewer players who gave that answer, the
--   more it is worth.
--
-- This migration is a FRESH START: it clears the old multiple-choice
-- questions, quizzes, attempts, leaderboards and stats. Accounts,
-- avatars, cosmetics and achievements are kept.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Fresh start
-- ---------------------------------------------------------------------
delete from public.quiz_attempts;          -- cascades to attempt_answers, score_flags
delete from public.leaderboard_entries;
delete from public.daily_quizzes;          -- cascades to daily_quiz_questions
delete from public.questions;
update public.user_stats set
  current_streak = 0, best_streak = 0, last_played_date = null, games_played = 0,
  total_score = 0, best_score = 0, perfect_games = 0, total_correct = 0,
  fastest_correct_ms = null, practice_games = 0, updated_at = now();

update public.achievements set description = 'Give a valid answer to all 10 prompts' where id = 'perfect_1';
update public.achievements set description = 'Give a valid answer in under 2 seconds' where id = 'speed_quick';
update public.achievements set description = '8+ valid answers averaging under 4 seconds' where id = 'speed_blitz';

drop function if exists public.submit_answer(uuid, int, int);
drop function if exists public.score_answer(boolean, int);

-- ---------------------------------------------------------------------
-- 2. Schema
-- ---------------------------------------------------------------------
alter table public.questions drop column if exists options;
alter table public.questions drop column if exists correct_index;
alter table public.questions alter column explanation drop not null;   -- now an optional fun fact

-- Lowercase, strip accents, punctuation, spaces and a leading "the/a/an".
create or replace function public.normalize_answer(p text)
returns text language sql immutable as $$
  select regexp_replace(
           regexp_replace(
             replace(replace(replace(replace(replace(
               translate(lower(coalesce(p, '')),
                 'áàâäãåāăąçćčďđéèêëēęěėğíìîïīıįłñńňóòôöõøōőřśšşșťțúùûüūůűųýÿžźż''’`',
                 'aaaaaaaaacccddeeeeeeeegiiiiiiilnnnoooooooorssssttuuuuuuuuyyzzz'),
               'ß', 'ss'), 'æ', 'ae'), 'œ', 'oe'), '&', ' and '), '+', ' plus '),
             '^\s*(the|a|an)\s+', ''),
           '[^a-z0-9]', '', 'g')
$$;

create table if not exists public.question_answers (
  id bigint generated always as identity primary key,
  question_id bigint not null references public.questions (id) on delete cascade,
  answer text not null check (char_length(answer) between 1 and 80),
  aliases text[] not null default '{}',
  norm text not null,
  alias_norms text[] not null default '{}',
  -- Starting popularity guess, used until real answers accumulate.
  seed_weight int not null default 1 check (seed_weight >= 1),
  -- How many ranked players gave this answer.
  times_given int not null default 0,
  unique (question_id, norm)
);
create index if not exists question_answers_q_idx on public.question_answers (question_id);

create or replace function public.question_answers_normalize()
returns trigger language plpgsql as $$
begin
  new.norm := public.normalize_answer(new.answer);
  new.alias_norms := coalesce((select array_agg(distinct n) from (
      select public.normalize_answer(a) n from unnest(new.aliases) a) t
    where n <> '' and n <> new.norm), '{}');
  if new.norm = '' then raise exception 'BAD_REQUEST: answer "%" has no letters or numbers', new.answer; end if;
  return new;
end $$;
drop trigger if exists question_answers_norm on public.question_answers;
create trigger question_answers_norm before insert or update on public.question_answers
  for each row execute function public.question_answers_normalize();

alter table public.attempt_answers drop column if exists selected_index;
alter table public.attempt_answers
  add column if not exists answer_text text check (answer_text is null or char_length(answer_text) <= 80),
  add column if not exists answer_id bigint references public.question_answers (id) on delete set null,
  add column if not exists rarity_pct numeric(6,2);

-- Answers are admin-only: players only ever see them through the
-- functions below, after they have answered.
alter table public.question_answers enable row level security;
revoke all on public.question_answers from anon, authenticated;
create policy question_answers_admin on public.question_answers for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
grant select, insert, update, delete on public.question_answers to authenticated;

-- ---------------------------------------------------------------------
-- 3. Matching and scoring helpers
-- ---------------------------------------------------------------------
create or replace function public.time_limit_ms()
returns int language sql immutable as $$ select 30000 $$;

-- Edit distance (Levenshtein plus swapped neighbouring letters), with an
-- early exit once it exceeds p_max.
create or replace function public.edit_distance(a text, b text, p_max int)
returns int language plpgsql immutable as $$
declare
  la int := length(a); lb int := length(b);
  pp int[]; prev int[]; cur int[]; i int; j int; c int; rowmin int; v int;
begin
  if abs(la - lb) > p_max then return p_max + 1; end if;
  if la = 0 then return lb; end if;
  if lb = 0 then return la; end if;
  prev := array(select generate_series(0, lb));
  for i in 1..la loop
    cur := array[i]; rowmin := i;
    for j in 1..lb loop
      c := case when substr(a, i, 1) = substr(b, j, 1) then 0 else 1 end;
      v := least(prev[j + 1] + 1, cur[j] + 1, prev[j] + c);
      if i > 1 and j > 1 and substr(a, i, 1) = substr(b, j - 1, 1) and substr(a, i - 1, 1) = substr(b, j, 1) then
        v := least(v, pp[j - 1] + 1);
      end if;
      cur := cur || v;
      rowmin := least(rowmin, v);
    end loop;
    if rowmin > p_max then return p_max + 1; end if;
    pp := prev;
    prev := cur;
  end loop;
  return prev[lb + 1];
end $$;

-- Closest valid answer to what the player typed (autocorrect), or nothing.
create or replace function public.match_answer(p_question bigint, p_text text)
returns table (answer_id bigint, distance int)
language plpgsql stable security definer set search_path = public as $$
declare
  v_norm text := public.normalize_answer(p_text);
  v_len int := length(v_norm);
  v_max int;
begin
  if v_len = 0 then return; end if;
  return query
    select qa.id, 0 from question_answers qa
     where qa.question_id = p_question and (qa.norm = v_norm or v_norm = any(qa.alias_norms))
     order by qa.seed_weight + qa.times_given desc limit 1;
  if found then return; end if;

  v_max := case when v_len <= 3 then 0 when v_len <= 5 then 1 when v_len <= 9 then 2 else 3 end;
  if v_max = 0 then return; end if;
  return query
    select c.id, c.d from (
      select qa.id, qa.seed_weight + qa.times_given w,
             min(public.edit_distance(v_norm, n, v_max)) d
        from question_answers qa, unnest(array_prepend(qa.norm, qa.alias_norms)) n
       where qa.question_id = p_question and abs(length(n) - v_len) <= v_max
       group by qa.id, w) c
     where c.d <= v_max
     order by c.d, c.w desc limit 1;
end $$;

-- Share of players (in %) behind each answer: seed guess + real answers.
create or replace function public.answer_shares(p_question bigint)
returns table (id bigint, answer text, pct numeric, rnk bigint)
language sql stable security definer set search_path = public as $$
  select qa.id, qa.answer,
         round(100.0 * (qa.seed_weight + qa.times_given)
               / sum(qa.seed_weight + qa.times_given) over (), 2),
         row_number() over (order by qa.seed_weight + qa.times_given desc, qa.id)
    from question_answers qa where qa.question_id = p_question
$$;

-- Rarer = more points. 100 for the most obvious answers, 1,000 for
-- answers given by 0.5% of players or fewer (log scale in between).
create or replace function public.rarity_points(p_pct numeric)
returns int language sql immutable as $$
  select case when p_pct is null then 0 else
    least(1000, greatest(100, round(100 + 900 * ln(100.0 / greatest(p_pct, 0.01)) / ln(200))))::int end
$$;

-- What players see after answering: the most common answers and a few rare ones.
create or replace function public.answer_reveal(p_question bigint)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'total', (select count(*) from question_answers where question_id = p_question),
    'top', (select coalesce(jsonb_agg(jsonb_build_object('answer', answer, 'pct', pct) order by rnk), '[]')
              from public.answer_shares(p_question) where rnk <= 3),
    'rare', (select coalesce(jsonb_agg(jsonb_build_object('answer', answer, 'pct', pct) order by pct), '[]')
               from (select * from public.answer_shares(p_question)
                      order by pct, md5(id::text || current_date::text) limit 3) t))
$$;

-- Starting popularity from list position (lists are written most-common first).
create or replace function public.seed_weight_for_rank(p_rank int)
returns int language sql immutable as $$
  select greatest(1, round(60 * power(0.8, greatest(p_rank, 1) - 1)))::int
$$;

-- ---------------------------------------------------------------------
-- 4. Gameplay
-- ---------------------------------------------------------------------
create or replace function public.expire_answers(p_attempt uuid)
returns void language sql security definer set search_path = public as $$
  update attempt_answers
     set answered_at = served_at + make_interval(secs => public.time_limit_ms() / 1000.0),
         answer_text = null, answer_id = null, rarity_pct = null,
         is_correct = false, points = 0, elapsed_ms = public.time_limit_ms()
   where attempt_id = p_attempt and served_at is not null and answered_at is null
     and now() > served_at + make_interval(secs => public.time_limit_ms() / 1000.0 + 1.5)
$$;

create or replace function public.attempt_history(p_attempt uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_agg(case when answered_at is null then null
                        else jsonb_build_object('ok', is_correct, 'pct', rarity_pct, 'p', points) end
                   order by position)
    from attempt_answers where attempt_id = p_attempt
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

  -- Only the prompt: valid answers are never sent before submitting.
  return jsonb_build_object(
    'done', false,
    'position', v_row.position,
    'total', 10,
    'category', v_q.category,
    'difficulty', v_q.difficulty,
    'prompt', v_q.prompt,
    'answer_count', (select count(*) from question_answers where question_id = v_q.id),
    'time_limit_ms', public.time_limit_ms(),
    'remaining_ms', greatest(0, public.time_limit_ms() - v_elapsed),
    'score_so_far', (select coalesce(sum(points), 0) from attempt_answers where attempt_id = p_attempt),
    'history', public.attempt_history(p_attempt)
  );
end $$;

create or replace function public.submit_answer(p_attempt uuid, p_position int, p_text text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := public.require_user();
  v_attempt quiz_attempts%rowtype;
  v_row attempt_answers%rowtype;
  v_q questions%rowtype;
  v_text text := nullif(left(btrim(coalesce(p_text, '')), 80), '');
  v_elapsed int;
  v_match bigint;
  v_dist int;
  v_answer text;
  v_pct numeric;
  v_points int := 0;
  v_remaining int;
  v_result jsonb;
begin
  perform public.check_rate_limit('submit_answer', 120, 60);
  select * into v_attempt from quiz_attempts where id = p_attempt and user_id = v_uid for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if v_attempt.finished_at is not null then raise exception 'ATTEMPT_FINISHED'; end if;

  select * into v_row from attempt_answers
   where attempt_id = p_attempt and position = p_position for update;
  if not found or v_row.served_at is null then raise exception 'QUESTION_NOT_SERVED'; end if;
  if v_row.answered_at is not null then raise exception 'ALREADY_ANSWERED'; end if;

  v_elapsed := (extract(epoch from (now() - v_row.served_at)) * 1000)::int;
  -- 1.5s grace for network latency; beyond that it is a timeout.
  if v_elapsed > public.time_limit_ms() + 1500 then v_text := null; end if;
  v_elapsed := least(v_elapsed, public.time_limit_ms());

  select * into v_q from questions where id = v_row.question_id;

  if v_text is not null then
    select m.answer_id, m.distance into v_match, v_dist from public.match_answer(v_q.id, v_text) m;
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
    'valid', v_match is not null,
    'timed_out', v_text is null,
    'typed', v_text,
    'answer', v_answer,
    'corrected', coalesce(v_dist, 0) > 0,
    'pct', v_pct,
    'points', v_points,
    'elapsed_ms', v_elapsed,
    'note', v_q.explanation,
    'reveal', public.answer_reveal(v_q.id),
    'score_so_far', (select coalesce(sum(points), 0) from attempt_answers where attempt_id = p_attempt),
    'done', v_remaining = 0);

  if v_remaining = 0 then
    v_result := v_result || jsonb_build_object('summary', public.finalize_attempt(p_attempt));
  end if;
  return v_result;
end $$;

create or replace function public.finalize_stale_attempts()
returns int language plpgsql security definer set search_path = public as $$
declare r record; n int := 0;
begin
  for r in select id from quiz_attempts
            where finished_at is null and started_at < now() - interval '30 minutes'
  loop
    update attempt_answers set served_at = now() - interval '2 minutes'
     where attempt_id = r.id and answered_at is null;
    perform public.expire_answers(r.id);
    perform public.finalize_attempt(r.id);
    n := n + 1;
  end loop;
  return n;
end $$;

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
        'prompt', q.prompt, 'typed', aa.answer_text, 'answer', qa.answer,
        'pct', aa.rarity_pct, 'valid', aa.is_correct, 'points', aa.points,
        'elapsed_ms', aa.elapsed_ms, 'note', q.explanation,
        'reveal', public.answer_reveal(q.id)) order by aa.position)
      from attempt_answers aa join questions q on q.id = aa.question_id
      left join question_answers qa on qa.id = aa.answer_id
     where aa.attempt_id = a.id));
end $$;

-- Public share card: score and rarity grid only, never prompts or answers.
create or replace function public.get_share_card(p_attempt uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'username', p.username, 'avatar', av.config,
    'country', case when p.show_country then p.country end,
    'quiz_date', a.quiz_date, 'quiz_number', public.quiz_number(a.quiz_date),
    'score', a.score, 'correct_count', a.correct_count, 'max_score', 10000,
    'grid', (select jsonb_agg(jsonb_build_object('c', aa.is_correct, 'p', aa.points, 'r', aa.rarity_pct) order by aa.position)
               from attempt_answers aa where aa.attempt_id = a.id),
    'streak', st.current_streak)
  from quiz_attempts a
  join profiles p on p.id = a.user_id
  left join avatars av on av.user_id = a.user_id
  left join user_stats st on st.user_id = a.user_id
  where a.id = p_attempt and a.mode = 'ranked' and a.finished_at is not null and not p.is_banned
$$;

-- ---------------------------------------------------------------------
-- 5. Admin: save a prompt with its answer list in one call.
--   p_data: {category, difficulty, prompt, explanation, pool, is_active,
--            answers: [{answer, aliases: [..]}, ...]}  (most common first)
--   Answers already in the list keep their real player counts.
-- ---------------------------------------------------------------------
create or replace function public.admin_save_question(p_id bigint, p_data jsonb)
returns bigint language plpgsql security definer set search_path = public as $$
declare
  v_id bigint := p_id;
  v_ans jsonb;
  v_rank int := 0;
  v_keep text[] := '{}';
  v_norm text;
begin
  perform public.require_admin();
  if v_id is null then
    insert into questions (category, difficulty, prompt, explanation, pool, is_active, created_by)
    values (p_data->>'category', (p_data->>'difficulty')::smallint, p_data->>'prompt',
            nullif(btrim(coalesce(p_data->>'explanation', '')), ''), coalesce(p_data->>'pool', 'daily'),
            coalesce((p_data->>'is_active')::boolean, true), auth.uid())
    returning id into v_id;
  else
    update questions set category = p_data->>'category', difficulty = (p_data->>'difficulty')::smallint,
           prompt = p_data->>'prompt', explanation = nullif(btrim(coalesce(p_data->>'explanation', '')), ''),
           pool = coalesce(p_data->>'pool', 'daily'), is_active = coalesce((p_data->>'is_active')::boolean, true)
     where id = v_id;
    if not found then raise exception 'NOT_FOUND'; end if;
  end if;

  for v_ans in select * from jsonb_array_elements(coalesce(p_data->'answers', '[]')) loop
    v_norm := public.normalize_answer(v_ans->>'answer');
    continue when v_norm = '' or v_norm = any(v_keep);
    v_rank := v_rank + 1;
    v_keep := v_keep || v_norm;
    insert into question_answers (question_id, answer, aliases, seed_weight)
    values (v_id, btrim(v_ans->>'answer'),
            coalesce(array(select btrim(x) from jsonb_array_elements_text(coalesce(v_ans->'aliases', '[]')) x
                            where btrim(x) <> ''), '{}'),
            public.seed_weight_for_rank(v_rank))
    on conflict (question_id, norm) do update
      set answer = excluded.answer, aliases = excluded.aliases, seed_weight = excluded.seed_weight;
  end loop;
  if v_rank < 3 then raise exception 'BAD_REQUEST: add at least 3 valid answers'; end if;
  delete from question_answers where question_id = v_id and norm <> all(v_keep);
  perform public.admin_log('save_question', v_id::text, jsonb_build_object('answers', v_rank));
  return v_id;
end $$;

-- Used by the prompt seed file: answers as 'Answer|alias|alias', most common first.
create or replace function public.seed_prompt(
  p_category text, p_difficulty int, p_pool text, p_prompt text, p_note text, p_answers text[])
returns bigint language plpgsql security definer set search_path = public as $$
declare v_id bigint; v_parts text[]; i int := 0; a text;
begin
  insert into questions (category, difficulty, prompt, explanation, pool)
  values (p_category, p_difficulty, p_prompt, p_note, p_pool) returning id into v_id;
  foreach a in array p_answers loop
    v_parts := string_to_array(a, '|');
    i := i + 1;
    insert into question_answers (question_id, answer, aliases, seed_weight)
    values (v_id, btrim(v_parts[1]), coalesce(v_parts[2:], '{}'), public.seed_weight_for_rank(i))
    on conflict (question_id, norm) do nothing;
  end loop;
  return v_id;
end $$;

-- ---------------------------------------------------------------------
-- 6. Function privileges: nothing is callable unless granted here.
-- ---------------------------------------------------------------------
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
  public.start_attempt(text), public.next_question(uuid), public.submit_answer(uuid, int, text),
  public.get_attempt_review(uuid), public.get_my_cosmetics(), public.save_avatar(jsonb),
  public.change_username(text), public.get_dashboard(), public.get_my_rank(text, text, text),
  public.search_users(text), public.send_friend_request(text), public.respond_friend_request(bigint, boolean),
  public.get_friends(),
  public.admin_analytics(), public.admin_list_users(text, int, int), public.admin_set_ban(uuid, boolean, text),
  public.admin_reset_username(uuid), public.admin_set_admin(uuid, boolean), public.admin_review_flag(bigint, text),
  public.admin_void_attempt(uuid), public.admin_list_flags(text), public.admin_set_quiz(date, bigint[]),
  public.admin_generate_quiz(date), public.admin_delete_quiz(date), public.admin_save_question(bigint, jsonb)
to authenticated;

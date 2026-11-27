-- =====================================================================
-- Tenfold: core schema, row level security and grants
-- All daily boundaries use UTC.
-- =====================================================================

create extension if not exists citext;
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------
create or replace function public.utc_today()
returns date language sql stable as $$
  select (now() at time zone 'utc')::date
$$;

-- Quiz #1 is 2026-11-01 (UTC).
create or replace function public.quiz_number(p_date date)
returns int language sql immutable as $$
  select (p_date - date '2026-11-01') + 1
$$;

create or replace function public.week_key(p_date date)
returns text language sql immutable as $$
  select to_char(p_date, 'IYYY-"W"IW')
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------
-- Profiles (one per auth user)
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username citext not null unique
    check (username ~ '^[A-Za-z0-9_]{3,20}$'),
  country char(2) check (country is null or country ~ '^[A-Z]{2}$'),
  bio text check (bio is null or char_length(bio) <= 160),
  show_country boolean not null default true,
  show_stats boolean not null default true,
  show_history boolean not null default true,
  show_achievements boolean not null default true,
  is_admin boolean not null default false,
  is_banned boolean not null default false,
  ban_reason text,
  username_changed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

-- ---------------------------------------------------------------------
-- Cosmetics and avatars
-- ---------------------------------------------------------------------
create table public.cosmetics (
  id text primary key,                      -- '<slot>.<value>'
  slot text not null check (slot in (
    'skin','hair','hairColor','eyes','mouth','outfit','outfitColor',
    'hat','accessory','background')),
  value text not null,
  name text not null,
  rarity text not null default 'common'
    check (rarity in ('common','rare','epic','legendary')),
  is_free boolean not null default true,
  unlock_hint text,
  sort int not null default 0,
  unique (slot, value)
);

create table public.avatars (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  config jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.user_cosmetics (
  user_id uuid not null references public.profiles (id) on delete cascade,
  cosmetic_id text not null references public.cosmetics (id) on delete cascade,
  source text,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, cosmetic_id)
);

-- ---------------------------------------------------------------------
-- Achievements
-- ---------------------------------------------------------------------
create table public.achievements (
  id text primary key,
  name text not null,
  description text not null,
  icon text not null,
  category text not null check (category in
    ('participation','streak','perfect','speed','score')),
  reward_cosmetic_id text references public.cosmetics (id),
  sort int not null default 0
);

create table public.user_achievements (
  user_id uuid not null references public.profiles (id) on delete cascade,
  achievement_id text not null references public.achievements (id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

-- ---------------------------------------------------------------------
-- Questions and daily quizzes
-- ---------------------------------------------------------------------
create table public.questions (
  id bigint generated always as identity primary key,
  category text not null check (category in (
    'history','science','geography','sport','entertainment',
    'technology','literature','general')),
  difficulty smallint not null check (difficulty between 1 and 3),
  prompt text not null check (char_length(prompt) between 8 and 300),
  options text[] not null check (
    array_length(options, 1) = 4
    and array_position(options, null) is null),
  correct_index smallint not null check (correct_index between 0 and 3),
  explanation text not null check (char_length(explanation) between 1 and 500),
  -- 'daily' questions feed ranked quizzes (and practice once used);
  -- 'practice' questions are only ever used in practice.
  pool text not null default 'daily' check (pool in ('daily','practice')),
  is_active boolean not null default true,
  times_used int not null default 0,
  last_used_on date,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index questions_pick_idx on public.questions (pool, is_active, category, difficulty);
create trigger questions_touch before update on public.questions
  for each row execute function public.touch_updated_at();

create table public.daily_quizzes (
  id bigint generated always as identity primary key,
  quiz_date date not null unique,
  auto_generated boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.daily_quiz_questions (
  quiz_id bigint not null references public.daily_quizzes (id) on delete cascade,
  position smallint not null check (position between 1 and 10),
  question_id bigint not null references public.questions (id) on delete restrict,
  primary key (quiz_id, position),
  unique (quiz_id, question_id)
);
create index dqq_question_idx on public.daily_quiz_questions (question_id);

-- ---------------------------------------------------------------------
-- Attempts and answers
-- ---------------------------------------------------------------------
create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  mode text not null check (mode in ('ranked','practice')),
  quiz_id bigint references public.daily_quizzes (id) on delete cascade,
  quiz_date date not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  score int not null default 0,
  correct_count smallint not null default 0,
  total_time_ms int not null default 0,
  is_flagged boolean not null default false,
  is_void boolean not null default false,
  check ((mode = 'ranked') = (quiz_id is not null))
);
-- One official attempt per user per daily quiz.
create unique index quiz_attempts_one_ranked
  on public.quiz_attempts (user_id, quiz_id) where mode = 'ranked';
create index quiz_attempts_user_idx on public.quiz_attempts (user_id, quiz_date desc);
create index quiz_attempts_date_idx on public.quiz_attempts (quiz_date, mode);

create table public.attempt_answers (
  attempt_id uuid not null references public.quiz_attempts (id) on delete cascade,
  position smallint not null check (position between 1 and 10),
  question_id bigint not null references public.questions (id) on delete restrict,
  served_at timestamptz,
  answered_at timestamptz,
  selected_index smallint check (selected_index between 0 and 3),
  is_correct boolean,
  points int not null default 0 check (points between 0 and 1000),
  elapsed_ms int,
  primary key (attempt_id, position)
);
create index attempt_answers_question_idx on public.attempt_answers (question_id);

-- ---------------------------------------------------------------------
-- Stats, streaks, leaderboards
-- ---------------------------------------------------------------------
create table public.user_stats (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  current_streak int not null default 0,
  best_streak int not null default 0,
  last_played_date date,
  games_played int not null default 0,
  total_score bigint not null default 0,
  best_score int not null default 0,
  perfect_games int not null default 0,
  total_correct int not null default 0,
  fastest_correct_ms int,
  practice_games int not null default 0,
  updated_at timestamptz not null default now()
);

create table public.leaderboard_entries (
  period text not null check (period in ('daily','weekly','alltime')),
  period_key text not null,          -- '2026-11-27' | '2026-W48' | 'all'
  user_id uuid not null references public.profiles (id) on delete cascade,
  score bigint not null default 0,
  games int not null default 0,
  total_time_ms bigint not null default 0,  -- tiebreaker: lower is better
  updated_at timestamptz not null default now(),
  primary key (period, period_key, user_id)
);
create index leaderboard_rank_idx
  on public.leaderboard_entries (period, period_key, score desc, total_time_ms asc);

-- ---------------------------------------------------------------------
-- Friends
-- ---------------------------------------------------------------------
create table public.friendships (
  id bigint generated always as identity primary key,
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_id <> addressee_id)
);
create unique index friendships_pair_idx on public.friendships
  (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index friendships_addressee_idx on public.friendships (addressee_id, status);

-- ---------------------------------------------------------------------
-- Moderation, anti-cheat, rate limiting
-- ---------------------------------------------------------------------
create table public.score_flags (
  id bigint generated always as identity primary key,
  attempt_id uuid not null references public.quiz_attempts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null,
  details jsonb not null default '{}'::jsonb,
  status text not null default 'open' check (status in ('open','cleared','voided')),
  created_at timestamptz not null default now(),
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz
);
create index score_flags_status_idx on public.score_flags (status, created_at desc);

create table public.rate_limits (
  user_id uuid not null,
  action text not null,
  window_start timestamptz not null,
  hits int not null default 0,
  primary key (user_id, action, window_start)
);

create table public.admin_audit_log (
  id bigint generated always as identity primary key,
  admin_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Row level security
-- Direct table access is minimal. Gameplay, leaderboards and public
-- profiles go through SECURITY DEFINER functions (next migration), so
-- correct answers and private fields never reach the browser.
-- ---------------------------------------------------------------------
alter table public.profiles            enable row level security;
alter table public.cosmetics           enable row level security;
alter table public.avatars             enable row level security;
alter table public.user_cosmetics      enable row level security;
alter table public.achievements        enable row level security;
alter table public.user_achievements   enable row level security;
alter table public.questions           enable row level security;
alter table public.daily_quizzes       enable row level security;
alter table public.daily_quiz_questions enable row level security;
alter table public.quiz_attempts       enable row level security;
alter table public.attempt_answers     enable row level security;
alter table public.user_stats          enable row level security;
alter table public.leaderboard_entries enable row level security;
alter table public.friendships         enable row level security;
alter table public.score_flags         enable row level security;
alter table public.rate_limits         enable row level security;
alter table public.admin_audit_log     enable row level security;

-- Start from zero privileges, then grant precisely.
revoke all on all tables in schema public from anon, authenticated;

-- Profiles: owner reads own row, admins read all. Owner may update only
-- the safe columns below (not username, is_admin, is_banned).
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
grant select on public.profiles to authenticated;
grant update (country, bio, show_country, show_stats, show_history, show_achievements)
  on public.profiles to authenticated;

-- Catalogues are public.
create policy cosmetics_read on public.cosmetics for select to anon, authenticated using (true);
create policy achievements_read on public.achievements for select to anon, authenticated using (true);
grant select on public.cosmetics, public.achievements to anon, authenticated;

-- Own rows only.
create policy avatars_own on public.avatars for select to authenticated using (user_id = auth.uid());
create policy user_cosmetics_own on public.user_cosmetics for select to authenticated using (user_id = auth.uid());
create policy user_achievements_own on public.user_achievements for select to authenticated using (user_id = auth.uid());
create policy user_stats_own on public.user_stats for select to authenticated using (user_id = auth.uid());
create policy attempts_own on public.quiz_attempts for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
grant select on public.avatars, public.user_cosmetics, public.user_achievements,
  public.user_stats, public.quiz_attempts to authenticated;

-- Answers: no direct access for players (functions only). Admins may read.
create policy answers_admin on public.attempt_answers for select to authenticated using (public.is_admin());
grant select on public.attempt_answers to authenticated;

-- Questions and quizzes: administrators only.
create policy questions_admin on public.questions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy quizzes_admin on public.daily_quizzes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy quiz_questions_admin on public.daily_quiz_questions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
grant select, insert, update, delete on public.questions, public.daily_quizzes,
  public.daily_quiz_questions to authenticated;

-- Friendships: participants can read and remove; creation/acceptance via functions.
create policy friendships_read on public.friendships for select to authenticated
  using (auth.uid() in (requester_id, addressee_id));
create policy friendships_delete on public.friendships for delete to authenticated
  using (auth.uid() in (requester_id, addressee_id));
grant select, delete on public.friendships to authenticated;

-- Moderation tables: admins read; writes via functions.
create policy flags_admin on public.score_flags for select to authenticated using (public.is_admin());
create policy audit_admin on public.admin_audit_log for select to authenticated using (public.is_admin());
grant select on public.score_flags, public.admin_audit_log to authenticated;

-- leaderboard_entries and rate_limits: no direct access at all.

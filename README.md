# Tenfold

**Ten questions. One shot a day.** A daily global trivia game: every player gets the same 10 general-knowledge
questions each UTC day, 15 seconds each, scored on accuracy and speed and validated on the server.

Built with Next.js 15 (App Router), React 19, Tailwind CSS and Supabase (Postgres, Auth, Row Level Security).
Deploys to Vercel.

## Features

- **Accounts**: email + password sign-up, email verification, login/logout, password reset, unique usernames,
  public profiles with per-field privacy settings.
- **Daily quiz**: same 10 questions for everyone (balanced across 8 categories, easy to hard), 15s timer,
  instant feedback with the correct answer and an explanation, one official attempt per day, resumable on reload
  (the clock keeps running server-side). **Practice mode** uses past questions and never affects rankings.
- **Scoring**: correct = 500 + up to 500 speed bonus (linear over 15s); wrong/timeout = 0; max 10,000.
  Timing and scoring happen in Postgres; correct answers are never sent before you answer.
- **Leaderboards**: daily, weekly, all-time, each filterable global / country / friends, with avatar, flag and rank.
- **Streaks and achievements**: UTC-day participation streaks, best streak, 16 achievements (streaks, perfect
  games, speed, milestones, score) that unlock cosmetic rewards.
- **Avatar editor**: skin, hair style and colour, eyes, mouth, outfit and colour, hats, accessories, backgrounds,
  live preview, rare unlockables (validated server-side, never purchasable).
- **Social**: user search, friend requests, friends leaderboard, spoiler-free share text and generated
  1200×630 result cards for link previews.
- **Admin** (`/admin`): analytics, question CRUD with preview, quiz scheduling (hand-pick or auto-generate, with
  balance indicators), user management (ban, reset inappropriate usernames, grant admin), and a suspicious-score
  queue with per-answer timings (clear or void).

## Security model

- All gameplay runs through `SECURITY DEFINER` Postgres functions (`start_attempt`, `next_question`,
  `submit_answer`) that check `auth.uid()`. The browser never receives `correct_index` before submitting.
- Answer time = server `now()` − server `served_at`; reloading doesn't reset it; late answers (>16.5s) are timeouts.
- A partial unique index enforces one ranked attempt per user per quiz.
- Players have no write access to scores, stats, leaderboards, achievements or cosmetics. Profiles allow updates only
  to safe columns (country, bio, privacy flags) via column grants.
- Questions and quizzes are admin-only by RLS. Admin RPCs re-check `is_admin()`; the admin UI also 404s for non-admins.
- Per-user rate limits in the database for attempts, answers, searches, friend requests, avatar saves and username
  changes. Supabase Auth rate-limits sign-ups, logins and emails.
- Suspicious scores (8+ correct averaging under 1.2s, or any correct answer under 350ms) are flagged for review.

## Local development

Requires Node 20+ and Docker (for the Supabase CLI).

```bash
npm install
npx supabase start            # starts Postgres, Auth, REST and a local mail inbox (Mailpit)
cp .env.example .env.local    # fill in API_URL and PUBLISHABLE_KEY printed by `supabase start`
npm run dev
```

`supabase start` applies `supabase/migrations/*` and `supabase/seed.sql` (136 questions, cosmetics, achievements,
30 demo players with a week of results). Verification emails land in Mailpit at http://127.0.0.1:54324.

Make yourself an admin after signing up:

```sql
update public.profiles set is_admin = true where username = 'YourName';
```

## Production deployment

1. **Supabase**: create a project, then `npx supabase link --project-ref <ref>` and
   `npx supabase db push --include-seed` (or paste both migration files, then `supabase/seed.sql`, into the SQL
   editor, in order). The seed adds cosmetics, achievements and questions. The demo-player block at the end is optional; delete it for a clean launch.
2. **Auth settings** (Dashboard → Authentication):
   - Enable *Confirm email*.
   - *Site URL*: your production URL. *Redirect URLs*: `https://your-domain/**`.
   - Use a custom SMTP provider for real email volume.
3. **Vercel**: import the repo and set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   (`sb_publishable_...`; a legacy anon key in `NEXT_PUBLIC_SUPABASE_ANON_KEY` also works) and `NEXT_PUBLIC_SITE_URL`.
   The app never needs the secret key: all privileged logic runs inside Postgres functions.
4. **Optional cron** (Database → Extensions → `pg_cron`):
   ```sql
   select cron.schedule('tenfold-stale', '*/30 * * * *', 'select public.finalize_stale_attempts()');
   select cron.schedule('tenfold-tomorrow', '5 0 * * *', $$select public.generate_daily_quiz(public.utc_today() + 1)$$);
   ```
   Without it, the day's quiz is generated on the first visit, and abandoned attempts simply stay unranked.

Keep adding questions: the generator avoids reusing a question within 90 days and warns admins when fewer than 20
unused daily questions remain.

## Project structure

```
supabase/
  migrations/…_schema.sql      tables, RLS, grants
  migrations/…_game_logic.sql  gameplay, scoring, streaks, leaderboards, achievements, admin RPCs
  seed.sql                     catalogue, questions, demo data
src/
  app/                         routes (landing, auth, dashboard, play, practice, results, r/[id] share,
                               leaderboards, u/[username], avatar, friends, settings, admin/*, api/card/[id])
  components/                  Avatar (SVG), QuizRunner, LeaderboardTable, Nav, …
  lib/                         Supabase clients, types, formatting, countries
  middleware.ts                session refresh and route protection
```

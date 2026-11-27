-- =====================================================================
-- Tenfold: username-only accounts.
-- Players who sign up without an email get an internal placeholder
-- address (never emailed). This lets the login form accept a username:
-- it looks up the placeholder address for that username. Real email
-- addresses are never returned, so this can't be used to find emails.
-- =====================================================================

create or replace function public.login_email_for(p_username text)
returns text language sql stable security definer set search_path = public, auth as $$
  select u.email::text
    from profiles p join auth.users u on u.id = p.id
   where p.username = p_username::citext
     and u.email like '%@noemail.tenfold.invalid'
$$;

revoke execute on function public.login_email_for(text) from public, anon, authenticated;
grant execute on function public.login_email_for(text) to anon, authenticated;

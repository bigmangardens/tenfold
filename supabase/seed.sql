-- =====================================================================
-- Tenfold seed data: cosmetics, achievements, demo players.
-- Safe to run once on a fresh database (after migrations).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Cosmetics
-- ---------------------------------------------------------------------
insert into public.cosmetics (id, slot, value, name, rarity, is_free, unlock_hint, sort) values
  ('skin.s1','skin','s1','Porcelain','common',true,null,1),
  ('skin.s2','skin','s2','Ivory','common',true,null,2),
  ('skin.s3','skin','s3','Sand','common',true,null,3),
  ('skin.s4','skin','s4','Honey','common',true,null,4),
  ('skin.s5','skin','s5','Caramel','common',true,null,5),
  ('skin.s6','skin','s6','Bronze','common',true,null,6),
  ('skin.s7','skin','s7','Umber','common',true,null,7),
  ('skin.s8','skin','s8','Espresso','common',true,null,8),

  ('hair.none','hair','none','Shaved','common',true,null,1),
  ('hair.buzz','hair','buzz','Buzz','common',true,null,2),
  ('hair.short','hair','short','Short','common',true,null,3),
  ('hair.side','hair','side','Side part','common',true,null,4),
  ('hair.bob','hair','bob','Bob','common',true,null,5),
  ('hair.long','hair','long','Long','common',true,null,6),
  ('hair.curly','hair','curly','Curly','common',true,null,7),
  ('hair.afro','hair','afro','Afro','common',true,null,8),
  ('hair.bun','hair','bun','Top bun','common',true,null,9),
  ('hair.ponytail','hair','ponytail','Ponytail','common',true,null,10),
  ('hair.mohawk','hair','mohawk','Mohawk','rare',false,'Reach a 7-day streak',11),

  ('hairColor.black','hairColor','black','Black','common',true,null,1),
  ('hairColor.brown','hairColor','brown','Brown','common',true,null,2),
  ('hairColor.auburn','hairColor','auburn','Auburn','common',true,null,3),
  ('hairColor.blonde','hairColor','blonde','Blonde','common',true,null,4),
  ('hairColor.ginger','hairColor','ginger','Ginger','common',true,null,5),
  ('hairColor.grey','hairColor','grey','Silver','common',true,null,6),
  ('hairColor.violet','hairColor','violet','Ultraviolet','epic',false,'Score a perfect 10/10',7),
  ('hairColor.neon','hairColor','neon','Neon tide','epic',false,'Reach a 14-day streak',8),

  ('eyes.round','eyes','round','Bright','common',true,null,1),
  ('eyes.happy','eyes','happy','Joyful','common',true,null,2),
  ('eyes.sleepy','eyes','sleepy','Relaxed','common',true,null,3),
  ('eyes.wink','eyes','wink','Wink','common',true,null,4),
  ('eyes.focused','eyes','focused','Focused','common',true,null,5),
  ('eyes.star','eyes','star','Starstruck','epic',false,'8+ correct with avg answer under 4s',6),

  ('mouth.smile','mouth','smile','Smile','common',true,null,1),
  ('mouth.grin','mouth','grin','Grin','common',true,null,2),
  ('mouth.neutral','mouth','neutral','Calm','common',true,null,3),
  ('mouth.open','mouth','open','Excited','common',true,null,4),
  ('mouth.smirk','mouth','smirk','Smirk','common',true,null,5),

  ('outfit.tee','outfit','tee','Tee','common',true,null,1),
  ('outfit.hoodie','outfit','hoodie','Hoodie','common',true,null,2),
  ('outfit.collar','outfit','collar','Polo','common',true,null,3),
  ('outfit.sweater','outfit','sweater','Knit sweater','common',true,null,4),
  ('outfit.jacket','outfit','jacket','Varsity jacket','rare',false,'Play 10 daily quizzes',5),
  ('outfit.suit','outfit','suit','Sharp suit','epic',false,'Play 50 daily quizzes',6),
  ('outfit.robe','outfit','robe','Scholar robe','legendary',false,'Play 100 daily quizzes',7),

  ('outfitColor.violet','outfitColor','violet','Violet','common',true,null,1),
  ('outfitColor.cyan','outfitColor','cyan','Cyan','common',true,null,2),
  ('outfitColor.coral','outfitColor','coral','Coral','common',true,null,3),
  ('outfitColor.lime','outfitColor','lime','Lime','common',true,null,4),
  ('outfitColor.amber','outfitColor','amber','Amber','common',true,null,5),
  ('outfitColor.slate','outfitColor','slate','Slate','common',true,null,6),
  ('outfitColor.rose','outfitColor','rose','Rose','common',true,null,7),
  ('outfitColor.navy','outfitColor','navy','Navy','common',true,null,8),

  ('hat.none','hat','none','No hat','common',true,null,1),
  ('hat.beanie','hat','beanie','Beanie','common',true,null,2),
  ('hat.cap','hat','cap','Cap','common',true,null,3),
  ('hat.headband','hat','headband','Headband','common',true,null,4),
  ('hat.party','hat','party','Party hat','rare',false,'Finish your first daily quiz',5),
  ('hat.laurel','hat','laurel','Laurel wreath','epic',false,'Reach a 30-day streak',6),
  ('hat.crown','hat','crown','Crown','legendary',false,'Score 5 perfect games',7),
  ('hat.wizard','hat','wizard','Wizard hat','legendary',false,'Score 9,000+ in a daily quiz',8),

  ('accessory.none','accessory','none','None','common',true,null,1),
  ('accessory.glasses','accessory','glasses','Glasses','common',true,null,2),
  ('accessory.round','accessory','round','Round frames','common',true,null,3),
  ('accessory.earring','accessory','earring','Earring','common',true,null,4),
  ('accessory.freckles','accessory','freckles','Freckles','common',true,null,5),
  ('accessory.shades','accessory','shades','Shades','rare',false,'Answer correctly in under 2 seconds',6),
  ('accessory.monocle','accessory','monocle','Monocle','epic',false,'Score 7,000+ in a daily quiz',7),

  ('background.midnight','background','midnight','Midnight','common',true,null,1),
  ('background.ocean','background','ocean','Ocean','common',true,null,2),
  ('background.forest','background','forest','Forest','common',true,null,3),
  ('background.plum','background','plum','Plum','common',true,null,4),
  ('background.ember','background','ember','Ember','common',true,null,5),
  ('background.steel','background','steel','Steel','common',true,null,6),
  ('background.sunset','background','sunset','Sunset','common',true,null,7),
  ('background.aurora','background','aurora','Aurora','rare',false,'Reach a 3-day streak',8),
  ('background.gold','background','gold','Gilded','legendary',false,'Play 365 daily quizzes',9),
  ('background.cosmos','background','cosmos','Cosmos','legendary',false,'Reach a 100-day streak',10);

-- ---------------------------------------------------------------------
-- Achievements
-- ---------------------------------------------------------------------
insert into public.achievements (id, name, description, icon, category, reward_cosmetic_id, sort) values
  ('first_quiz','First Light','Finish your first daily quiz','🎯','participation','hat.party',1),
  ('games_10','Regular','Play 10 daily quizzes','📅','participation','outfit.jacket',2),
  ('games_50','Devotee','Play 50 daily quizzes','📚','participation','outfit.suit',3),
  ('games_100','Centurion','Play 100 daily quizzes','🏛️','participation','outfit.robe',4),
  ('games_365','Year of Knowledge','Play 365 daily quizzes','🌍','participation','background.gold',5),
  ('streak_3','Warming Up','Play 3 days in a row','🔥','streak','background.aurora',6),
  ('streak_7','On Fire','Play 7 days in a row','☄️','streak','hair.mohawk',7),
  ('streak_14','Unstoppable','Play 14 days in a row','🚀','streak','hairColor.neon',8),
  ('streak_30','Laurelled','Play 30 days in a row','🌿','streak','hat.laurel',9),
  ('streak_100','Eternal Flame','Play 100 days in a row','♾️','streak','background.cosmos',10),
  ('perfect_1','Flawless','Give a valid answer to all 10 prompts','💎','perfect','hairColor.violet',11),
  ('perfect_5','Royalty','Score 5 perfect games','👑','perfect','hat.crown',12),
  ('speed_quick','Quick Draw','Give a valid answer in under 2 seconds','⚡','speed','accessory.shades',13),
  ('speed_blitz','Blitz','8+ valid answers averaging under 4 seconds','💨','speed','eyes.star',14),
  ('score_7000','High Flyer','Score 7,000+ in a daily quiz','🦅','score','accessory.monocle',15),
  ('score_9000','Mastermind','Score 9,000+ in a daily quiz','🧠','score','hat.wizard',16);

-- Prompts and their answer lists live in
-- supabase/migrations/20261127000004_prompts.sql.

-- ---------------------------------------------------------------------
-- Demo players (they start with no results).
-- Demo accounts have no password and cannot sign in.
-- ---------------------------------------------------------------------
do $$
declare
  v_names text[] := array['NovaQuill','AtlasKnows','PixelSage','QuizHarbor','LunaLogic','Brainstorm_K',
    'TriviaTide','MapleMind','SaharaSpark','FjordFacts','KiwiCortex','TokyoTicker','RioRecall',
    'NileNotes','AndesAce','DelhiDynamo','CelticClue','SeoulSolver','LagosLexicon','ParisPonder',
    'OsloOracle','CairoCurio','LimaLearner','BerlinBrain','MumbaiMaven','ZurichZen','AccraAnswer',
    'QuebecQuest','ManilaMind','SydneySavant'];
  v_countries text[] := array['US','GB','DE','CA','FR','KR','AU','CA','MA','NO','NZ','JP','BR','EG','PE',
    'IN','IE','KR','NG','FR','NO','EG','PE','DE','IN','CH','GH','CA','PH','AU'];
  v_uid uuid;
  v_skill numeric;
  v_quiz_id bigint;
  v_attempt uuid;
  d date;
  i int;
  r record;
  v_ok boolean;
  v_ms int;
  v_base timestamptz;
begin
  for i in 1..array_length(v_names, 1) loop
    v_uid := gen_random_uuid();
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                            raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                            confirmation_token, recovery_token, email_change_token_new, email_change)
    values ('00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
            lower(v_names[i]) || '@demo.tenfold.invalid', '', now(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', v_names[i], 'country', v_countries[i]),
            now() - interval '21 days', now(), '', '', '', '');

    update public.avatars set config = (
      select jsonb_object_agg(slot, value) from (
        select distinct on (slot) slot, value from public.cosmetics
         where is_free order by slot, random()) t)
     where user_id = v_uid;
    update public.profiles set bio = 'Demo player' where id = v_uid;
  end loop;

  -- Some friendships among demo players.
  insert into public.friendships (requester_id, addressee_id, status, responded_at)
  select a.id, b.id, 'accepted', now()
    from public.profiles a join public.profiles b on a.username < b.username
   where a.bio = 'Demo player' and b.bio = 'Demo player' and random() < 0.12
  on conflict do nothing;
end $$;

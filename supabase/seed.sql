-- =====================================================================
-- Tenfold seed data: cosmetics, achievements, questions, demo players.
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
  ('perfect_1','Flawless','Answer all 10 questions correctly','💎','perfect','hairColor.violet',11),
  ('perfect_5','Royalty','Score 5 perfect games','👑','perfect','hat.crown',12),
  ('speed_quick','Quick Draw','Answer correctly in under 2 seconds','⚡','speed','accessory.shades',13),
  ('speed_blitz','Blitz','Get 8+ right with an average under 4 seconds','💨','speed','eyes.star',14),
  ('score_7000','High Flyer','Score 7,000+ in a daily quiz','🦅','score','accessory.monocle',15),
  ('score_9000','Mastermind','Score 9,000+ in a daily quiz','🧠','score','hat.wizard',16);

-- ---------------------------------------------------------------------
-- Questions (difficulty: 1 easy, 2 medium, 3 hard)
-- ---------------------------------------------------------------------
insert into public.questions (category, difficulty, prompt, options, correct_index, explanation, pool) values
-- History
('history',1,'In which year did World War II end?',array['1943','1945','1947','1950'],1,'The war ended in 1945: Germany surrendered in May and Japan in September.','daily'),
('history',1,'Who was the first President of the United States?',array['Thomas Jefferson','John Adams','George Washington','Abraham Lincoln'],2,'George Washington served two terms, from 1789 to 1797.','daily'),
('history',1,'Which ancient civilisation built the pyramids at Giza?',array['The Romans','The Egyptians','The Greeks','The Aztecs'],1,'The Giza pyramids were built by the ancient Egyptians around 4,500 years ago.','daily'),
('history',1,'In which year did the Berlin Wall fall?',array['1985','1987','1989','1991'],2,'The Berlin Wall fell on 9 November 1989, leading to German reunification in 1990.','daily'),
('history',2,'Who was the first woman to win a Nobel Prize?',array['Marie Curie','Rosalind Franklin','Ada Lovelace','Florence Nightingale'],0,'Marie Curie shared the 1903 Nobel Prize in Physics and won the Chemistry prize in 1911.','daily'),
('history',2,'Mansa Musa, famed for his immense wealth, ruled which empire?',array['Songhai Empire','Mali Empire','Ghana Empire','Ethiopian Empire'],1,'Mansa Musa ruled the Mali Empire in the 14th century; his pilgrimage to Mecca became legendary.','daily'),
('history',2,'In which city was Archduke Franz Ferdinand assassinated in 1914?',array['Vienna','Belgrade','Sarajevo','Budapest'],2,'His assassination in Sarajevo on 28 June 1914 triggered the start of World War I.','daily'),
('history',2,'Which monarch ruled England when the Spanish Armada was defeated in 1588?',array['Mary I','Elizabeth I','Victoria','Anne'],1,'Elizabeth I reigned from 1558 to 1603.','daily'),
('history',2,'In which year was the Magna Carta sealed?',array['1066','1215','1346','1492'],1,'King John sealed the Magna Carta at Runnymede in 1215.','daily'),
('history',3,'Most of the Great Wall of China that survives today was built under which dynasty?',array['Qin','Han','Tang','Ming'],3,'Most surviving sections date from the Ming dynasty (1368–1644).','daily'),
('history',3,'Who was the first emperor of Rome?',array['Julius Caesar','Augustus','Nero','Caligula'],1,'Augustus became the first emperor in 27 BC. Julius Caesar was dictator but never emperor.','daily'),
('history',3,'The Peace of Westphalia (1648) ended which conflict?',array['Hundred Years'' War','Thirty Years'' War','Wars of the Roses','Seven Years'' War'],1,'The treaties of Westphalia ended the Thirty Years'' War in the Holy Roman Empire.','daily'),
('history',3,'The medieval city of Great Zimbabwe was built by the ancestors of which people?',array['The Shona','The Zulu','The Maasai','The Ashanti'],0,'Great Zimbabwe was built by ancestors of the Shona between the 11th and 15th centuries.','daily'),

-- Science
('science',1,'What is the chemical symbol for gold?',array['Go','Gd','Au','Ag'],2,'Au comes from the Latin word for gold, aurum.','daily'),
('science',1,'Which planet is known as the Red Planet?',array['Venus','Mars','Jupiter','Mercury'],1,'Iron oxide (rust) in its soil gives Mars its reddish colour.','daily'),
('science',1,'Which gas do plants absorb from the air for photosynthesis?',array['Oxygen','Nitrogen','Carbon dioxide','Hydrogen'],2,'Plants take in carbon dioxide and release oxygen during photosynthesis.','daily'),
('science',1,'How many bones are in the adult human body?',array['186','206','226','246'],1,'Adults have 206 bones; babies are born with around 270 that fuse over time.','daily'),
('science',2,'What is the hardest naturally occurring substance?',array['Quartz','Diamond','Titanium','Graphite'],1,'Diamond scores 10, the maximum, on the Mohs hardness scale.','daily'),
('science',2,'Which planet has the most confirmed moons?',array['Jupiter','Saturn','Uranus','Neptune'],1,'Saturn passed 270 confirmed moons in 2025, far ahead of Jupiter.','daily'),
('science',2,'Roughly how fast does light travel in a vacuum?',array['300,000 km/s','150,000 km/s','30,000 km/s','3,000,000 km/s'],0,'Light travels at about 299,792 km per second.','daily'),
('science',2,'Which blood type is known as the universal donor for red cells?',array['AB+','O−','A+','B−'],1,'O-negative red cells can be given to patients of any blood type.','daily'),
('science',2,'What is the most abundant gas in Earth''s atmosphere?',array['Oxygen','Carbon dioxide','Nitrogen','Argon'],2,'Nitrogen makes up about 78% of the atmosphere; oxygen about 21%.','daily'),
('science',3,'What is the approximate half-life of carbon-14?',array['570 years','5,730 years','57,300 years','573,000 years'],1,'Carbon-14''s half-life of about 5,730 years makes it ideal for radiocarbon dating.','daily'),
('science',3,'Which physicist formulated the uncertainty principle?',array['Niels Bohr','Werner Heisenberg','Erwin Schrödinger','Max Planck'],1,'Heisenberg published the uncertainty principle in 1927.','daily'),
('science',3,'Which cell structure is the site of protein synthesis?',array['Golgi apparatus','Lysosome','Ribosome','Mitochondrion'],2,'Ribosomes translate messenger RNA into chains of amino acids.','daily'),
('science',3,'What is the SI unit of electrical capacitance?',array['Henry','Farad','Tesla','Weber'],1,'The farad is named after Michael Faraday.','daily'),

-- Geography
('geography',1,'What is the capital of Australia?',array['Sydney','Melbourne','Canberra','Perth'],2,'Canberra was purpose-built as the capital as a compromise between Sydney and Melbourne.','daily'),
('geography',1,'Which is the largest ocean on Earth?',array['Atlantic','Indian','Arctic','Pacific'],3,'The Pacific covers about a third of Earth''s surface.','daily'),
('geography',1,'On which continent is the Sahara Desert?',array['Asia','Africa','Australia','South America'],1,'The Sahara spans much of North Africa and is the largest hot desert.','daily'),
('geography',1,'Which river flows through Paris?',array['Thames','Danube','Seine','Rhine'],2,'The Seine runs through the heart of Paris to the English Channel.','daily'),
('geography',2,'Which country has the most natural lakes?',array['Russia','Canada','United States','Finland'],1,'Canada is home to an estimated 60% of the world''s lakes.','daily'),
('geography',2,'What is the smallest country in the world by area?',array['Monaco','San Marino','Vatican City','Liechtenstein'],2,'Vatican City covers about 0.44 square kilometres.','daily'),
('geography',2,'Mount Kilimanjaro is in which country?',array['Kenya','Tanzania','Uganda','Ethiopia'],1,'Kilimanjaro, Africa''s highest peak, is in north-eastern Tanzania.','daily'),
('geography',2,'What is the capital of Canada?',array['Toronto','Vancouver','Montreal','Ottawa'],3,'Ottawa, in Ontario, has been the capital since 1857.','daily'),
('geography',2,'The Atacama Desert lies mostly in which country?',array['Peru','Chile','Argentina','Bolivia'],1,'Northern Chile''s Atacama is one of the driest places on Earth.','daily'),
('geography',3,'What is the capital of Kazakhstan?',array['Almaty','Astana','Tashkent','Bishkek'],1,'Astana replaced Almaty as capital in 1997.','daily'),
('geography',3,'Which African country has three capital cities?',array['Nigeria','South Africa','Kenya','Egypt'],1,'Pretoria (executive), Cape Town (legislative) and Bloemfontein (judicial).','daily'),
('geography',3,'Lake Titicaca lies on the border of Peru and which country?',array['Bolivia','Ecuador','Chile','Brazil'],0,'Titicaca straddles Peru and Bolivia high in the Andes.','daily'),
('geography',3,'Which is the longest continental mountain range in the world?',array['Himalayas','Rocky Mountains','Andes','Ural Mountains'],2,'The Andes stretch about 7,000 km along western South America.','daily'),

-- Sport
('sport',1,'How many players does each football (soccer) team have on the pitch?',array['9','10','11','12'],2,'Each side fields 11 players, including the goalkeeper.','daily'),
('sport',1,'In which sport would you perform a slam dunk?',array['Volleyball','Basketball','Tennis','Handball'],1,'A slam dunk is when a player forces the ball down through the basketball hoop.','daily'),
('sport',1,'How often are the Summer Olympic Games normally held?',array['Every 2 years','Every 3 years','Every 4 years','Every 5 years'],2,'The Summer Games are held every four years.','daily'),
('sport',1,'What colour is the centre of a standard archery target?',array['Red','Blue','Gold','Black'],2,'The innermost rings, worth 9 and 10, are gold.','daily'),
('sport',2,'Which country won the first FIFA World Cup in 1930?',array['Brazil','Argentina','Uruguay','Italy'],2,'Hosts Uruguay beat Argentina 4–2 in the final.','daily'),
('sport',2,'How many points is a touchdown worth in American football?',array['3','6','7','2'],1,'A touchdown is worth 6 points, before the extra-point attempt.','daily'),
('sport',2,'In tennis, what is a score of zero called?',array['Love','Nil','Duck','Zero'],0,'"Love" means zero in tennis scoring.','daily'),
('sport',2,'Which nation has won the most men''s Rugby World Cups?',array['New Zealand','Australia','South Africa','England'],2,'South Africa won their fourth title in 2023.','daily'),
('sport',2,'In golf, what is one stroke under par on a hole called?',array['Eagle','Birdie','Bogey','Albatross'],1,'A birdie is one under par; an eagle is two under.','daily'),
('sport',3,'Which city hosted the 1964 Summer Olympics, the first held in Asia?',array['Seoul','Beijing','Tokyo','Manila'],2,'Tokyo hosted in 1964 and again in 2021.','daily'),
('sport',3,'What is the official length of a marathon?',array['40.000 km','42.195 km','41.500 km','43.200 km'],1,'The distance was standardised at 42.195 km (26.2 miles) in 1921.','daily'),
('sport',3,'Which cyclist holds the record for most Tour de France stage wins?',array['Eddy Merckx','Mark Cavendish','Bernard Hinault','Tadej Pogačar'],1,'Mark Cavendish took his record 35th stage win in 2024.','daily'),
('sport',3,'How many legal deliveries make up a standard over in cricket?',array['5','6','8','10'],1,'An over consists of six legal deliveries.','daily'),

-- Entertainment
('entertainment',1,'Which band released the album "Abbey Road"?',array['The Rolling Stones','The Beatles','Queen','Pink Floyd'],1,'The Beatles released Abbey Road in 1969.','daily'),
('entertainment',1,'What is the name of the cowboy toy in "Toy Story"?',array['Buzz','Woody','Jessie','Rex'],1,'Sheriff Woody is voiced by Tom Hanks.','daily'),
('entertainment',1,'Which instrument usually has 88 keys?',array['Organ','Accordion','Piano','Harpsichord'],2,'A standard modern piano has 52 white and 36 black keys.','daily'),
('entertainment',1,'Who painted the "Mona Lisa"?',array['Michelangelo','Raphael','Leonardo da Vinci','Botticelli'],2,'Leonardo began the portrait around 1503; it hangs in the Louvre.','daily'),
('entertainment',2,'Which film won the very first Academy Award for Best Picture?',array['Wings','Sunrise','The Jazz Singer','Metropolis'],0,'Wings (1927) won the top award at the first Oscars in 1929.','daily'),
('entertainment',2,'Which artist released the album "1989"?',array['Adele','Taylor Swift','Katy Perry','Lady Gaga'],1,'Taylor Swift released 1989 in 2014 and a re-recording in 2023.','daily'),
('entertainment',2,'In which country was the group BTS formed?',array['Japan','China','South Korea','Thailand'],2,'BTS formed in Seoul and debuted in 2013.','daily'),
('entertainment',2,'Who directed the 1975 film "Jaws"?',array['Steven Spielberg','George Lucas','Martin Scorsese','Francis Ford Coppola'],0,'Jaws is often called the first summer blockbuster.','daily'),
('entertainment',2,'Which composer wrote "The Four Seasons"?',array['Bach','Vivaldi','Mozart','Handel'],1,'Antonio Vivaldi published the four violin concertos in 1725.','daily'),
('entertainment',3,'What was Disney''s first full-length animated feature film?',array['Pinocchio','Fantasia','Snow White and the Seven Dwarfs','Bambi'],2,'Snow White premiered in December 1937.','daily'),
('entertainment',3,'Who composed the opera "The Magic Flute"?',array['Verdi','Wagner','Mozart','Puccini'],2,'Mozart''s Die Zauberflöte premiered in Vienna in 1791.','daily'),
('entertainment',3,'Who painted "The Persistence of Memory", with its melting clocks?',array['René Magritte','Salvador Dalí','Joan Miró','Max Ernst'],1,'Dalí painted the surrealist work in 1931.','daily'),
('entertainment',3,'Which musical features the song "Defying Gravity"?',array['Wicked','Les Misérables','Hamilton','Cats'],0,'It closes the first act of Wicked, which opened on Broadway in 2003.','daily'),

-- Technology
('technology',1,'What does "WWW" stand for in a web address?',array['World Wide Web','Wide World Web','World Web Wide','Web World Wide'],0,'The World Wide Web runs on top of the internet.','daily'),
('technology',1,'Which company makes the iPhone?',array['Samsung','Google','Apple','Nokia'],2,'Apple introduced the iPhone in 2007.','daily'),
('technology',1,'What does "CPU" stand for?',array['Central Processing Unit','Computer Power Unit','Core Program Utility','Central Peripheral Unit'],0,'The CPU executes a computer''s instructions.','daily'),
('technology',1,'Which shortcut usually copies selected text on Windows?',array['Ctrl+V','Ctrl+X','Ctrl+C','Ctrl+Z'],2,'Ctrl+C copies, Ctrl+V pastes, Ctrl+X cuts and Ctrl+Z undoes.','daily'),
('technology',2,'In which year was the first iPhone released?',array['2005','2007','2009','2010'],1,'Steve Jobs unveiled it in January 2007; it went on sale that June.','daily'),
('technology',2,'What does "HTTP" stand for?',array['HyperText Transfer Protocol','High Transfer Text Protocol','HyperText Transmission Process','Host Transfer Text Protocol'],0,'HTTP is the protocol used to load web pages.','daily'),
('technology',2,'Who is credited with inventing the World Wide Web?',array['Bill Gates','Tim Berners-Lee','Vint Cerf','Steve Jobs'],1,'Tim Berners-Lee proposed it at CERN in 1989.','daily'),
('technology',2,'How many bits are in a byte?',array['4','8','16','32'],1,'A byte is 8 bits, enough to represent 256 values.','daily'),
('technology',2,'Which programming language is named after a British comedy group?',array['Ruby','Python','Perl','Java'],1,'Guido van Rossum named Python after Monty Python''s Flying Circus.','daily'),
('technology',3,'Which early general-purpose electronic computer was completed in 1945?',array['UNIVAC','ENIAC','Colossus','EDSAC'],1,'ENIAC was completed in late 1945 and unveiled in 1946.','daily'),
('technology',3,'Which company created Android before Google bought it?',array['Android Inc.','Palm','BlackBerry','Symbian Ltd'],0,'Google acquired Android Inc. in 2005.','daily'),
('technology',3,'In computing, what does "SQL" stand for?',array['Structured Query Language','Sequential Query Logic','Standard Question Language','System Query Link'],0,'SQL is the standard language for relational databases.','daily'),
('technology',3,'Who published the first algorithm intended for Babbage''s Analytical Engine?',array['Grace Hopper','Ada Lovelace','Alan Turing','Charles Babbage'],1,'Ada Lovelace published her notes, including the algorithm, in 1843.','daily'),

-- Literature
('literature',1,'Who wrote "Romeo and Juliet"?',array['Charles Dickens','William Shakespeare','Jane Austen','Mark Twain'],1,'Shakespeare wrote the tragedy in the 1590s.','daily'),
('literature',1,'Which school of magic does Harry Potter attend?',array['Durmstrang','Beauxbatons','Hogwarts','Ilvermorny'],2,'Hogwarts School of Witchcraft and Wizardry is in Scotland.','daily'),
('literature',1,'Who wrote "Pride and Prejudice"?',array['Charlotte Brontë','Jane Austen','Emily Dickinson','Mary Shelley'],1,'Jane Austen published it in 1813.','daily'),
('literature',1,'In "The Lord of the Rings", who carries the One Ring to Mordor?',array['Gandalf','Aragorn','Frodo Baggins','Legolas'],2,'Frodo bears the Ring, helped by Samwise Gamgee.','daily'),
('literature',2,'Who wrote the novel "1984"?',array['Aldous Huxley','George Orwell','Ray Bradbury','H. G. Wells'],1,'George Orwell published Nineteen Eighty-Four in 1949.','daily'),
('literature',2,'Which novel opens with the line "Call me Ishmael"?',array['Moby-Dick','Treasure Island','The Old Man and the Sea','Robinson Crusoe'],0,'Herman Melville''s Moby-Dick was published in 1851.','daily'),
('literature',2,'Who wrote "One Hundred Years of Solitude"?',array['Jorge Luis Borges','Gabriel García Márquez','Isabel Allende','Mario Vargas Llosa'],1,'The Colombian author published it in 1967.','daily'),
('literature',2,'Which author created the detective Hercule Poirot?',array['Arthur Conan Doyle','Agatha Christie','Dorothy L. Sayers','Raymond Chandler'],1,'Poirot first appeared in 1920 in The Mysterious Affair at Styles.','daily'),
('literature',2,'Mary Shelley wrote which Gothic novel?',array['Dracula','Frankenstein','The Picture of Dorian Gray','Carmilla'],1,'Frankenstein was published in 1818.','daily'),
('literature',3,'Who wrote "Things Fall Apart"?',array['Wole Soyinka','Chinua Achebe','Ngũgĩ wa Thiong''o','Chimamanda Ngozi Adichie'],1,'Chinua Achebe''s 1958 novel is one of the most widely read African books.','daily'),
('literature',3,'In which city is James Joyce''s "Ulysses" set?',array['London','Dublin','Paris','Trieste'],1,'Ulysses follows Leopold Bloom through Dublin on 16 June 1904.','daily'),
('literature',3,'Which Russian author wrote "Crime and Punishment"?',array['Leo Tolstoy','Fyodor Dostoevsky','Anton Chekhov','Ivan Turgenev'],1,'Dostoevsky published it in 1866.','daily'),
('literature',3,'What is the name of the obsessed captain in "Moby-Dick"?',array['Captain Nemo','Captain Ahab','Captain Hook','Captain Flint'],1,'Captain Ahab hunts the white whale that took his leg.','daily'),

-- General knowledge
('general',1,'How many days are in a leap year?',array['364','365','366','367'],2,'A leap year adds 29 February, making 366 days.','daily'),
('general',1,'What is the largest mammal on Earth?',array['African elephant','Blue whale','Giraffe','Sperm whale'],1,'Blue whales can exceed 30 metres in length.','daily'),
('general',1,'How many sides does a hexagon have?',array['5','6','7','8'],1,'"Hex" comes from the Greek for six.','daily'),
('general',1,'What colour do you get by mixing blue and yellow paint?',array['Purple','Orange','Green','Brown'],2,'Blue and yellow pigments combine to make green.','daily'),
('general',2,'Which language has the most native speakers?',array['English','Spanish','Mandarin Chinese','Hindi'],2,'Mandarin has roughly 940 million native speakers.','daily'),
('general',2,'What is the currency of Japan?',array['Won','Yuan','Yen','Ringgit'],2,'The yen has been Japan''s currency since 1871.','daily'),
('general',2,'How many hearts does an octopus have?',array['1','2','3','4'],2,'Two hearts pump blood to the gills and one to the rest of the body.','daily'),
('general',2,'What is the national animal of Scotland?',array['Lion','Red deer','Unicorn','Golden eagle'],2,'The unicorn has been a Scottish heraldic symbol since the 12th century.','daily'),
('general',2,'Which vitamin does your skin produce when exposed to sunlight?',array['Vitamin A','Vitamin C','Vitamin D','Vitamin K'],2,'UVB light triggers vitamin D production in the skin.','daily'),
('general',3,'Which food can last for thousands of years without spoiling if sealed?',array['Rice','Honey','Crackers','Dried beans'],1,'Edible honey has been found in ancient Egyptian tombs.','daily'),
('general',3,'Counting overseas territories, how many time zones does France use?',array['1','5','12','9'],2,'Thanks to its overseas territories, France spans 12 time zones, the most of any country.','daily'),
('general',3,'On which planet is a day longer than its year?',array['Mercury','Venus','Mars','Neptune'],1,'Venus takes 243 Earth days to rotate but only 225 to orbit the Sun.','daily'),
('general',3,'What is a group of crows called?',array['A parliament','A murder','A pride','A gaggle'],1,'A "murder" of crows dates back to 15th-century collective nouns.','daily'),

-- Practice-only pool
('history',1,'In which year did the Titanic sink?',array['1905','1912','1918','1923'],1,'The Titanic sank on 15 April 1912 on its maiden voyage.','practice'),
('history',2,'Who was the British Prime Minister for most of World War II?',array['Neville Chamberlain','Winston Churchill','Clement Attlee','Anthony Eden'],1,'Churchill led Britain from May 1940 to July 1945.','practice'),
('history',2,'What was the name of the ship that carried the Pilgrims to America in 1620?',array['Santa María','Mayflower','Endeavour','Beagle'],1,'The Mayflower landed at Plymouth, Massachusetts.','practice'),
('history',3,'Who led the expedition that first circumnavigated the globe, completed in 1522?',array['Christopher Columbus','Ferdinand Magellan','Vasco da Gama','James Cook'],1,'Magellan led it but died in 1521; Juan Sebastián Elcano completed the voyage.','practice'),
('science',1,'What is H₂O more commonly known as?',array['Salt','Water','Hydrogen peroxide','Ozone'],1,'Two hydrogen atoms and one oxygen atom make a water molecule.','practice'),
('science',1,'Which force keeps the planets in orbit around the Sun?',array['Magnetism','Friction','Gravity','Inertia'],2,'The Sun''s gravity holds the planets in their orbits.','practice'),
('science',2,'Which organ produces insulin?',array['Liver','Pancreas','Kidney','Spleen'],1,'Beta cells in the pancreas produce insulin.','practice'),
('science',2,'What is the pH of pure water at 25°C?',array['5','7','9','14'],1,'Pure water is neutral, with a pH of 7.','practice'),
('geography',1,'What is the capital of Japan?',array['Kyoto','Osaka','Tokyo','Nagoya'],2,'Tokyo has been the capital since 1868.','practice'),
('geography',1,'What is the longest river in South America?',array['Orinoco','Paraná','Amazon','Magdalena'],2,'The Amazon is about 6,400 km long.','practice'),
('geography',2,'Which country has had the largest population since 2023?',array['China','India','United States','Indonesia'],1,'India overtook China in 2023, according to UN estimates.','practice'),
('geography',2,'What is the capital of Iceland?',array['Oslo','Reykjavík','Helsinki','Tórshavn'],1,'Reykjavík is the world''s northernmost capital of a sovereign state.','practice'),
('sport',1,'How many rings are on the Olympic flag?',array['4','5','6','7'],1,'The five rings represent the inhabited continents taking part.','practice'),
('sport',1,'Which sport uses the term "home run"?',array['Cricket','Baseball','Rugby','Hockey'],1,'A home run lets the batter round all the bases in one hit.','practice'),
('sport',1,'How many players per team are on a basketball court at once?',array['5','6','7','4'],0,'Each team has five players on court.','practice'),
('sport',2,'Which country hosted the 2016 Summer Olympics?',array['China','United Kingdom','Brazil','Japan'],2,'Rio de Janeiro hosted the first Games in South America.','practice'),
('entertainment',1,'Which superhero is known as the Dark Knight?',array['Superman','Batman','Spider-Man','Iron Man'],1,'Batman''s alter ego is Bruce Wayne.','practice'),
('entertainment',1,'Which Pixar film features a rat who dreams of being a chef?',array['Ratatouille','Up','Coco','Luca'],0,'Ratatouille (2007) is set in Paris.','practice'),
('entertainment',2,'Who played Jack Dawson in "Titanic" (1997)?',array['Brad Pitt','Leonardo DiCaprio','Matt Damon','Johnny Depp'],1,'DiCaprio starred opposite Kate Winslet.','practice'),
('entertainment',2,'Anime is an animation style that originated in which country?',array['China','South Korea','Japan','Thailand'],2,'The word anime comes from the Japanese for animation.','practice'),
('technology',1,'Which company created the Windows operating system?',array['Apple','IBM','Microsoft','Intel'],2,'Microsoft released Windows 1.0 in 1985.','practice'),
('technology',1,'What does "AI" stand for?',array['Automated Interface','Artificial Intelligence','Advanced Integration','Analog Input'],1,'Artificial intelligence covers systems that perform tasks needing human-like reasoning.','practice'),
('technology',2,'What does "USB" stand for?',array['Universal Serial Bus','Unified System Bus','Universal Signal Board','User Serial Base'],0,'USB was introduced in 1996.','practice'),
('technology',3,'What is the number 5 written in binary?',array['101','110','011','111'],0,'5 = 4 + 1, so in binary it is 101.','practice'),
('literature',1,'Which fairy tale features a glass slipper?',array['Snow White','Cinderella','Rapunzel','Sleeping Beauty'],1,'Cinderella loses her glass slipper at the royal ball.','practice'),
('literature',1,'Who wrote "The Hobbit"?',array['C. S. Lewis','J. R. R. Tolkien','Philip Pullman','Terry Pratchett'],1,'Tolkien published The Hobbit in 1937.','practice'),
('literature',2,'Who wrote "The Adventures of Tom Sawyer"?',array['Mark Twain','Herman Melville','Jack London','Nathaniel Hawthorne'],0,'Mark Twain published it in 1876.','practice'),
('literature',2,'Which ancient poet is credited with "The Odyssey"?',array['Virgil','Homer','Sophocles','Ovid'],1,'The Odyssey is attributed to the Greek poet Homer.','practice'),
('general',1,'Which is the tallest animal?',array['Elephant','Giraffe','Ostrich','Camel'],1,'Giraffes can grow to almost 6 metres tall.','practice'),
('general',1,'How many continents are commonly recognised?',array['5','6','7','8'],2,'The seven-continent model is the most widely taught.','practice'),
('general',2,'How many minutes are in a day?',array['1,240','1,440','1,640','1,840'],1,'24 hours × 60 minutes = 1,440.','practice'),
('general',2,'At what temperature does water freeze in Fahrenheit?',array['0°F','32°F','100°F','212°F'],1,'Water freezes at 32°F and boils at 212°F at sea level.','practice');

-- ---------------------------------------------------------------------
-- Demo players and the last week of results, so leaderboards are alive.
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

  -- Past week of quizzes, then simulated play in date order (streaks build naturally).
  for d in select generate_series(public.utc_today() - 6, public.utc_today(), interval '1 day')::date loop
    v_quiz_id := public.generate_daily_quiz(d);
    for r in select p.id from public.profiles p where p.bio = 'Demo player' order by p.username loop
      continue when random() > case when d = public.utc_today() then 0.6 else 0.82 end;
      v_skill := 0.45 + (abs(hashtext(r.id::text)) % 45) / 100.0;   -- 0.45 .. 0.89 per player
      v_base := d::timestamp + make_interval(hours => 6 + (random() * 14)::int);
      insert into public.quiz_attempts (user_id, mode, quiz_id, quiz_date, started_at)
      values (r.id, 'ranked', v_quiz_id, d, v_base) returning id into v_attempt;
      insert into public.attempt_answers (attempt_id, position, question_id)
      select v_attempt, position, question_id from public.daily_quiz_questions where quiz_id = v_quiz_id;
      for i in 1..10 loop
        v_ok := random() < v_skill - (i - 1) * 0.025;
        v_ms := (2200 + random() * (case when v_ok then 8000 else 11000 end))::int;
        update public.attempt_answers aa set
          served_at = v_base + make_interval(secs => i * 20),
          answered_at = v_base + make_interval(secs => i * 20) + make_interval(secs => v_ms / 1000.0),
          selected_index = case when v_ok then q.correct_index else (q.correct_index + 1) % 4 end,
          is_correct = v_ok, elapsed_ms = v_ms, points = public.score_answer(v_ok, v_ms)
        from public.questions q
        where aa.attempt_id = v_attempt and aa.position = i and q.id = aa.question_id;
      end loop;
      perform public.finalize_attempt(v_attempt);
      update public.quiz_attempts set finished_at = v_base + interval '4 minutes' where id = v_attempt;
    end loop;
  end loop;

  -- Some friendships among demo players.
  insert into public.friendships (requester_id, addressee_id, status, responded_at)
  select a.id, b.id, 'accepted', now()
    from public.profiles a join public.profiles b on a.username < b.username
   where a.bio = 'Demo player' and b.bio = 'Demo player' and random() < 0.12
  on conflict do nothing;
end $$;

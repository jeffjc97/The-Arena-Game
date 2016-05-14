 ALTER TABLE challenge_table ADD CONSTRAINT uniqueChallenge UNIQUE (sender, recipient);
 ALTER TABLE challenge_table ALTER issued SET DEFAULT CURRENT_TIMESTAMP;

 insert into user_table(id, name, in_duel) VALUES ('10206557582650156', 'jeff', 0);
 insert into user_table(id, name, in_duel) VALUES ('10205320360242528', 'roy', 0);
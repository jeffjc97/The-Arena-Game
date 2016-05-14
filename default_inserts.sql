 ALTER TABLE challenge_table ALTER issued SET DEFAULT CURRENT_TIMESTAMP;
 ALTER TABLE duel_table ALTER time_started SET DEFAULT CURRENT_TIMESTAMP;
 ALTER TABLE duel_table ALTER health_sender SET DEFAULT 100;
 ALTER TABLE duel_table ALTER health_recipient SET DEFAULT 100;
 ALTER TABLE duel_table ALTER moves_in_duel SET DEFAULT 0;
 ALTER TABLE duel_table ALTER winner_id SET DEFAULT 'none';


 insert into user_table(id, name, in_duel) VALUES ('10206557582650156', 'jeff', 0);
 insert into user_table(id, name, in_duel) VALUES ('10205320360242528', 'roy', 0);

 	--in schema.ddl:
 	--change VARCHAR2 to VARCHAR
 	--change CASCADE CONSTRAINTS to CASCADE
 	--in duel_table change duel_id to "duel_id SERIAL NOT NULL"
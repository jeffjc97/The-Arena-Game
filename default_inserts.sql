 insert into user_table(id, name, in_duel) VALUES ('10206557582650156', 'jeff', 0);
 insert into user_table(id, name, in_duel) VALUES ('10205320360242528', 'roy', 0);

 	--in relational model:
 	--unique constraint on challenge_table sender/reciever
 	--unique constraint on user_table name
 	--default values: wins/losses/draws/games = 0 in user_table
 	--default values: health = 100 in duel_table
 	--default values: winner_id = 'none' in duel_table
 	--default values: moves = 0 in duel_table
 	--default values: issued/time_started = CURRENT_TIMESTAMP in challenge_table/duel_table


 	--in schema.ddl:
 	--change VARCHAR2 to VARCHAR
 	--change CASCADE CONSTRAINTS to CASCADE
 	--in duel_table change duel_id to "duel_id SERIAL NOT NULL"
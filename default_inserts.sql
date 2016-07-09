--in schema.ddl:
--change VARCHAR2 to VARCHAR
--change CASCADE CONSTRAINTS to CASCADE
--in duel_table change duel_id to "duel_id SERIAL NOT NULL"

insert into user_table values ('BOT', 'TrainingDummy', 0, 0, 0, 0, 0, 'Bot', 'McBotface', 'na', 'male', 100, 0);
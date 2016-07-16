-- Generated by Oracle SQL Developer Data Modeler 4.1.3.901
--   at:        2016-07-12 23:54:01 CDT
--   site:      Oracle Database 11g
--   type:      Oracle Database 11g




DROP TABLE challenge_table CASCADE ;

DROP TABLE duel_table CASCADE ;

DROP TABLE error_log CASCADE ;

DROP TABLE feedback_table CASCADE ;

DROP TABLE friend_table CASCADE ;

DROP TABLE moves_table CASCADE ;

DROP TABLE referral_table CASCADE ;

DROP TABLE user_classes CASCADE ;

DROP TABLE user_table CASCADE ;

CREATE TABLE challenge_table
  (
    sender    VARCHAR (20) NOT NULL ,
    recipient VARCHAR (20) NOT NULL ,
    issued    TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL ,
    val       INTEGER DEFAULT 0 NOT NULL ,
    is_stake  CHAR (1) DEFAULT '0' NOT NULL
  ) ;
ALTER TABLE challenge_table ADD CONSTRAINT unique_challenge UNIQUE ( recipient , sender ) ;


CREATE TABLE duel_table
  (
    winner_id        VARCHAR (20) DEFAULT 'none' ,
    time_started     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ,
    user_turn        VARCHAR (20) NOT NULL ,
    sender_id        VARCHAR (20) NOT NULL ,
    health_sender    INTEGER DEFAULT 50 NOT NULL ,
    health_recipient INTEGER DEFAULT 50 NOT NULL ,
    moves_in_duel    INTEGER DEFAULT 0 NOT NULL ,
    recipient_id     VARCHAR (20) NOT NULL ,
    duel_id          SERIAL NOT NULL ,
    sender_heal      INTEGER DEFAULT 3 NOT NULL ,
    recipient_heal   INTEGER DEFAULT 3 NOT NULL ,
    bleed_sender     INTEGER DEFAULT 0 NOT NULL ,
    bleed_recipient  INTEGER DEFAULT 0 NOT NULL ,
    stun_sender      INTEGER DEFAULT 0 NOT NULL ,
    stun_recipient   INTEGER DEFAULT 0 NOT NULL ,
    stake            INTEGER DEFAULT 0 NOT NULL ,
    pressure_time    TIMESTAMP
  ) ;
ALTER TABLE duel_table ADD CONSTRAINT duel_table_PK PRIMARY KEY ( duel_id ) ;


CREATE TABLE error_log
  (
    error  VARCHAR (255) NOT NULL ,
    TIME   TIMESTAMP DEFAULT now() NOT NULL ,
    "user" VARCHAR (255) NOT NULL
  ) ;


CREATE TABLE feedback_table
  (
    id       VARCHAR (20) NOT NULL ,
    feedback VARCHAR (1000) NOT NULL ,
    TIME     TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
  ) ;


CREATE TABLE friend_table
  (
    owner_id  VARCHAR (20) NOT NULL ,
    friend_id VARCHAR (20) NOT NULL
  ) ;
ALTER TABLE friend_table ADD CONSTRAINT friend_table__UN UNIQUE ( owner_id , friend_id ) ;


CREATE TABLE moves_table
  (
    move    VARCHAR (255) NOT NULL ,
    made_by VARCHAR (20) NOT NULL ,
    duel_id INTEGER NOT NULL
  ) ;


CREATE TABLE referral_table
  (
    referrer VARCHAR (20) NOT NULL ,
    referee  VARCHAR (20) NOT NULL
  ) ;
ALTER TABLE referral_table ADD CONSTRAINT referral_table__PK PRIMARY KEY ( referrer, referee ) ;


CREATE TABLE user_classes
  (
    class INTEGER NOT NULL ,
    id    VARCHAR (20) NOT NULL
  ) ;
ALTER TABLE user_classes ADD CONSTRAINT user_classes__UN UNIQUE ( class , id ) ;


CREATE TABLE user_table
  (
    id            VARCHAR (20) NOT NULL ,
    name          VARCHAR (255) NOT NULL ,
    in_duel       INTEGER DEFAULT 0 NOT NULL ,
    wins          INTEGER DEFAULT 0 ,
    losses        INTEGER DEFAULT 0 ,
    draws         INTEGER DEFAULT 0 ,
    games_played  INTEGER DEFAULT 0 ,
    first_name    VARCHAR (255) NOT NULL ,
    last_name     VARCHAR (255) NOT NULL ,
    profile_pic   VARCHAR (255) NOT NULL ,
    gender        VARCHAR (10) NOT NULL ,
    points        INTEGER DEFAULT 100 NOT NULL ,
    current_class INTEGER DEFAULT 0 NOT NULL ,
    mute          BOOLEAN DEFAULT false
  ) ;
ALTER TABLE user_table ADD CONSTRAINT user_table_PK PRIMARY KEY ( id ) ;
ALTER TABLE user_table ADD CONSTRAINT unique_name UNIQUE ( name ) ;


ALTER TABLE user_classes ADD CONSTRAINT classes_owned FOREIGN KEY ( id ) REFERENCES user_table ( id ) ;

ALTER TABLE duel_table ADD CONSTRAINT duel_table_user_table_FK FOREIGN KEY ( sender_id ) REFERENCES user_table ( id ) ;

ALTER TABLE duel_table ADD CONSTRAINT duel_table_user_table_FKv1 FOREIGN KEY ( user_turn ) REFERENCES user_table ( id ) ;

ALTER TABLE duel_table ADD CONSTRAINT duel_table_user_table_FKv2 FOREIGN KEY ( recipient_id ) REFERENCES user_table ( id ) ;

ALTER TABLE friend_table ADD CONSTRAINT friend FOREIGN KEY ( friend_id ) REFERENCES user_table ( id ) ;

ALTER TABLE moves_table ADD CONSTRAINT moves_table_duel_table_FK FOREIGN KEY ( duel_id ) REFERENCES duel_table ( duel_id ) ;

ALTER TABLE moves_table ADD CONSTRAINT moves_table_user_table_FK FOREIGN KEY ( made_by ) REFERENCES user_table ( id ) ;

ALTER TABLE friend_table ADD CONSTRAINT owner FOREIGN KEY ( owner_id ) REFERENCES user_table ( id ) ;

ALTER TABLE referral_table ADD CONSTRAINT referee FOREIGN KEY ( referee ) REFERENCES user_table ( id ) ;

ALTER TABLE referral_table ADD CONSTRAINT referrer FOREIGN KEY ( referrer ) REFERENCES user_table ( id ) ;


-- Oracle SQL Developer Data Modeler Summary Report: 
-- 
-- CREATE TABLE                             9
-- CREATE INDEX                             0
-- ALTER TABLE                             17
-- CREATE VIEW                              0
-- ALTER VIEW                               0
-- CREATE PACKAGE                           0
-- CREATE PACKAGE BODY                      0
-- CREATE PROCEDURE                         0
-- CREATE FUNCTION                          0
-- CREATE TRIGGER                           0
-- ALTER TRIGGER                            0
-- CREATE COLLECTION TYPE                   0
-- CREATE STRUCTURED TYPE                   0
-- CREATE STRUCTURED TYPE BODY              0
-- CREATE CLUSTER                           0
-- CREATE CONTEXT                           0
-- CREATE DATABASE                          0
-- CREATE DIMENSION                         0
-- CREATE DIRECTORY                         0
-- CREATE DISK GROUP                        0
-- CREATE ROLE                              0
-- CREATE ROLLBACK SEGMENT                  0
-- CREATE SEQUENCE                          0
-- CREATE MATERIALIZED VIEW                 0
-- CREATE SYNONYM                           0
-- CREATE TABLESPACE                        0
-- CREATE USER                              0
-- 
-- DROP TABLESPACE                          0
-- DROP DATABASE                            0
-- 
-- REDACTION POLICY                         0
-- 
-- ORDS DROP SCHEMA                         0
-- ORDS ENABLE SCHEMA                       0
-- ORDS ENABLE OBJECT                       0
-- 
-- ERRORS                                   0
-- WARNINGS                                 0

DROP
  TABLE duel_table CASCADE  ;

DROP
  TABLE error_log CASCADE  ;

DROP
  TABLE feedback_table CASCADE  ;

DROP
  TABLE friend_table CASCADE  ;

DROP
  TABLE moves_table CASCADE  ;

DROP
  TABLE random_pool CASCADE  ;

DROP
  TABLE user_classes CASCADE  ;

DROP
  TABLE user_table CASCADE  ;

CREATE
  TABLE challenge_table
  (
    sender    VARCHAR (20) NOT NULL ,
    recipient VARCHAR (20) NOT NULL ,
    issued    TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL ,
    val       INTEGER DEFAULT 0 NOT NULL ,
    is_stake  CHAR (1) DEFAULT '0' NOT NULL
  ) ;
ALTER TABLE challenge_table ADD CONSTRAINT unique_challenge UNIQUE ( recipient
, sender ) ;


CREATE
  TABLE duel_table
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


CREATE
  TABLE error_log
  (
    error  VARCHAR (255) NOT NULL ,
    TIME   TIMESTAMP DEFAULT now() NOT NULL ,
    "user" VARCHAR (255) NOT NULL
  ) ;


CREATE
  TABLE feedback_table
  (
    id       VARCHAR (20) NOT NULL ,
    feedback VARCHAR (1000) NOT NULL ,
    TIME     TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
  ) ;


CREATE
  TABLE friend_table
  (
    owner_id  VARCHAR (20) NOT NULL ,
    friend_id VARCHAR (20) NOT NULL
  ) ;
ALTER TABLE friend_table ADD CONSTRAINT friend_table__UN UNIQUE ( owner_id ,
friend_id ) ;


CREATE
  TABLE moves_table
  (
    move    VARCHAR (255) NOT NULL ,
    made_by VARCHAR (20) NOT NULL ,
    duel_id INTEGER NOT NULL
  ) ;


CREATE
  TABLE random_pool
  (
    entry_time TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL ,
    id         VARCHAR (20) NOT NULL
  ) ;
ALTER TABLE random_pool ADD CONSTRAINT random_pool_PK PRIMARY KEY ( id ) ;


CREATE
  TABLE user_classes
  (
    class INTEGER NOT NULL ,
    id    VARCHAR (20) NOT NULL
  ) ;
ALTER TABLE user_classes ADD CONSTRAINT user_classes__UN UNIQUE ( class , id )
;


CREATE
  TABLE user_table
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
    current_class INTEGER DEFAULT 0 NOT NULL
  ) ;
ALTER TABLE user_table ADD CONSTRAINT user_table_PK PRIMARY KEY ( id ) ;
ALTER TABLE user_table ADD CONSTRAINT unique_name UNIQUE ( name ) ;


ALTER TABLE random_pool ADD CONSTRAINT Relation_10 FOREIGN KEY ( id )
REFERENCES user_table ( id ) ;

ALTER TABLE user_classes ADD CONSTRAINT classes_owned FOREIGN KEY ( id )
REFERENCES user_table ( id ) ;

ALTER TABLE duel_table ADD CONSTRAINT duel_table_user_table_FK FOREIGN KEY (
sender_id ) REFERENCES user_table ( id ) ;

ALTER TABLE duel_table ADD CONSTRAINT duel_table_user_table_FKv1 FOREIGN KEY (
user_turn ) REFERENCES user_table ( id ) ;

ALTER TABLE duel_table ADD CONSTRAINT duel_table_user_table_FKv2 FOREIGN KEY (
recipient_id ) REFERENCES user_table ( id ) ;

ALTER TABLE friend_table ADD CONSTRAINT friend FOREIGN KEY ( friend_id )
REFERENCES user_table ( id ) ;

ALTER TABLE moves_table ADD CONSTRAINT moves_table_duel_table_FK FOREIGN KEY (
duel_id ) REFERENCES duel_table ( duel_id ) ;

ALTER TABLE moves_table ADD CONSTRAINT moves_table_user_table_FK FOREIGN KEY (
made_by ) REFERENCES user_table ( id ) ;

ALTER TABLE friend_table ADD CONSTRAINT owner FOREIGN KEY ( owner_id )
REFERENCES user_table ( id ) ;


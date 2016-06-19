CREATE OR REPLACE FUNCTION new_user_trigger() RETURNS trigger AS $new_user$
BEGIN
    insert into user_classes(id,class) VALUES (NEW.id, 0);
    RETURN NEW;
END;
$new_user$ LANGUAGE plpgsql;


DROP TRIGGER IF EXISTS new_user ON user_table;
CREATE TRIGGER new_user AFTER INSERT ON user_table
     FOR EACH ROW EXECUTE PROCEDURE new_user_trigger();
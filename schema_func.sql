CREATE OR REPLACE FUNCTION new_user_trigger() RETURNS trigger AS $new_user$
BEGIN
    insert into user_classes(id,class) VALUES (NEW.id, 0);
    RETURN NEW;
END;
$new_user$ LANGUAGE plpgsql;


DROP TRIGGER IF EXISTS new_user ON user_table;
CREATE TRIGGER new_user AFTER INSERT ON user_table
     FOR EACH ROW EXECUTE PROCEDURE new_user_trigger();

CREATE OR REPLACE FUNCTION feedback_trigger() RETURNS trigger AS $feedback$
DECLARE
	count_var INTEGER;
BEGIN
	SELECT count(id) into count_var FROM feedback_table WHERE id=NEW.id AND TIME > (CURRENT_TIMESTAMP - INTERVAL '3 minutes');
    IF count_var > 0 THEN
    	RETURN null;
    ELSE
    	RETURN NEW;
    END IF;
END;
$feedback$ LANGUAGE plpgsql;


DROP TRIGGER IF EXISTS feedback ON feedback_table;
CREATE TRIGGER feedback BEFORE INSERT ON feedback_table
     FOR EACH ROW EXECUTE PROCEDURE feedback_trigger();
CREATE OR REPLACE FUNCTION logmods() RETURNS TRIGGER AS $body$
DECLARE
    audit_row publiclog;
    data text;
BEGIN
    audit_row = ROW(NULL, session_user::text, current_setting('application_name'), TG_TABLE_NAME::text, SUBSTRING(TG_OP,1,1), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '{}', '{}');
    IF (TG_OP = 'UPDATE') THEN
        IF OLD = NEW THEN
            RETURN NULL;
        END IF;
        audit_row.olddata = to_jsonb(OLD.*);
        audit_row.newdata = to_jsonb(NEW.*);
        audit_row.otime = NEW.modified;
        data = format('%s,%s,%s', TG_TABLE_SCHEMA, 'update', to_jsonb(NEW.*));
    ELSIF (TG_OP = 'DELETE') THEN
        audit_row.olddata = to_jsonb(OLD.*);
        audit_row.newdata = '{}';
        data = format('%s,%s,%s', TG_TABLE_SCHEMA, 'delete', to_jsonb(OLD.*));
    ELSIF (TG_OP = 'INSERT') THEN
        audit_row.olddata = '{}';
        audit_row.newdata = to_jsonb(NEW.*);
        audit_row.otime = NEW.modified;
        data = format('%s,%s,%s', TG_TABLE_SCHEMA, 'insert', to_jsonb(NEW.*));
    ELSE
        RETURN NULL;
    END IF;

    audit_row.logid = NEXTVAL(TG_ARGV[0] || '_logid_seq');
    EXECUTE 'INSERT INTO ' || TG_ARGV[0] || ' VALUES (($1).*)' USING audit_row;
    EXECUTE pg_notify(TG_TABLE_NAME, data);
    RETURN NULL;
END;
$body$
LANGUAGE plpgsql;
COMMENT ON FUNCTION logmods() IS 'Function to log details of any insert, delete or update to a log table specified in first trigger arg';

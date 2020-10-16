DROP TABLE IF EXISTS tempcache;
DROP SEQUENCE IF EXISTS ordercounter;

ALTER TABLE registered ADD COLUMN rorder INTEGER NOT NULL DEFAULT 0;

ALTER TABLE paymentitems DROP CONSTRAINT IF EXISTS paymentitems_accountid_fkey;
ALTER TABLE paymentitems DROP COLUMN accountid;
ALTER TABLE paymentitems ADD COLUMN itemtype INTEGER NOT NULL DEFAULT 0;

ALTER TABLE paymentsecrets ADD COLUMN attr JSONB NOT NULL DEFAULT '{}';

ALTER TABLE payments ALTER COLUMN carid   DROP NOT NULL;
ALTER TABLE payments ALTER COLUMN carid   SET DEFAULT NULL;
ALTER TABLE payments ALTER COLUMN session DROP NOT NULL;
ALTER TABLE payments ALTER COLUMN session SET DEFAULT NULL;
UPDATE payments SET amount=amount*100,modified=now();
ALTER TABLE payments ALTER COLUMN amount  TYPE INTEGER;
ALTER TABLE payments ALTER COLUMN amount  SET DEFAULT 0;
ALTER TABLE payments DROP COLUMN refid;
ALTER TABLE payments ADD COLUMN driverid  UUID     REFERENCES public.drivers; -- NOT NULL on newly created series
ALTER TABLE payments ADD COLUMN accountid TEXT;
ALTER TABLE payments ADD COLUMN refunded  BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE itemeventmap (
    eventid   UUID        NOT NULL REFERENCES events,
    itemid    TEXT        NOT NULL REFERENCES paymentitems,
    maxcount  INTEGER     NOT NULL DEFAULT 0,
    required  BOOLEAN     NOT NULL DEFAULT FALSE,
    modified  TIMESTAMP   NOT NULL DEFAULT now(),
    PRIMARY KEY (eventid, itemid)
);
REVOKE ALL ON itemeventmap FROM public;
GRANT  ALL ON itemeventmap TO <seriesname>;
CREATE TRIGGER  iemapmod AFTER  INSERT OR UPDATE OR DELETE ON itemeventmap FOR EACH ROW EXECUTE PROCEDURE logmods('<seriesname>.serieslog');
CREATE TRIGGER  iemapuni BEFORE UPDATE ON itemeventmap FOR EACH ROW EXECUTE PROCEDURE updatechecks('eventid,itemid');
COMMENT ON TABLE itemeventmap IS 'The map of items available for payment at an event';

DROP TABLE tempcache;
DROP SEQUENCE ordercounter;

ALTER TABLE paymentitems DROP CONSTRAINT paymentitems_accountid_fkey;

ALTER TABLE paymentsecrets ADD COLUMN attr JSONB NOT NULL DEFAULT '{}';

ALTER TABLE payments DROP COLUMN refid;
ALTER TABLE payments DROP COLUMN amount;

ALTER TABLE payments ADD COLUMN accountid TEXT NOT NULL DEFAULT '';
ALTER TABLE payments ADD COLUMN refunded BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE payments ADD COLUMN amount INTEGER NOT NULL;

CREATE TABLE itemeventmap (
    eventid   UUID        NOT NULL REFERENCES events,
    itemid    TEXT        NOT NULL REFERENCES paymentitems,
    modified  TIMESTAMP   NOT NULL DEFAULT now(),
    PRIMARY KEY (eventid, itemid)
);
REVOKE ALL ON itemeventmap FROM public;
GRANT  ALL ON itemeventmap TO <seriesname>;
CREATE TRIGGER  iemapmod AFTER  INSERT OR UPDATE OR DELETE ON itemeventmap FOR EACH ROW EXECUTE PROCEDURE logmods('<seriesname>.serieslog');
CREATE TRIGGER  iemapuni BEFORE UPDATE ON itemeventmap FOR EACH ROW EXECUTE PROCEDURE updatechecks('eventid,itemid');
COMMENT ON TABLE itemeventmap IS 'The map of items available for payment at an event';

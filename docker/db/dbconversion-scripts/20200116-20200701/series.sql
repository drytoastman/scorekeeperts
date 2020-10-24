DROP TABLE IF EXISTS tempcache;
DROP SEQUENCE IF EXISTS ordercounter;

ALTER TABLE registered ADD COLUMN rorder INTEGER NOT NULL DEFAULT 0;

-- Create new tables and copy so order is restored for series copy operations
CREATE TABLE paymentitems_new (
    itemid    TEXT      PRIMARY KEY,
    name      TEXT      NOT NULL,
    itemtype  INTEGER   NOT NULL DEFAULT 0,
    price     INTEGER   NOT NULL,
    currency  CHAR(3)   NOT NULL DEFAULT 'USD',
    modified  TIMESTAMP NOT NULL DEFAULT now()
);
INSERT INTO paymentitems_new SELECT itemid, name, 0, price, currency, modified FROM paymentitems;
REVOKE ALL ON paymentitems_new FROM public;
GRANT  ALL ON paymentitems_new TO <seriesname>;
CREATE TRIGGER payitmmod AFTER INSERT OR UPDATE OR DELETE ON paymentitems_new FOR EACH ROW EXECUTE PROCEDURE logmods('<seriesname>.serieslog');
CREATE TRIGGER payitmuni BEFORE UPDATE ON paymentitems_new FOR EACH ROW EXECUTE PROCEDURE updatechecks('itemid');
COMMENT ON TABLE paymentitems_new IS 'the list of configured items for an account, itemid is text as it can be a non-scorekeeper generated value';
DROP TABLE paymentitems;
ALTER TABLE paymentitems_new RENAME to paymentitems;

CREATE TABLE paymentsecrets_new (
    accountid TEXT      PRIMARY KEY REFERENCES paymentaccounts,
    secret    TEXT      NOT NULL DEFAULT '',
    attr      JSONB     NOT NULL,
    modified  TIMESTAMP NOT NULL DEFAULT now()
);
INSERT INTO paymentsecrets_new SELECT accountid, secret, '{}', modified FROM paymentsecrets;
REVOKE ALL ON paymentsecrets_new FROM public;
GRANT ALL  ON paymentsecrets_new TO localuser;
COMMENT ON TABLE paymentsecrets_new IS 'Local only table for payment account details that only need to be on the main server, localuser required to access, no remotes';
DROP TABLE paymentsecrets;
ALTER TABLE paymentsecrets_new RENAME to paymentsecrets;

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

DROP TABLE IF EXISTS emailfailures;

CREATE TABLE IF NOT EXISTS emailfilter(
    forder INTEGER NOT NULL,
    drop   BOOLEAN NOT NULL DEFAULT TRUE,
    match  TEXT PRIMARY KEY
);
REVOKE ALL ON emailfilter FROM public;
GRANT  ALL ON emailfilter TO mergeaccess;

CREATE TABLE IF NOT EXISTS localsettings (
    key TEXT PRIMARY KEY,
    value TEXT
);
REVOKE ALL ON localsettings FROM public;
GRANT  ALL ON localsettings TO mergeaccess;

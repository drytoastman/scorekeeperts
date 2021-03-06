cd /var/lib/postgresql/data

if [ $NOCLIENTCERT ]; then
    APPEND=""
else
    APPEND="clientcert=1"
fi

echo "
#TYPE     DATABASE  USER                 ADDRESS         METHOD
local     all       all                                  trust    # Trust local unix sockets
hostnossl all       all                  0.0.0.0/0       reject   # force SSL for network connections
hostssl   all       postgres,localuser   0.0.0.0/0       reject   $APPEND # no postgres or localuser over the network
hostssl   all       nulluser             0.0.0.0/0       password $APPEND # allow the null user to scan for series
hostssl   all       +driversaccess       0.0.0.0/0       password $APPEND # allow any other logins with password
" > pg_hba.conf

if [ -z $UI_TIME_ZONE ]; then
UI_TIME_ZONE=US/Pacific
fi

if [ $TESTING ]; then
    echo "
        ssl = on
        ssl_ca_file = '/certs/root.cert'
        ssl_cert_file = '/certs/server.cert'
        ssl_key_file = '/certs/server.key'

        log_destination = stderr
        log_line_prefix = '%t %a '
        log_statement = all
    " >> postgresql.conf
else
    echo "
    ssl = on
    ssl_ca_file = '/certs/root.cert'
    ssl_cert_file = '/certs/server.cert'
    ssl_key_file = '/certs/server.key'

    log_destination = stderr
    log_line_prefix = '%t %a '
    log_timezone=$UI_TIME_ZONE
    log_statement = none
    log_min_duration_statement = 1000
    logging_collector = on
    log_directory = '/var/log'
    log_filename = 'db.log'
    log_truncate_on_rotation = off
    " >> postgresql.conf
fi

cp /docker-entrypoint-initdb.d/series.template series.sql

KEYGRIP=`dd if=/dev/urandom bs=32 count=1 | base64`
psql -U postgres -d scorekeeper -c "
    INSERT INTO version (id, version) VALUES (1, $TEMPLATE_SCHEMA_VERSION);
    INSERT INTO localsettings (key, value) VALUES ('KEYGRIP', '$KEYGRIP');
    INSERT INTO localsettings (key, value) VALUES ('IS_MAIN_SERVER', '0');
"

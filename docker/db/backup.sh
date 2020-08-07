#!/bin/sh
read backupname;
B="/var/log/$backupname.sql"
echo "UPDATE pg_database SET datallowconn='false' WHERE datname='scorekeeper';" > "$B"
echo "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='scorekeeper';" >> "$B"
pg_dumpall -U postgres -c >> "$B"
echo "UPDATE pg_database SET datallowconn='true' WHERE datname='scorekeeper';" >> "$B"
gzip -9 -f "$B"
echo "done"

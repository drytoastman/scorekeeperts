#!/bin/sh
set -e
if [ -z "${MAIN_SERVER}" ]; then
    echo "Running in Local mode"
    cp /etc/nginx/servers.local.conf /etc/nginx/servers.conf
else
    echo "Running in SSL mode"
    cp /etc/nginx/servers.ssl.conf /etc/nginx/servers.conf
fi
nginx -g 'daemon off;'

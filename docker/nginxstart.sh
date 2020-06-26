#!/bin/sh
set -e
if [ -z "${MAIN_SERVER}" ]; then
    echo "Running in Local mode"
    cp /etc/nginx/nginx.local.conf /etc/nginx/nginx.conf
else
    echo "Running in SSL mode"
    cp /etc/nginx/nginx.ssl.conf /etc/nginx/nginx.conf
fi
nginx -g 'daemon off;'

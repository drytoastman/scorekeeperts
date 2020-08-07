#!/bin/sh
set -e
mkdir -p /var/log/nginx

if [ -z "${MAIN_SERVER}" ]; then
    echo "Running in Local mode"
    cp /etc/nginx/servers.local.conf /etc/nginx/servers.conf
else
    echo "Running in SSL mode"
    cp /etc/nginx/servers.ssl.conf /etc/nginx/servers.conf
fi

rotater() {
    # this saves me 40MB of junk if installing cron from apt-get
    while true
    do
        SLEEPFOR=`eval expr $(date -d '23:59' +%s) - $(date +%s)`
        DATELABEL=$(date +%Y-%m-%d)
        sleep $SLEEPFOR
        echo `date` "rotating logs"
        mv /var/log/proxy.log  /var/log/$DATELABEL-proxy.log
        mv /var/log/access.log /var/log/$DATELABEL-access.log
        nginx -s reopen
        sleep 300 # Wait until tomorrow to recalculate SLEEPFOR
    done
}

rotater &
nginx -g 'daemon off;'

#!/bin/sh
set -e
mkdir -p /var/log/nginx

MAIN=${MAIN_SERVER:-0}

if [ "${MAIN}" -gt 0 ]; then
    echo "Running in SSL mode"
    cp /etc/nginx/servers.ssl.conf /etc/nginx/servers.conf
else
    echo "Running in Local mode"
    cp /etc/nginx/servers.local.conf /etc/nginx/servers.conf
fi

daily() {
    # this saves me 40MB of junk if installing cron from apt-get
    while true
    do
        SLEEPFOR=`eval expr $(date -d '23:59' +%s) - $(date +%s)`
        DATELABEL=$(date +%Y-%m-%d)
        sleep $SLEEPFOR
        echo `date` "rotating logs"
        mv /var/log/proxy.log  /var/log/$DATELABEL-proxy.log
        mv /var/log/access.log /var/log/$DATELABEL-access.log
        gzip /var/log/$DATELABEL-access.log
        nginx -s reopen
        if [ "${MAIN}" -gt 0 ]; then
            certbot renew --deploy-hook "nginx -s reload"
        fi
        sleep 300 # Wait until tomorrow to recalculate SLEEPFOR
    done
}

daily &
nginx -g 'daemon off;'

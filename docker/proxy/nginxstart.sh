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
        mv /var/log/nginxerror.log  /var/log/$DATELABEL-nginxerror.log
        mv /var/log/nginxaccess.log /var/log/$DATELABEL-nginxaccess.log
        nginx -s reopen
        sleep 300 # Wait until tomorrow to recalculate SLEEPFOR
    done
}

rotater &
nginx -g 'daemon off;'

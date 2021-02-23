FROM alpine:3.13.2

RUN apk add --no-cache postfix opendkim busybox-extras
RUN adduser -S admin
RUN adduser postfix opendkim

# RUN apk add --no-cache busybox-extras vim
COPY aliases       /etc/postfix/
COPY aliases.lmdb  /etc/postfix/
COPY main.cf       /etc/postfix/
COPY master.cf     /etc/postfix/
COPY opendkim.conf /etc/opendkim/

ARG MAILNAME
RUN  sed -i "s/\$MAILNAME/$MAILNAME/" /etc/postfix/main.cf
RUN  sed -i "s/\$MAILNAME/$MAILNAME/" /etc/opendkim/opendkim.conf

CMD mkdir -p /var/spool/postfix/mbox; /sbin/syslogd -O /var/log/mail.log; /usr/sbin/opendkim; postfix start-fg

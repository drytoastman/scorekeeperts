FROM ubuntu:20.04

RUN apt-get update
RUN apt-get -y install supervisor postfix opendkim opendkim-tools rsyslog
RUN useradd admin

ADD postfixsetup.sh /sbin/postfixsetup.sh
CMD /sbin/postfixsetup.sh; /usr/bin/supervisord -c /etc/supervisor/supervisord.conf

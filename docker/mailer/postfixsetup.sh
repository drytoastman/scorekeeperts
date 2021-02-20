#!/bin/bash

#judgement
#if [[ -a /etc/supervisor/conf.d/supervisord.conf ]]; then
  #exit 0
#fi

mailname="whois.what"
mkdir -p /etc/opendkim/domainkeys

#supervisor
cat > /etc/supervisor/conf.d/supervisord.conf <<EOF
[supervisord]
nodaemon=true

[program:postfix]
command=service postfix start

[program:rsyslog]
command=/usr/sbin/rsyslogd -n -c3

[program:opendkim]
command=/usr/sbin/opendkim -f
EOF

############
#  postfix
############

postconf -e myorigin=$mailname
postconf -e myhostname=$mailname
postconf -e mydestination=$mailname
postconf -e mynetworks_style=host
postconf -e relay_domains=
postconf -e disable_vrfy_command=yes
postconf -e smtpd_helo_required=yes
postconf -e smtpd_tls_cert_file=/etc/letsencrypt/live/$mailname/cert.pem
postconf -e smtpd_tls_key_file=/etc/letsencrypt/live/$mailname/privkey.pem
postconf -e smtpd_tls_security_level=may
postconf -e milter_protocol=2
postconf -e milter_default_action=accept
postconf -e smtpd_milters=unix:/run/opendkim/opendkim.sock
postconf -e non_smtpd_milters=unix:/run/opendkim/opendkim.sock

# /etc/postfix/master.cf
postconf -F '*/*/chroot = n'
postconf -M       smtp/inet="smtp       inet n - n - 1 postscreen"
postconf -M      smtpd/pass="smtpd      pass - - n - - smtpd"
postconf -M submission/inet="submission inet n - n - - smtpd"
postconf -P "submission/inet/syslog_name=postfix/submission"
postconf -P "submission/inet/smtpd_tls_security_level=encrypt"

cat > /etc/aliases <<EOF
MAILER-DAEMON:  postmaster
postmaster:     admin
EOF
newaliases

#############
#  opendkim
#############

cat > /etc/opendkim.conf <<EOF
Socket                  local:/run/opendkim/opendkim.sock
PidFile                 /run/opendkim/opendkim.pid
OversignHeaders         From
TrustAnchorFile         /usr/share/dns/root.key

UserID                  opendkim
AutoRestart             Yes
AutoRestartRate         10/1h
UMask                   000
Syslog                  yes
SyslogSuccess           Yes
LogWhy                  Yes

Canonicalization        relaxed/simple
InternalHosts           127.0.0.1,localhost  # $mailname?
KeyFile                 /etc/opendkim/domainkeys/default.private
Domain                  whois.what
Selector                default

Mode                    sv
PidFile                 /var/run/opendkim/opendkim.pid
SignatureAlgorithm      rsa-sha256
EOF


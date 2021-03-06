#!/bin/bash
SCRIPTDIR=$(dirname ${BASH_SOURCE[0]})
if [ $# -lt 2 ]; then
    echo "Need a destination directory and host arguments"
    exit -1;
fi
cd $1
openssl req  -new -nodes -text -out root.csr   -keyout root.key   -subj "/CN=root.wwscc.org"
openssl req  -new -nodes -text -out server.csr -keyout server.key -subj "/CN=$2.wwscc.org"
openssl x509 -req -in root.csr   -text -days 3650 -extfile $SCRIPTDIR/certgen.cnf -extensions v3_ca     -signkey root.key -out root.cert
openssl x509 -req -in server.csr -text -days 3650 -extfile $SCRIPTDIR/certgen.cnf -extensions v3_server -CA root.cert -CAkey root.key -CAcreateserial -out server.cert
rm -f root.csr root.key server.csr root.srl
chmod -f 600      server.key server.cert root.cert
chown -f postgres server.key server.cert root.cert

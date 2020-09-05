#!/bin/bash
FILE=$1
NAME=$(basename $1)
CONTAINER=${2:-docker_db_1}
echo 'starting restore'
docker cp ${FILE} ${CONTAINER}:/tmp/${NAME}
docker exec ${CONTAINER} psql -U postgres -f /tmp/${NAME}
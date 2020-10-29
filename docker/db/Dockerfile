FROM postgres:9.6.15-alpine
RUN apk --no-cache add openssl socat iptables iproute2
ENV POSTGRES_DB=scorekeeper
ENV POSTGRES_PASSWORD=thisgetsoverwrittenlater
ENV TEMPLATE_SCHEMA_VERSION=20201028
COPY dbconversion-scripts /dbconversion-scripts
COPY dbinit-scripts /docker-entrypoint-initdb.d
COPY backup.sh /usr/local/bin
COPY custom-entrypoint.sh /usr/local/bin
RUN chmod +x /usr/local/bin/custom-entrypoint.sh
ENTRYPOINT ["custom-entrypoint.sh"]
CMD ["postgres"]

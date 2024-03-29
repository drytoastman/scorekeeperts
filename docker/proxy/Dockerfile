FROM node:16.13.1-bullseye as builder

WORKDIR /code
COPY package.json yarn.lock ./
COPY packages/types/package.json ./packages/types/
COPY packages/web/package.json   ./packages/web/
RUN yarn install

COPY package.json yarn.lock ./
COPY packages/tscommon.json packages/
COPY packages/types         packages/types
COPY packages/web           packages/web
RUN cd packages/web && yarn build

FROM nginx:1.21.5
RUN apt-get update && apt-get install -y -q --no-install-recommends certbot && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* /var/log/*
COPY --from=builder /code/packages/web/dist /app
COPY docker/proxy/dhparam.pem    /etc/nginx/
COPY docker/proxy/services.conf  /etc/nginx/
COPY docker/proxy/nginx*         /etc/nginx/
COPY docker/proxy/servers.*.conf /etc/nginx/
RUN rm -rf /var/log/*
CMD ["/etc/nginx/nginxstart.sh"]

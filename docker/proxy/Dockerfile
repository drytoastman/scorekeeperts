FROM node:14.15.1-buster-slim as builder

WORKDIR /code
COPY package.json yarn.lock ./
COPY web/package.json web/yarn.lock ./web/
RUN yarn install
RUN cd web && yarn install
COPY . .
RUN cd web && yarn build

FROM nginx:1.18.0
RUN apt-get update && apt-get install -y -q --no-install-recommends certbot && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* /var/log/*
COPY --from=builder /code/web/dist /app
COPY docker/proxy/dhparam.pem    /etc/nginx/
COPY docker/proxy/services.conf  /etc/nginx/
COPY docker/proxy/nginx*         /etc/nginx/
COPY docker/proxy/servers.*.conf /etc/nginx/
RUN rm -rf /var/log/*
CMD ["/etc/nginx/nginxstart.sh"]

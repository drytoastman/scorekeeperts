FROM node:12.18.2-buster-slim as builder

WORKDIR /code
COPY package.json yarn.lock ./
COPY ui/package.json ui/yarn.lock ./ui/
RUN yarn install
RUN cd ui && yarn install
COPY . .
RUN cd ui && yarn build

FROM nginx:1.18.0
RUN apt-get update && apt-get install -y -q --no-install-recommends certbot && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* /var/log/*
COPY --from=builder /code/ui/dist /app
COPY docker/proxy/dhparam.pem    /etc/nginx/
COPY docker/proxy/services.conf  /etc/nginx/
COPY docker/proxy/nginx*         /etc/nginx/
COPY docker/proxy/servers.*.conf /etc/nginx/
RUN rm -rf /var/log/*
CMD ["/etc/nginx/nginxstart.sh"]

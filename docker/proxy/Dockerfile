FROM node:12.18.2-buster-slim as builder
WORKDIR /code
COPY ui/package*.json ./ui/
RUN  cd ui && npm install
COPY ui ui
RUN  cd ui && npm run build

FROM nginx:1.18.0
RUN apt-get update && apt-get install -y -q --no-install-recommends certbot && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* /var/log/*
COPY --from=builder /code/ui/dist /app
COPY docker/proxy/dhparam.pem    /etc/nginx/
COPY docker/proxy/services.conf  /etc/nginx/
COPY docker/proxy/nginx*         /etc/nginx/
COPY docker/proxy/servers.*.conf /etc/nginx/
# Temp large static files from pythonweb, goes away with pythonweb
COPY docker/proxy/pystatic       /app/pystatic/
RUN rm -rf /var/log/*
CMD ["/etc/nginx/nginxstart.sh"]

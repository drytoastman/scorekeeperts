FROM node:12.18.2-buster-slim as builder

WORKDIR /code
COPY server/package*.json ./server/
RUN cd server && npm install
COPY server server
COPY ui/src/common ui/src/common
RUN ln -s /code/server/node_modules /code/ui/
RUN cd server && npm run build

FROM node:12.18.2-buster-slim
RUN apt-get update && apt-get install -y -q libnss3 libexpat1 libfontconfig1 fonts-liberation && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* /var/log/*
COPY --from=chromedp/headless-shell:83.0.4103.116 /headless-shell /headless-shell
COPY --from=builder /code/server/build/ /app/
WORKDIR /app
CMD ["node", "index.js"]
FROM node:16.13.1-buster-slim as builder

WORKDIR /code
COPY package.json yarn.lock ./
COPY packages/types/package.json  ./packages/types/
COPY packages/db/package.json     ./packages/db/
COPY packages/server/package.json ./packages/server/
RUN yarn install

COPY package.json yarn.lock ./
COPY packages/tscommon.json packages/
COPY packages/types         packages/types
COPY packages/db            packages/db
COPY packages/server        packages/server
RUN cd packages/server && yarn build

FROM node:16.13.1-buster-slim
RUN apt-get update && apt-get install -y -q libnss3 libexpat1 libfontconfig1 fonts-liberation && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* /var/log/*
COPY --from=chromedp/headless-shell:83.0.4103.116 /headless-shell /headless-shell
COPY --from=builder /code/packages/server/build/ /app/
WORKDIR /app
CMD ["node", "index.js"]

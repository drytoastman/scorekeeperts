FROM node:12.18.0-slim
# Build everything in one stage image
WORKDIR /code
COPY common/package*.json ./common/
COPY server/package*.json ./server/
COPY     ui/package*.json ./ui/
RUN cd common && npm install
RUN cd server && npm install
RUN cd ui     && npm install
COPY . .
RUN cd server && npm run build
RUN cd ui     && npm run build

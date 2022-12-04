# Scorekeeper Typescript Components

This repo contains the Typescript components of the scorekeeper tools.  Eventually all of the Scorekeeper pieces will be here but for now the old Java frontend components are at [github ScorekeeperFrontend](https://github.com/drytoastman/scorekeeperfrontend).

If developing under VSCode, there will be a list of recommended extensions in the workspace.

## To build Docker images (or use docker/images.sh script)

 1. cd docker
 2. docker build -t drytoastman/scdb[:VERSION]     -f db/Dockerfile     db
 3. docker build -t drytoastman/scserver[:VERSION] -f server/Dockerfile ../
 4. docker build -t drytoastman/scproxy[:VERSION]  -f proxy/Dockerfile  ../

## To run in a development environment:

### One time requirements (from root of repository)
 1. cd docker && docker build -t drytoastman/scdb -f db/Dockerfile db
 2. docker volume create latest_database
 3. docker volume create certs
 4. yarn install

### Terminal 1 (Database)
 1. cd docker
 2. docker-compose -f dev.yaml up
 3. (Re)load test data or backup data if needed:
    1. docker cp /path/to/scorekeeper.sql db:/tmp/scorekeeper.sql
    2. docker exec db psql -U postgres -f /tmp/scorekeeper.sql

### Terminal 2 (NodeJS Server)
 1. cd packages/server
 2. yarn build
 3. yarn dev

### Terminal 3 (VueJS Frontend DevServer)
 1. cd packages/web
 2. yarn dev

Open a browser to http://127.0.0.1

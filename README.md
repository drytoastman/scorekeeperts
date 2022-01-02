# Scorekeeper Typescript Components

This repo contains the Typescript components of the scorekeeper tools.  Eventually all of the Scorekeeper pieces will be here but for now the old Java frontend components are at [github ScorekeeperFrontend](https://github.com/drytoastman/scorekeeperfrontend).

## To build Docker images

 1. cd docker
 2. docker build -t drytoastman/scdb:VERSION     -f db/Dockerfile     db
 3. docker build -t drytoastman/scserver:VERSION -f server/Dockerfile ../
 4. docker build -t drytoastman/scproxy:VERSION  -f proxy/Dockerfile  ../

## To run in a development environment:

### Terminal 1 (Database)
 1. cd docker
 2. docker-compose -f dev.yaml up

### Terminal 2 (NodeJS Server)
 1. cd packages/server
 2. yarn dev

### Terminal 3 (VueJS Frontend DevServer)
 1. cd packages/web
 2. yarn dev


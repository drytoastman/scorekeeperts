set -e
docker build -t tsbase -f Dockerfile.stage ../
docker build -t drytoastman/scproxy:$TRAVIS_TAG  -f Dockerfile.proxy  .
docker build -t drytoastman/scnodejs:$TRAVIS_TAG -f Dockerfile.nodejs .
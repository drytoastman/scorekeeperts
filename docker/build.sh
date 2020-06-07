docker build -t tsbase -f Dockerfile.stage ../
docker build -t drytoastman/scproxy  -f Dockerfile.proxy  .
docker build -t drytoastman/scnodejs -f Dockerfile.nodejs .
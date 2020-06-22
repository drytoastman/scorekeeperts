set -e
if [ -z "$1" ]; then
	echo "Need a version argument"
	exit -1
fi
echo "Building VERSION=$1"
docker build -t tsbase:$1 -f Dockerfile.stage ../
docker build -t drytoastman/scproxy:$1  -f Dockerfile.proxy  .
docker build -t drytoastman/scnodejs:$1 -f Dockerfile.nodejs .

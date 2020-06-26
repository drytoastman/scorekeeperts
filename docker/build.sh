set -e
if [ -z "$1" ]; then
	echo "Need a version argument"
	exit -1
fi
echo "Building VERSION=$1"
docker build -t drytoastman/scdb:$1 -f Dockerfile.db ../postgres
docker build -t drytoastman/scnodejs:$1 -f Dockerfile.nodejs ../
docker build -t drytoastman/scproxy:$1  -f Dockerfile.proxy  ../

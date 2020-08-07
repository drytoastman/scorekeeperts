set -e
if [ -z "$1" ]; then
	echo "Need a version argument"
	exit -1
fi
echo "Building VERSION=$1"
docker build -t drytoastman/scdb:$1     -f db/Dockerfile db
docker build -t drytoastman/scserver:$1 -f server/Dockerfile ../
docker build -t drytoastman/scproxy:$1  -f proxy/Dockerfile  ../

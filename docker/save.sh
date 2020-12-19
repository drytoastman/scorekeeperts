set -e
if [ -z "$1" ]; then
	echo "Need a version argument"
	exit -1
fi
echo "Saving VERSION=$1"
docker tag drytoastman/scdb:$1 drytoastman/scdb:lastworking
docker tag drytoastman/scproxy:$1 drytoastman/scproxy:lastworking
docker tag drytoastman/scserver:$1 drytoastman/scserver:lastworking

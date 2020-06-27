set -e
if [ -z "$1" ]; then
	echo "Need a version argument"
	exit -1
fi
echo "Pushing VERSION=$1"
docker push drytoastman/scdb:$1
docker push drytoastman/scproxy:$1
docker push drytoastman/scnodejs:$1

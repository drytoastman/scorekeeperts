set -e
if [ -z "$1" ]; then
	echo "Need a version argument"
	exit -1
fi
echo "Pulling VERSION=$1"
docker pull drytoastman/scdb:$1
docker pull drytoastman/scproxy:$1
docker pull drytoastman/scnodejs:$1

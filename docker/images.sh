set -e

if [ -z "$2" ]; then
	echo "Need a version argument"
	exit -1
fi

V=$2
case "$1" in
    build)
        if [ "$NO_BUILD_HERE" == "1" ]; then
            echo "Do NOT build on this machine!"
            exit -1
        fi

        echo "Building VERSION=$V"
        docker build -t drytoastman/scdb:$V     -f db/Dockerfile     db
        docker build -t drytoastman/scserver:$V -f server/Dockerfile ../
        docker build -t drytoastman/scproxy:$V  -f proxy/Dockerfile  ../
        ;;

    pull)
        echo "Pulling VERSION=$V"
        docker pull drytoastman/scdb:$V
        docker pull drytoastman/scproxy:$V
        docker pull drytoastman/scserver:$V
        ;;

    push)
        echo "Pushing VERSION=$V"
        docker push drytoastman/scdb:$V
        docker push drytoastman/scproxy:$V
        docker push drytoastman/scserver:$V
        ;;

    save)
        echo "Saving VERSION=$V TO lastworking"
        docker tag drytoastman/scdb:$V     drytoastman/scdb:lastworking
        docker tag drytoastman/scproxy:$V  drytoastman/scproxy:lastworking
        docker tag drytoastman/scserver:$V drytoastman/scserver:lastworking
        ;;

    restore)
        echo "Restoring lastworking TO VERSION=$V"
        docker tag drytoastman/scdb:lastworking     drytoastman/scdb:$V
        docker tag drytoastman/scproxy:lastworking  drytoastman/scproxy:$V
        docker tag drytoastman/scserver:lastworking drytoastman/scserver:$V
        ;;
esac


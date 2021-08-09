set -e

BASE="docker run --rm -v certs:/certs -v letsencrypt:/letsencrypt -v data_logs:/logs -v $(pwd):/backup alpine"

case "$1" in
    save)
        echo "Saving volumes to tar file"
        ${BASE} tar -cvf /backup/volumes.tgz /certs /letsencrypt /logs
        ;;

    restore)
        echo "Restoring tar file to volumes"
        ${BASE} tar -C / -xf /backup/volumes.tgz
        ;;
esac

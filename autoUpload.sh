#!/bin/bash

# Publishes a new IDE release to CloudFront. It does not commit or push anything:
# master is protected, so the version bump in package.json goes through a PR first.
#
# Usage: ./autoUpload.sh --tag latest|next [--no-check]
#   latest: run from master, after merging the PR that bumps the version.
#           Uploads app.js/app.css, the tarball and the versions manifest.
#   next:   run from any pushed branch. Uploads only app.js/app.css (open the IDE with ?ideVersion=next).
#   --no-check: keep the local test content in public/ (next only).

usage() {
    echo "Usage: ./autoUpload.sh --tag latest|next [--no-check (next only)]"
}

CHECK=true
TAG=""

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --tag)
            TAG="$2"
            shift 2
            ;;
        --tag=*)
            TAG="${1#*=}"
            shift
            ;;
        --check)
            shift
            ;;
        --no-check|--no-ch|-ch)
            CHECK=false
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "Error: unknown argument '$1'."
            usage
            exit 1
            ;;
    esac
done

if [[ "$TAG" != "latest" && "$TAG" != "next" ]]; then
    echo "Error: --tag must be 'latest' or 'next'."
    usage
    exit 1
fi

# Vite copies public/ into dist/, so test content left there would end up in the immutable tarball.
if [[ "$TAG" == "latest" && "$CHECK" == false ]]; then
    echo "Error: --no-check is only allowed with --tag next (latest tarballs must not include local test content)."
    exit 1
fi

export RELEASE_TAG="$TAG"

# Remove local test content before building
if [ "$CHECK" = true ]; then
    if ! node src/utils/checkDeleted.js; then
        echo "checkDeleted.js failed."
        exit 1
    fi
fi

# Preflight, build, upload JS/CSS, pack the tarball and publish it (see "build" in package.json)
if ! npm run build; then
    echo "npm run build failed."
    exit 1
fi

echo "Release ($RELEASE_TAG) completed successfully."

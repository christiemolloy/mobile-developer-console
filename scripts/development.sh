#!/bin/bash

NAMESPACE="${NAMESPACE:-mobile-console}"

# Mobile Security Service config
MSS_NAMESPACE=$MSS_NAMESPACE
MSS_APPS_NAMESPACE=${MSS_APPS_NAMESPACE:-$MSS_NAMESPACE}

# Use the minishift instance for local development
cd "$(dirname "$0")" || exit 1

MINISHIFT_STATUS=`minishift status | head -1 | awk -F: '/ /{gsub(/ /, "", $2); print $2}'`
if [ "$MINISHIFT_STATUS" == "Stopped" ]; then
  echo "minishift is not running"
  exit 1
fi

MINISHIFT_IP=`minishift ip`
echo "minishift ip is $MINISHIFT_IP"
oc login "$MINISHIFT_IP:8443" --username=developer --password=developer --insecure-skip-tls-verify=true
USER_TOKEN=`oc whoami -t`
echo "Use namespace $NAMESPACE"
oc project $NAMESPACE
echo "Setup environment variables"
export OPENSHIFT_HOST="$MINISHIFT_IP:8443"
export OPENSHIFT_USER_TOKEN="$USER_TOKEN"
export NAMESPACE="$NAMESPACE"
export ENABLE_BUILD_TAB="false"
export MSS_NAMESPACE=$MSS_NAMESPACE
export MSS_APPS_NAMESPACE=$MSS_APPS_NAMESPACE
echo "Start local development server..."
cd ../
if [ "$1" != "--skip-npm-install" ]; then
  npm install
fi
npm run start:server 
# &
# npm run start:client

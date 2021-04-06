#!/bin/bash
set -e

#FEATURE TOGGLES
cloudmapCollectData=${CLOUDMAPPER_COLLECT_DATA:-1}
cloudmapExportReport=${CLOUDMAPPER_EXPORT_REPORT:-1}
cloudmapRunServer=${CLOUDMAPPER_RUN_SERVER:-0}

cloudmapConfigFile='./account-data/config.json'

if [ -z "${AWS_ACCOUNT_NAME}" ]; then
  AWS_ACCOUNT_NAME=$(aws iam list-account-aliases | jq -r '.AccountAliases[0]')
fi

if [ -z "${AWS_ACCOUNT_ID}" ]; then
  AWS_ACCOUNT_ID=$(aws sts get-caller-identity | jq -r '.Account')
fi

echo "Hello ${AWS_ACCOUNT_NAME} (${AWS_ACCOUNT_ID})!"

if [ -z "$(cat ${cloudmapConfigFile} | grep ${AWS_ACCOUNT_ID})" ]; then
  echo "AutoConfig for ${AWS_ACCOUNT_ID}"
  python cloudmapper.py configure add-account \
     --config ${cloudmapConfigFile} \
     --name ${AWS_ACCOUNT_NAME} \
     --id ${AWS_ACCOUNT_ID} \
     --default true
fi

cat ${cloudmapConfigFile}

if [ $cloudmapCollectData -gt 0 ]; then
  echo "Collecting data..."
  python cloudmapper.py collect \
    --config ${cloudmapConfigFile} \
    --account "${AWS_ACCOUNT_NAME}" \
    --max-attempts 10
fi

if [ ! -d ./account-data/${AWS_ACCOUNT_NAME} ]; then
  echo "--FAIL-- CLOUDMAPPER_COLLECT_DATA must be set to 1, at least once"
  exit 1
fi

if [ $cloudmapExportReport -gt 0 ]; then
  python cloudmapper.py report \
    --config ${cloudmapConfigFile} \
    --account "${AWS_ACCOUNT_NAME}"
fi

if [ $cloudmapRunServer -gt 0 ]; then
  echo "Preparing for server run"
  python cloudmapper.py prepare \
    --config ${cloudmapConfigFile} \
    --account "${AWS_ACCOUNT_NAME}"
  python cloudmapper.py webserver --public
fi

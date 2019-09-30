#!/bin/bash

aws s3 cp s3://$S3_BUCKET/run_cloudmapper.sh .
if [ $? -ne 0 ]; then
    echo "ERROR: The script run_cloudmapper.sh was not found"
    aws cloudwatch put-metric-data --namespace cloudmapper --metric-data MetricName=errors,Value=1
    exit 1
fi
chmod +x ./run_cloudmapper.sh
# Run the script for 3 hours before timing out
timeout --preserve-status --signal=KILL 3h ./run_cloudmapper.sh
if [ $? -ne 0 ]; then
    echo "ERROR: The script timed out or errored"
    aws cloudwatch put-metric-data --namespace cloudmapper --metric-data MetricName=errors,Value=1
    exit 1
fi
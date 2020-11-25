#!/bin/bash

echo "Running run_cloudmapper"

# Configure the AWS SDK so we can assume roles
mkdir ~/.aws
aws s3 cp s3://$S3_BUCKET/config ~/.aws/config

# Get CloudMapper config
aws s3 cp s3://$S3_BUCKET/config.json config.json
aws s3 cp s3://$S3_BUCKET/audit_config_override.yaml config/audit_config_override.yaml

# Get Slack webhook
export SLACK_WEBHOOK=$(aws secretsmanager get-secret-value --secret-id cloudmapper-slack-webhook | jq -cr '.SecretString|fromjson|.webhook')

echo "Starting CloudMapper audit" | python ./utils/toslack.py

mkdir collect_logs

children_pids=""

# Collect the metadata from the AWS accounts
while read account; do
    # For each account, run the following function in the background
    function collect {
        echo "*** Collecting from $1"
        python cloudmapper.py collect --profile $1 --account $1 > collect_logs/$1
        if [ $? -ne 0 ]; then
            echo "ERROR: The collect command had an error for account $1" | tee >(python ./utils/toslack.py)
            tail collect_logs/$1
            # Record error
            aws cloudwatch put-metric-data --namespace cloudmapper --metric-data MetricName=errors,Value=1
        else
            # Record collection was successful
            echo "  Collection from $1 was successful"
            # Record successful collection
            aws cloudwatch put-metric-data --namespace cloudmapper --metric-data MetricName=collections,Value=1
        fi
    }
    collect $account &
    children_pids+="$! "
    echo "children pids = $children_pids"
done <<< "$(grep profile ~/.aws/config | sed 's/\[profile //' | sed 's/\]//')"

# Wait for all the collections to finish
sleep 10
wait $children_pids
sleep 10

echo "Done waiting, start audit"

# Audit the accounts and send the alerts to Slack
python cloudmapper.py audit --accounts all --markdown --minimum_severity $MINIMUM_ALERT_SEVERITY | python ./utils/toslack.py
if [ $? -ne 0 ]; then
    echo "ERROR: The audit command had an error"
    aws cloudwatch put-metric-data --namespace cloudmapper --metric-data MetricName=errors,Value=1
fi

echo "Generate the report"
python cloudmapper.py report --accounts all --minimum_severity $MINIMUM_REPORT_SEVERITY
if [ $? -ne 0 ]; then
    echo "ERROR: The report command had an error"
    aws cloudwatch put-metric-data --namespace cloudmapper --metric-data MetricName=errors,Value=1
fi

# Copy the collect data to the S3 bucket
echo "Exporting account data"
aws s3 sync --no-progress --quiet --delete account-data/ s3://$S3_BUCKET/account-data/
if [ $? -ne 0 ]; then
    echo "ERROR: syncing account-data failed"
    aws cloudwatch put-metric-data --namespace cloudmapper --metric-data MetricName=errors,Value=1
fi

# Copy the logs to the S3 bucket
echo "Exporting collection logs"
aws s3 sync --no-progress --quiet --delete collect_logs/ s3://$S3_BUCKET/collect_logs/
if [ $? -ne 0 ]; then
    echo "ERROR: syncing the collection logs failed"
    aws cloudwatch put-metric-data --namespace cloudmapper --metric-data MetricName=errors,Value=1
fi

# Copy the report to the S3 bucket
echo "Exporting web report"
aws s3 sync --no-progress --quiet --delete web/ s3://$S3_BUCKET/web/
if [ $? -ne 0 ]; then
    echo "ERROR: syncing web directory failed"
    aws cloudwatch put-metric-data --namespace cloudmapper --metric-data MetricName=errors,Value=1
fi
echo "Completed CloudMapper audit"

# Write to Cloudwatch (via stdout) and Slack when non-blocking API errors are detected during collection.
if grep "Summary:" collect_logs/* | grep -v '0 errors'; then
  echo "Completed CloudMapper audit with errors" | python ./utils/toslack.py
  grep "Summary:" collect_logs/* | grep -v '0 errors'
  grep "Summary:" collect_logs/* | python ./utils/toslack.py
else
  echo "Completed CloudMapper audit" | python ./utils/toslack.py
fi

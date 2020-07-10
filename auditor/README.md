The purpose of this project is to run CloudMapper's collection and audit capabilities nightly, across multiple accounts, sending any audit findings to a Slack channel and keeping a copy of the collected metadata in an S3 bucket.

<img src="https://raw.githubusercontent.com/duo-labs/cloudmapper/main/docs/images/nightly_scanner_diagram.png" width=100% alt="Diagram">


# Setup
- Clone the required projects and install the necessary modules for CDK deployment:
```
git clone https://github.com/duo-labs/cloudmapper.git
cd cloudmapper/auditor
# Clone CloudMapper again into the auditor (weird, I know, but the only way to keep this all one repo)
git clone https://github.com/duo-labs/cloudmapper.git resources/cloudmapper
npm install
```

- Create an S3 bucket in your account, we'll call `MYCOMPANY-cloudmapper`
- Get a webhook to write to your slack channel and create the Secrets Manager secret `cloudmapper-slack-webhook` with it as follows:
```
aws secretsmanager create-secret --name cloudmapper-slack-webhook --secret-string '{"webhook":"https://hooks.slack.com/services/XXX/YYY/ZZZ"}'
```
- Create an SNS for alarms to go to if errors are encountered.
- Create roles in your other accounts with `SecurityAudit` and `ViewOnlyAccess` privileges and IAM trust policies that allow this account to assume them.
- Edit the files in `s3_bucket_files` and copy them to your S3 bucket.
  - `config`: This is the containers `~/.aws/config` that will be used to assume roles in other accounts.  These must be named CloudMapper.  Note that the `credential_source` is set to `EcsContainer`.
  - `config.json`: CloudMapper config file for specifying the accounts.
  - `audit_config_override.yaml`: CloudMapper config file for muting audit findings.
  - `run_cloudmapper.sh`: script for executing CloudMapper and should be unchanged.
  - `cdk_app.yaml`: config for the CDK, only used during deploy.
- Deploy this CDK app:
```
cdk deploy
```

When prompted, entered "y".

# Daily use
Before setting this up to run against an account, you should manually run CloudMapper's audit or report command on the account to determine which findings should be fixed in the account, or muted.  This is done to avoid having your Slack channel flooded with 100 findings. If you are not fixing or muting issues, the value of this tool will quickly deteriorate.  It does not keep track of issues it previously alerted you about, so it will repeatedly alert on the same problems if action is not taken.  The expectation is you should be receiving a handful or less of alerts each day (ideally zero). If that is not the case, this tool is not being used as intended and you will not get value out of it.

To mute issues, you should modify `audit_config_override.yaml` in the S3 bucket.  To test your changes, you can download the `account-data` from the S3 bucket and run CloudMapper's `audit` command to ensure the filtering works as intended.

To add new accounts, you should first manually run CloudMapper's audit and fix/mute issues as needed.  After that, add the account to the `config.json` and `config` files in the S3 bucket, along with setting up the necessary trust relationship.

## Kicking off a manual scan
To kick off a manual scan, without needing to wait until the scheduled time, run:
```
aws events put-events --entries '[{"Source":"cloudmapper","DetailType":"start","Detail":"{}"}]'
```
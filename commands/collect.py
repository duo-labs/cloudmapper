import datetime
import json
import os.path
import os
import argparse
from shared.common import get_account, datetime_handler
from shutil import rmtree
import boto3
import pyjq
from botocore.exceptions import ClientError, EndpointConnectionError

__description__ = "Run AWS API calls to collect data from the account"


def snakecase(s):
    return s.replace('-', '_')


def get_identifier_from_parameter(parameter):
    if isinstance(parameter, list):
        identifier = parameter[0]
    else:
        identifier = parameter

    return identifier

def get_filename_from_parameter(parameter):
    if isinstance(parameter, list):
        filename = parameter[1]
    else:
        filename = parameter

    return filename.replace('/', '-')

def make_directory(path):
    try:
        os.mkdir(path)
    except OSError:
        # Already exists
        pass

def call_function(outputfile, handler, method_to_call, parameters):
    """Calls the AWS API function and downloads the data"""
    # TODO: Decorate this with rate limiters from
    # https://github.com/Netflix-Skunkworks/cloudaux/blob/master/cloudaux/aws/decorators.py

    data = None
    if os.path.isfile(outputfile):
        # Data already collected, so skip
        return

    print "Making call for {}".format(outputfile)
    try:
        if handler.can_paginate(method_to_call):
            paginator = handler.get_paginator(method_to_call)
            page_iterator = paginator.paginate(**parameters)

            for response in page_iterator:
                if not data:
                    data = response
                else:
                    print "  ...paginating"
                    for k in data:
                        if isinstance(data[k], list):
                            data[k].extend(response[k])

        else:
            function = getattr(handler, method_to_call)
            data = function(**parameters)

    except ClientError as e:
        if "NoSuchBucketPolicy" in str(e):
            pass
        else:
            print "ClientError: {}".format(e)
    except EndpointConnectionError as e:
        pass

    # Remove unused values
    if data is not None:
        data.pop('ResponseMetadata', None)
        data.pop('Marker', None)
        data.pop('IsTruncated', None)

    with open(outputfile, 'w+') as f:
            f.write(json.dumps(data, indent=4, sort_keys=True, default=datetime_handler))


def collect(arguments):
    account_dir = './{}'.format(arguments.account_name)

    if arguments.clean and os.path.exists(account_dir):
        rmtree(account_dir)

    make_directory("account-data")
    make_directory("account-data/{}".format(account_dir))

    print("* Getting region names")
    session_data = {}

    if arguments.profile_name:
        session_data['profile_name'] = arguments.profile_name

    session = boto3.Session(**session_data)
    ec2 = session.client('ec2')

    region_list = ec2.describe_regions()
    with open("account-data/{}/describe-regions.json".format(account_dir), 'w+') as f:
        f.write(json.dumps(region_list, indent=4, sort_keys=True))

    print("* Creating directory for each region name")
    for region in region_list['Regions']:
        make_directory('account-data/{}/{}'.format(account_dir, region.get('RegionName', 'Unknown')))

    # Services that will only be queried in us-east-1
    universal_services = ['sts', 'iam', 'route53', 'route53domains', 's3']

    runners_list = [
        {
            # Put this first so the report can be downloaded later
            "Service": "iam",
            "Request": "generate-credential-report",
        },
        {
            "Service": "sts",
            "Request": "get-caller-identity",
        },
        {
            "Service": "iam",
            "Request": "get-account-authorization-details",
        },
        {
            "Service": "iam",
            "Request": "get-account-password-policy",
        },
        {
            "Service": "iam",
            "Request": "get-account-summary",
        },
        {
            "Service": "iam",
            "Request": "list-account-aliases",
        },
        {
            "Service": "iam",
            "Request": "get-credential-report",
        },
        {
            "Service": "iam",
            "Request": "list-saml-providers",
        },
        {
            "Service": "iam",
            "Request": "get-saml-provider",
            "ParameterName": "SamlProviderArn",
            "ParameterValue": "iam-list-saml-providers.json|.OpenIDConnectProviderList[]|.Arn",
        },
        {
            "Service": "iam",
            "Request": "list-open-id-connect-providers",
        },
        {
            "Service": "iam",
            "Request": "get-open-id-connect-providers",
            "ParameterName": "SamlProviderArn",
            "ParameterValue": "iam-list-open-id-connect-providers.json|.SAMLProviderList[]|.Arn",
        },
        {
            "Service": "s3",
            "Request": "list-buckets"
        },
        {
            "Service": "s3",
            "Request": "get-bucket-acl",
            "ParameterName": "Bucket",
            "ParameterValue": "s3-list-buckets.json|.Buckets[].Name",
        },
        {
            "Service": "s3",
            "Request": "get-bucket-policy",
            "ParameterName": "Bucket",
            "ParameterValue": "s3-list-buckets.json|.Buckets[].Name",
        },
        {
            "Service": "route53",
            "Request": "list-hosted-zones",
        },
        {
            "Service": "route53",
            "Request": "list-resource-record-sets",
            "ParameterName": "HostedZoneId",
            "ParameterValue": "route53-list-hosted-zones.json|.HostedZones[]|[.Id,.Name]",
        },
        {
            "Service": "route53domains",
            "Request": "list-domains",
        },
        {
            "Service": "ec2",
            "Request": "describe-vpcs"
        },
        {
            "Service": "ec2",
            "Request": "describe-availability-zones"
        },
        {
            "Service": "ec2",
            "Request": "describe-subnets"
        },
        {
            "Service": "ec2",
            "Request": "describe-instances"
        },
        {
            "Service": "ec2",
            "Request": "describe-addresses"
        },
        {
            "Service": "cloudtrail",
            "Request": "describe-trails"
        },
        {
            "Service": "rds",
            "Request": "describe-db-instances"
        },
        {
            "Service": "rds",
            "Request": "describe-db-snapshots"
        },
        {
            "Service": "rds",
            "Request": "describe-db-snapshot-attributes",
            "ParameterName": "DBSnapshotIdentifier",
            "ParameterValue": "rds-describe-db-snapshots.json|.DBSnapshots[]|.DBSnapshotIdentifier",
        },
        {
            "Service": "elb",
            "Request": "describe-load-balancers"
        },
        {
            "Service": "elb",
            "Request": "describe-load-balancer-policies"
        },
        {
            "Service": "elbv2",
            "Request": "describe-load-balancers"
        },
        {
            "Service": "redshift",
            "Request": "describe-clusters"
        },
        {
            "Service": "sqs",
            "Request": "list-queues"
        },
        {
            "Service": "sqs",
            "Request": "get-queue-attributes",
            "ParameterName": "QueueUrl",
            "ParameterValue": "sqs-list-queues.json|.QueueUrls[]",
        },
        {
            "Service": "sns",
            "Request": "list-topics"
        },
        {
            "Service": "ec2",
            "Request": "describe-security-groups"
        },
        {
            "Service": "ec2",
            "Request": "describe-network-interfaces"
        },
        {
            "Service": "ec2",
            "Request": "describe-vpc-peering-connections"
        },
        {
            "Service": "directconnect",
            "Request": "describe-connections"
        },
        {
            "Service": "autoscaling",
            "Request": "describe-policies"
        },
        {
            "Service": "autoscaling",
            "Request": "describe-auto-scaling-groups"
        },
        {
            "Service": "cloudformation",
            "Request": "describe-stacks"
        },
        {
            "Service": "cloudformation",
            "Request": "get-template",
            "ParameterName": "StackName",
            "ParameterValue": "cloudformation-describe-stacks.json|.Stacks[]|.StackName",
        },
        {
            "Service": "cloudformation",
            "Request": "describe-stack-resources",
            "ParameterName": "StackName",
            "ParameterValue": "cloudformation-describe-stacks.json|.Stacks[]|.StackName",
        },
        {
            "Service": "cloudfront",
            "Request": "list-distributions"
        },
        {
            "Service": "cloudsearch",
            "Request": "describe-domains"
        },
        {
            "Service": "cloudsearch",
            "Request": "describe-service-access-policies",
            "ParameterName": "DomainName",
            "ParameterValue": "cloudsearch-describe-domains.json|.DomainStatusList[]|.DomainName",
        },
        {
            "Service": "cloudwatch",
            "Request": "describe-alarms"
        },
        {
            "Service": "config",
            "Request": "describe-config-rules"
        },
        {
            "Service": "config",
            "Request": "describe-configuration-recorders"
        },
        {
            "Service": "config",
            "Request": "describe-delivery-channels"
        },
        {
            "Service": "ec2",
            "Request": "describe-images",
            "Parameters": [
                {"Name": "Owners", "Value": ["self"]}
            ]
        },
        {
            "Service": "ec2",
            "Request": "describe-network-acls"
        },
        {
            "Service": "ec2",
            "Request": "describe-route-tables"
        },
        {
            "Service": "ec2",
            "Request": "describe-flow-logs"
        },
        {
            "Service": "ec2",
            "Request": "describe-snapshots",
            "Parameters": [
                {"Name": "OwnerIds", "Value": ["self"]},
                {"Name": "RestorableByUserIds", "Value": ["all"]}
            ]
        },
        {
            "Service": "ec2",
            "Request": "describe-vpc-endpoint-connections"
        },
        {
            "Service": "ec2",
            "Request": "describe-vpn-connections"
        },
        {
            "Service": "ec2",
            "Request": "describe-vpn-gateways"
        },
        {
            "Service": "ecr",
            "Request": "describe-repositories"
        },
        {
            "Service": "ecr",
            "Request": "get-repository-policy",
            "ParameterName": "repositoryName",
            "ParameterValue": "ecr-describe-repositories.json|.repositories[]|.repositoryName"
        },
        {
            "Service": "elasticache",
            "Request": "describe-cache-clusters"
        },
        {
            "Service": "elasticbeanstalk",
            "Request": "describe-applications"
        },
        {
            "Service": "efs",
            "Request": "describe-file-systems"
        },
        {
            "Service": "es",
            "Request": "list-domain-names"
        },
        {
            "Service": "es",
            "Request": "describe-elasticsearch-domain",
            "ParameterName": "DomainName",
            "ParameterValue": "es-list-domain-names.json|.DomainNames[]|.DomainName"
        },
        {
            "Service": "events",
            "Request": "describe-event-bus"
        },
        {
            "Service": "events",
            "Request": "list-rules"
        },
        {
            "Service": "firehose",
            "Request": "list-delivery-streams"
        },
        {
            "Service": "firehose",
            "Request": "describe-delivery-stream",
            "ParameterName": "DeliveryStreamName",
            "ParameterValue": "firehose-list-delivery-streams.json|.DeliveryStreamNames[]"
        },
        {
            "Service": "glacier",
            "Request": "list-vaults",
            "Parameters": [
                {"Name": "accountId", "Value": "-"}
            ]
        },
        {
            "Service": "glacier",
            "Request": "get-vault-access-policy",
            "Parameters": [
                {"Name": "accountId", "Value": "-"}
            ],
            "ParameterName": "vaultName",
            "ParameterValue": "glacier-list-vaults.json|.VaultList[]|.VaultName"
        },
        {
            "Service": "kms",
            "Request": "list-keys"
        },
        {
            "Service": "kms",
            "Request": "list-grants",
            "ParameterName": "KeyId",
            "ParameterValue": "kms-list-keys.json|.Keys[]|.KeyId"
        },
        {
            "Service": "kms",
            "Request": "list-key-policies",
            "ParameterName": "KeyId",
            "ParameterValue": "kms-list-keys.json|.Keys[]|.KeyId"
        },
        {
            "Service": "kms",
            "Request": "get-key-rotation-status",
            "ParameterName": "KeyId",
            "ParameterValue": "kms-list-keys.json|.Keys[]|.KeyId"
        },
        {
            "Service": "lambda",
            "Request": "list-functions"
        },
        {
            "Service": "lambda",
            "Request": "get-policy",
            "ParameterName": "FunctionName",
            "ParameterValue": "lambda-list-functins.json|.Functions[]|.FunctionName"
        },
        {
            "Service": "logs",
            "Request": "describe-destinations"
        },
        {
            "Service": "logs",
            "Request": "describe-log-groups"
        },
        {
            "Service": "logs",
            "Request": "describe-resource-policies"
        },
    ]

    for runner in runners_list:
        print("* Getting {}:{} info".format(runner['Service'], runner['Request']))

        parameters = {}
        if runner.get('Parameters', False):
            # TODO: I need to consolidate the Parameters and ParameterName/ParameterValue
            # variables
            for parameter in runner['Parameters']:
                parameters[parameter['Name']] = parameter['Value']

        for region in region_list['Regions']:
            # Only call universal services in us-east-1
            if runner['Service'] in universal_services and region['RegionName'] != 'us-east-1':
                continue
            handler = boto3.client(runner['Service'], region_name=region['RegionName'])

            filepath = "account-data/{}/{}/{}-{}".format(
                account_dir,
                region['RegionName'],
                runner['Service'],
                runner['Request'])

            
            method_to_call = snakecase(runner["Request"])
            if runner.get('ParameterName', False):
                make_directory(filepath)

                parameter_file = runner['ParameterValue'].split('|')[0]
                parameter_file = "account-data/{}/{}/{}".format(account_dir, region['RegionName'], parameter_file)

                if not os.path.isfile(parameter_file):
                    # The file where parameters are obtained from does not exist
                    continue

                with open(parameter_file, 'r') as f:
                    parameter_values = json.load(f)
                    pyjq_parse_string = '|'.join(runner['ParameterValue'].split('|')[1:])
                    for parameter in pyjq.all(pyjq_parse_string, parameter_values):
                        data = ""

                        filename = get_filename_from_parameter(parameter)
                        identifier = get_identifier_from_parameter(parameter)
                        parameters[runner['ParameterName']] = identifier

                        outputfile = "{}/{}".format(
                            filepath,
                            filename)

                        call_function(outputfile, handler, method_to_call, parameters)
            else:
                filepath = filepath+".json"
                call_function(filepath, handler, method_to_call, parameters)


def run(arguments):
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", help="Config file name",
                        default="config.json", type=str)
    parser.add_argument("--account-name", help="Account to collect from",
                        required=False, type=str)
    parser.add_argument("--profile-name", help="AWS profile name",
                        required=False, type=str)
    parser.add_argument('--clean', help='Remove any existing data for the account before gathering', action='store_true')

    args = parser.parse_args(arguments)

    if not args.account_name:
        try:
            config = json.load(open(args.config))
        except IOError:
            exit("ERROR: Unable to load config file \"{}\"".format(args.config))
        except ValueError as e:
            exit("ERROR: Config file \"{}\" could not be loaded ({}), see config.json.demo for an example".format(args.config, e))
        args.account_name = get_account(args.account_name, config, args.config)['name']

    collect(args)

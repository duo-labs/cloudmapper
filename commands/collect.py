
import os.path
import os
import argparse
from shutil import rmtree
import logging
import json
import boto3
import yaml
import pyjq
import urllib.parse
from botocore.exceptions import ClientError, EndpointConnectionError, NoCredentialsError
from shared.common import get_account, custom_serializer

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

    return urllib.parse.quote_plus(filename)

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

    print("Making call for {}".format(outputfile))
    try:
        if handler.can_paginate(method_to_call):
            paginator = handler.get_paginator(method_to_call)
            page_iterator = paginator.paginate(**parameters)

            for response in page_iterator:
                if not data:
                    data = response
                else:
                    print("  ...paginating")
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
            print("ClientError: {}".format(e))
    except EndpointConnectionError as e:
        pass

    # Remove unused values
    if data is not None:
        data.pop('ResponseMetadata', None)
        data.pop('Marker', None)
        data.pop('IsTruncated', None)

    with open(outputfile, 'w+') as f:
        f.write(json.dumps(data, indent=4, sort_keys=True, default=custom_serializer))


def collect(arguments):
    logging.getLogger('botocore').setLevel(logging.WARN)
    account_dir = './{}'.format(arguments.account_name)

    if arguments.clean and os.path.exists(account_dir):
        rmtree(account_dir)

    make_directory("account-data")
    make_directory("account-data/{}".format(account_dir))

    session_data = {'region_name': 'us-east-1'}

    if arguments.profile_name:
        session_data['profile_name'] = arguments.profile_name

    session = boto3.Session(**session_data)

    # Ensure we can make iam calls
    iam = session.client('iam')
    try:
        iam.get_user(UserName='test')
    except ClientError as e:
        if 'InvalidClientTokenId' in str(e):
            print("ERROR: AWS doesn't allow you to make IAM calls without MFA, and the collect command gathers IAM data.  Please use MFA.")
            exit(-1)
        if 'NoSuchEntity' in str(e):
            # Ignore, we're just testing that our creds work
            pass
        else:
            print("ERROR: Ensure your creds are valid.")
            print(e)
            exit(-1)
    except NoCredentialsError:
        print("ERROR: No AWS credentials configured.")
        exit(-1)

    print("* Getting region names")
    ec2 = session.client('ec2')
    region_list = ec2.describe_regions()
    with open("account-data/{}/describe-regions.json".format(account_dir), 'w+') as f:
        f.write(json.dumps(region_list, indent=4, sort_keys=True))

    print("* Creating directory for each region name")
    for region in region_list['Regions']:
        make_directory('account-data/{}/{}'.format(account_dir, region.get('RegionName', 'Unknown')))

    # Services that will only be queried in us-east-1
    universal_services = ['sts', 'iam', 'route53', 'route53domains', 's3']

    with open("collect_commands.yaml", 'r') as f:
        collect_commands = yaml.safe_load(f)

    for runner in collect_commands:
        print('* Getting {}:{} info'.format(runner['Service'], runner['Request']))

        parameters = {}
        for region in region_list['Regions']:
            dynamic_parameter = None
            # Only call universal services in us-east-1
            if runner['Service'] in universal_services and region['RegionName'] != 'us-east-1':
                continue
            handler = session.client(runner['Service'], region_name=region['RegionName'])

            filepath = "account-data/{}/{}/{}-{}".format(
                account_dir,
                region['RegionName'],
                runner['Service'],
                runner['Request'])

            method_to_call = snakecase(runner["Request"])

            # Identify any parameters
            if runner.get('Parameters', False):
                for parameter in runner['Parameters']:
                    parameters[parameter['Name']] = parameter['Value']

                    # Look for any dynamic values (ones that jq parse a file)
                    if '|' in parameter['Value']:
                        dynamic_parameter = parameter['Name']

            if dynamic_parameter is not None:
                # Set up directory for the dynamic value
                make_directory(filepath)

                # The dynamic parameter must always be the first value
                parameter_file = parameters[dynamic_parameter].split('|')[0]
                parameter_file = "account-data/{}/{}/{}".format(account_dir, region['RegionName'], parameter_file)

                if not os.path.isfile(parameter_file):
                    # The file where parameters are obtained from does not exist
                    continue

                with open(parameter_file, 'r') as f:
                    parameter_values = json.load(f)
                    pyjq_parse_string = '|'.join(parameters[dynamic_parameter].split('|')[1:])
                    for parameter in pyjq.all(pyjq_parse_string, parameter_values):
                        filename = get_filename_from_parameter(parameter)
                        identifier = get_identifier_from_parameter(parameter)
                        parameters[dynamic_parameter] = identifier

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
    parser.add_argument("--account", help="Account to collect from",
                        required=False, type=str, dest='account_name')
    parser.add_argument("--profile", help="AWS profile name",
                        required=False, type=str, dest='profile_name')
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

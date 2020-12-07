import os.path
import os
import glob
import argparse
from shutil import rmtree
import logging
import json
import time
import boto3
import yaml
import pyjq
import urllib.parse
from botocore.exceptions import ClientError, EndpointConnectionError, NoCredentialsError
from shared.common import get_account, custom_serializer
from botocore.config import Config

__description__ = "Run AWS API calls to collect data from the account"

MAX_RETRIES = 3

def snakecase(s):
    return s.replace("-", "_")


def get_identifier_from_parameter(parameter):
    if isinstance(parameter, list):
        identifier = parameter[0]
    else:
        identifier = parameter

    return identifier


def get_filename_from_parameter(parameter):
    if isinstance(parameter, list):
        if len(parameter) > 1:
            filename = parameter[1]
        elif isinstance(parameter[0], list):
            # For elbv2:describe-tags we need ResourceArns as a list like `[Arn]`
            # the yaml file specifies `[[.LoadBalancerArn]]` because just doing
            # `[.LoadBalancerArn]` presents other issues, so this extracts out the inner, inner value.
            # Similar issue for elb:describe-tags
            filename = parameter[0][0]
    else:
        filename = parameter

    return urllib.parse.quote_plus(filename)


def make_directory(path):
    try:
        os.mkdir(path)
    except OSError:
        # Already exists
        pass


def call_function(outputfile, handler, method_to_call, parameters, check, summary):
    """
    Calls the AWS API function and downloads the data

    check: Value to check and repeat the call if it fails
    summary: Keeps tracks of failures
    """
    # TODO: Decorate this with rate limiters from
    # https://github.com/Netflix-Skunkworks/cloudaux/blob/master/cloudaux/aws/decorators.py

    data = None
    if os.path.isfile(outputfile):
        # Data already collected, so skip
        print("  Response already collected at {}".format(outputfile), flush=True)
        return

    call_summary = {
        "service": handler.meta.service_model.service_name,
        "action": method_to_call,
        "parameters": parameters,
    }

    print("  Making call for {}".format(outputfile), flush=True)
    try:
        for retries in range(MAX_RETRIES):
            if handler.can_paginate(method_to_call):
                paginator = handler.get_paginator(method_to_call)
                page_iterator = paginator.paginate(**parameters)

                for response in page_iterator:
                    if not data:
                        data = response
                    else:
                        print("  ...paginating", flush=True)
                        for k in data:
                            if isinstance(data[k], list):
                                data[k].extend(response[k])
            else:
                function = getattr(handler, method_to_call)
                data = function(**parameters)

            if check is not None:
                if data[check[0]["Name"]] == check[0]["Value"]:
                    continue
                if retries == MAX_RETRIES - 1:
                    raise Exception(
                        "Check value {} never set as {} in response".format(
                            check["Name"], check["Value"]
                        )
                    )
                print("  Sleeping and retrying")
                time.sleep(3)
            else:
                break

    except ClientError as e:
        if "NoSuchBucketPolicy" in str(e):
            # This error occurs when you try to get the bucket policy for a bucket that has no bucket policy, so this can be ignored.
            print("  - No bucket policy")
        elif "NoSuchPublicAccessBlockConfiguration" in str(e):
            # This error occurs when you try to get the account Public Access Block policy for an account that has none, so this can be ignored.
            print("  - No public access block set")
        elif (
            "ServerSideEncryptionConfigurationNotFoundError" in str(e)
            and call_summary["service"] == "s3"
            and call_summary["action"] == "get_bucket_encryption"
        ):
            print("  - No encryption set")
        elif (
            "NoSuchEntity" in str(e)
            and call_summary["action"] == "get_account_password_policy"
        ):
            print("  - No password policy set")
        elif (
            "AccessDeniedException" in str(e)
            and call_summary["service"] == "organizations"
            and call_summary["action"] == "list_accounts"
        ):
            print("  - Denied, which likely means this is not the organization root")
        elif (
            "RepositoryPolicyNotFoundException" in str(e)
            and call_summary["service"] == "ecr"
            and call_summary["action"] == "get_repository_policy"
        ):
            print("  - No policy exists")
        elif (
            "ResourceNotFoundException" in str(e)
            and call_summary["service"] == "lambda"
            and call_summary["action"] == "get_policy"
        ):
            print("  - No policy exists")
        elif (
            "AccessDeniedException" in str(e)
            and call_summary["service"] == "kms"
            and call_summary["action"] == "list_key_policies"
        ):
            print("  - Denied, which should mean this KMS has restricted access")
        elif (
            "AccessDeniedException" in str(e)
            and call_summary["service"] == "kms"
            and call_summary["action"] == "list_grants"
        ):
            print("  - Denied, which should mean this KMS has restricted access")
        elif (
            "AccessDeniedException" in str(e)
            and call_summary["service"] == "kms"
            and call_summary["action"] == "get_key_policy"
        ):
            print("  - Denied, which should mean this KMS has restricted access")
        elif (
            "AccessDeniedException" in str(e)
            and call_summary["service"] == "kms"
            and call_summary["action"] == "get_key_rotation_status"
        ):
            print("  - Denied, which should mean this KMS has restricted access")
        elif "AWSOrganizationsNotInUseException" in str(e):
            print(' - Your account is not a member of an organization.')
        else:
            print("ClientError: {}".format(e), flush=True)
            call_summary["exception"] = e
    except EndpointConnectionError as e:
        print("EndpointConnectionError: {}".format(e), flush=True)
        call_summary["exception"] = e
    except Exception as e:
        print("Exception: {}".format(e), flush=True)
        call_summary["exception"] = e

    # Remove unused values
    if data is not None:
        data.pop("ResponseMetadata", None)
        data.pop("Marker", None)
        data.pop("IsTruncated", None)

    if data is not None:
        with open(outputfile, "w+") as f:
            f.write(
                json.dumps(data, indent=4, sort_keys=True, default=custom_serializer)
            )

    summary.append(call_summary)


def collect(arguments):
    logging.getLogger("botocore").setLevel(logging.WARN)
    account_dir = "./{}".format(arguments.account_name)

    summary = []

    if arguments.clean and os.path.exists("account-data/{}".format(account_dir)):
        rmtree("account-data/{}".format(account_dir))

    make_directory("account-data")
    make_directory("account-data/{}".format(account_dir))

    # Identify the default region used by global services such as IAM
    default_region = os.environ.get("AWS_REGION", "us-east-1")
    if 'gov-' in default_region:
        default_region = 'us-gov-west-1'
    elif 'cn-' in default_region:
        default_region = 'cn-north-1'
    else:
        default_region = 'us-east-1'

    regions_filter = None
    if len(arguments.regions_filter) > 0:
        regions_filter = arguments.regions_filter.lower().split(",")
        # Force include of default region -- seems to be required
        if default_region not in regions_filter:
            regions_filter.append(default_region)

    session_data = {"region_name": default_region}

    if arguments.profile_name:
        session_data["profile_name"] = arguments.profile_name

    session = boto3.Session(**session_data)

    sts = session.client("sts")
    try:
        sts.get_caller_identity()
    except ClientError as e:
        if "InvalidClientTokenId" in str(e):
            print(
                "ERROR: sts.get_caller_identity failed with InvalidClientTokenId. Likely cause is no AWS credentials are set.",
                flush=True,
            )
            exit(-1)
        else:
            print(
                "ERROR: Unknown exception when trying to call sts.get_caller_identity: {}".format(
                    e
                ),
                flush=True,
            )
            exit(-1)

    # Ensure we can make iam calls
    iam = session.client("iam")
    try:
        iam.get_user(UserName="test")
    except ClientError as e:
        if "InvalidClientTokenId" in str(e):
            print(
                "ERROR: AWS doesn't allow you to make IAM calls from a session without MFA, and the collect command gathers IAM data.  Please use MFA or don't use a session. With aws-vault, specify `--no-session` on your `exec`.",
                flush=True,
            )
            exit(-1)
        if "NoSuchEntity" in str(e):
            # Ignore, we're just testing that our creds work
            pass
        else:
            print("ERROR: Ensure your creds are valid.", flush=True)
            print(e, flush=True)
            exit(-1)
    except NoCredentialsError:
        print("ERROR: No AWS credentials configured.", flush=True)
        exit(-1)

    print("* Getting region names", flush=True)
    ec2 = session.client("ec2")
    region_list = ec2.describe_regions()

    if regions_filter is not None:
        filtered_regions = [r for r in region_list["Regions"] if r["RegionName"] in regions_filter]
        region_list["Regions"] = filtered_regions

    with open("account-data/{}/describe-regions.json".format(account_dir), "w+") as f:
        f.write(json.dumps(region_list, indent=4, sort_keys=True))

    print("* Creating directory for each region name", flush=True)
    for region in region_list["Regions"]:
        make_directory(
            "account-data/{}/{}".format(
                account_dir, region.get("RegionName", "Unknown")
            )
        )

    # Services that will only be queried in the default_
    # TODO: Identify these from boto
    universal_services = [
        "sts",
        "iam",
        "route53",
        "route53domains",
        "s3",
        "s3control",
        "cloudfront",
        "organizations",
    ]

    with open("collect_commands.yaml", "r") as f:
        collect_commands = yaml.safe_load(f)

    for runner in collect_commands:
        print(
            "* Getting {}:{} info".format(runner["Service"], runner["Request"]),
            flush=True,
        )

        parameters = {}
        for region in region_list["Regions"]:
            dynamic_parameter = None
            # Only call universal services in default region
            if runner["Service"] in universal_services:
                if region["RegionName"] != default_region:
                    continue
            elif region["RegionName"] not in session.get_available_regions(
                runner["Service"]
            ):
                print(
                    "  Skipping region {}, as {} does not exist there".format(
                        region["RegionName"], runner["Service"]
                    )
                )
                continue
            handler = session.client(
                runner["Service"], region_name=region["RegionName"],
                config=Config(retries={'max_attempts': arguments.max_attempts})
            )

            filepath = "account-data/{}/{}/{}-{}".format(
                account_dir, region["RegionName"], runner["Service"], runner["Request"]
            )

            method_to_call = snakecase(runner["Request"])

            # Identify any parameters
            if runner.get("Parameters", False):
                for parameter in runner["Parameters"]:
                    parameters[parameter["Name"]] = parameter["Value"]

                    # Look for any dynamic values (ones that jq parse a file)
                    if "|" in parameter["Value"]:
                        dynamic_parameter = parameter["Name"]

            if runner.get("Custom_collection", False):
                # The data to collect for this function is too complicated for my existing code,
                # so I have to write custom code.
                if runner["Service"] == "ecs" and runner["Request"] == "describe-tasks":
                    action_path = filepath
                    make_directory(action_path)

                    # Read the ecs-list-clusters.json file
                    list_clusters_file = "account-data/{}/{}/{}".format(
                        account_dir, region["RegionName"], "ecs-list-clusters.json"
                    )

                    if os.path.isfile(list_clusters_file):
                        with open(list_clusters_file, "r") as f:
                            list_clusters = json.load(f)

                            # For each cluster, read the `ecs list-tasks`
                            for clusterArn in list_clusters["clusterArns"]:
                                cluster_path = (
                                    action_path + "/" + urllib.parse.quote_plus(clusterArn)
                                )
                                make_directory(cluster_path)

                                list_tasks_file = "account-data/{}/{}/{}/{}".format(
                                    account_dir,
                                    region["RegionName"],
                                    "ecs-list-tasks",
                                    urllib.parse.quote_plus(clusterArn),
                                )

                                with open(list_tasks_file, "r") as f2:
                                    list_tasks = json.load(f2)

                                    # For each task, call `ecs describe-tasks` using the `cluster` and `task` as arguments
                                    for taskArn in list_tasks["taskArns"]:
                                        outputfile = (
                                            action_path
                                            + "/"
                                            + urllib.parse.quote_plus(clusterArn)
                                            + "/"
                                            + urllib.parse.quote_plus(taskArn)
                                        )

                                        call_parameters = {}
                                        call_parameters["cluster"] = clusterArn
                                        call_parameters["tasks"] = [taskArn]

                                        call_function(
                                            outputfile,
                                            handler,
                                            method_to_call,
                                            call_parameters,
                                            runner.get("Check", None),
                                            summary,
                                        )
                elif runner["Service"] == "route53" and runner["Request"] == "list-hosted-zones-by-vpc":
                    action_path = filepath
                    make_directory(action_path)

                    # Read the regions file
                    regions_file = "account-data/{}/{}".format(
                        account_dir, "describe-regions.json"
                    )
                    with open(regions_file, "r") as f:
                        describe_regions = json.load(f)

                        # For each region
                        for collect_region in describe_regions["Regions"]:
                            cluster_path = (
                                action_path + "/" + urllib.parse.quote_plus(collect_region["RegionName"])
                            )
                            make_directory(cluster_path)

                            # Read the VPC file
                            describe_vpcs_file = "account-data/{}/{}/{}".format(
                                account_dir,
                                collect_region["RegionName"],
                                "ec2-describe-vpcs.json"
                            )

                            if os.path.isfile(describe_vpcs_file):
                                with open(describe_vpcs_file, "r") as f2:
                                    describe_vpcs = json.load(f2)

                                    for vpc in describe_vpcs["Vpcs"]:
                                        outputfile = (
                                            action_path
                                            + "/"
                                            + urllib.parse.quote_plus(collect_region["RegionName"])
                                            + "/"
                                            + urllib.parse.quote_plus(vpc["VpcId"])
                                        )

                                        call_parameters = {}
                                        call_parameters["VPCRegion"] = collect_region["RegionName"]
                                        call_parameters["VPCId"] = vpc["VpcId"]
                                        call_function(
                                            outputfile,
                                            handler,
                                            method_to_call,
                                            call_parameters,
                                            runner.get("Check", None),
                                            summary,
                                        )

            elif dynamic_parameter is not None:
                # Set up directory for the dynamic value
                make_directory(filepath)

                # The dynamic parameter must always be the first value
                parameter_file = parameters[dynamic_parameter].split("|")[0]
                parameter_file = "account-data/{}/{}/{}".format(
                    account_dir, region["RegionName"], parameter_file
                )

                # Get array if a globbing pattern is used (ex. "*.json")
                parameter_files = glob.glob(parameter_file)

                for parameter_file in parameter_files:
                    if not os.path.isfile(parameter_file):
                        # The file where parameters are obtained from does not exist
                        # Need to manually add the failure to our list of calls made as this failure
                        # occurs before the call is attempted.
                        call_summary = {
                            "service": handler.meta.service_model.service_name,
                            "action": method_to_call,
                            "parameters": parameters,
                            "exception": "Parameter file does not exist: {}".format(
                                parameter_file
                            ),
                        }
                        summary.append(call_summary)
                        print(
                            "  The file where parameters are obtained from does not exist: {}".format(
                                parameter_file
                            ),
                            flush=True,
                        )
                        continue

                    with open(parameter_file, "r") as f:
                        parameter_values = json.load(f)
                        pyjq_parse_string = "|".join(
                            parameters[dynamic_parameter].split("|")[1:]
                        )
                        for parameter in pyjq.all(pyjq_parse_string, parameter_values):
                            filename = get_filename_from_parameter(parameter)
                            identifier = get_identifier_from_parameter(parameter)
                            call_parameters = dict(parameters)
                            call_parameters[dynamic_parameter] = identifier

                            outputfile = "{}/{}".format(filepath, filename)

                            call_function(
                                outputfile,
                                handler,
                                method_to_call,
                                call_parameters,
                                runner.get("Check", None),
                                summary,
                            )
            else:
                filepath = filepath + ".json"
                call_function(
                    filepath,
                    handler,
                    method_to_call,
                    parameters,
                    runner.get("Check", None),
                    summary,
                )

    # Print summary
    print("--------------------------------------------------------------------")
    failures = []
    for call_summary in summary:
        if "exception" in call_summary:
            failures.append(call_summary)

    print("Summary: {} APIs called. {} errors".format(len(summary), len(failures)))
    if len(failures) > 0:
        print("Failures:")
        for call_summary in failures:
            print(
                "  {}.{}({}): {}".format(
                    call_summary["service"],
                    call_summary["action"],
                    call_summary["parameters"],
                    call_summary["exception"],
                )
            )
        # Ensure errors can be detected
        exit(-1)


def run(arguments):
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--config", help="Config file name", default="config.json", type=str
    )
    parser.add_argument(
        "--account",
        help="Account to collect from",
        required=False,
        type=str,
        dest="account_name",
    )
    parser.add_argument(
        "--profile",
        help="AWS profile name",
        required=False,
        type=str,
        dest="profile_name",
    )
    parser.add_argument(
        "--clean",
        help="Remove any existing data for the account before gathering",
        action="store_true",
    )
    parser.add_argument(
        "--max-attempts",
        help="Override Botocore config max_attempts (default 4)",
        required=False,
        type=int,
        dest="max_attempts",
        default=4
    )
    parser.add_argument(
        "--regions",
        help="Filter and query AWS only for the given regions (CSV)",
        required=False,
        type=str,
        dest="regions_filter",
        default=""
    )

    args = parser.parse_args(arguments)

    if not args.account_name:
        try:
            config = json.load(open(args.config))
        except IOError:
            exit('ERROR: Unable to load config file "{}"'.format(args.config))
        except ValueError as e:
            exit(
                'ERROR: Config file "{}" could not be loaded ({}), see config.json.demo for an example'.format(
                    args.config, e
                )
            )
        args.account_name = get_account(args.account_name, config, args.config)["name"]

    collect(args)

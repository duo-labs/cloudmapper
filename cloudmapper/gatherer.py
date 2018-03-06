import datetime
import json
from os import mkdir, path
from shutil import rmtree
import boto3


def datetime_handler(x):
    if isinstance(x, datetime.datetime):
        return x.isoformat()
    raise TypeError("Unknown type")


def gather(arguments):
    account_dir = './{}'.format(arguments.account_name)
    
    if arguments.clean and path.exists(account_dir):
        rmtree(account_dir)

    try:
        mkdir(account_dir)
    except OSError:
        # Already exists
        pass

    print("* Getting region names")
    session_data = {}

    if arguments.profile_name:
        session_data['profile_name'] = arguments.profile_name

    session = boto3.Session(**session_data)
    ec2 = session.client('ec2')

    region_list = ec2.describe_regions()
    with open("{}/describe-regions.json".format(account_dir), 'w+') as f:
        f.write(json.dumps(region_list, indent=4, sort_keys=True))

    print("* Creating directory for each region name")

    for region in region_list['Regions']:
        try:
            mkdir('{}/{}'.format(account_dir, region.get('RegionName', 'Unknown')))
        except OSError:
            # Already exists
            pass
    runners_list = [
        {
            "Name": "VPC",
            "Function": "describe_vpcs",
            "Handler": "ec2",
            "FileName": "describe-vpcs.json",
        },
        {
            "Name": "AZ",
            "Function": "describe_availability_zones",
            "Handler": "ec2",
            "FileName": "describe-availability-zones.json",
        },
        {
            "Name": "Subnet",
            "Function": "describe_subnets",
            "Handler": "ec2",
            "FileName": "describe-subnets.json",
        },
        {
            "Name": "EC2",
            "Function": "describe_instances",
            "Handler": "ec2",
            "FileName": "describe-instances.json"
        },
        {
            "Name": "RDS",
            "Function": "describe_db_instances",
            "Handler": "rds",
            "FileName": "describe-db-instances.json",
        },
        {
            "Name": "ELB",
            "Function": "describe_load_balancers",
            "Handler": "elb",
            "FileName": "describe-load-balancers.json",
        },
        {
            "Name": "ALBs and NLBs",
            "Function": "describe_load_balancers",
            "Handler": "elbv2",
            "FileName": "describe-load-balancers-v2.json"
        },
        {
            "Name": "Security Groups",
            "Function": "describe_security_groups",
            "Handler": "ec2",
            "FileName": "describe-security-groups.json",
        },
        {
            "Name": "Network interface",
            "Function": "describe_network_interfaces",
            "Handler": "ec2",
            "FileName": "describe-network-interfaces.json",
        },
        {
            "Name": "VPC Peering",
            "Function": "describe_vpc_peering_connections",
            "Handler": "ec2",
            "FileName": "describe-vpc-peering-connections.json"
        }
    ]

    for runner in runners_list:
        print("* Getting {} info".format(runner['Name']))
        for region in region_list['Regions']:
            handler = boto3.client(runner['Handler'], region_name=region['RegionName'])
            method_to_call = getattr(handler, runner["Function"])
            data = method_to_call()
            data.pop('ResponseMetadata', None)
            with open("{}/{}/{}".format(account_dir, region.get('RegionName', 'Unknown'), runner['FileName']), 'w+') as f:
                f.write(json.dumps(data, indent=4, sort_keys=True, default=datetime_handler))

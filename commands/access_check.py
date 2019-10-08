import argparse
import yaml
import json
import parliament

from shared.common import parse_arguments

__description__ = "Check who has access to a resource"


def access_check_command(accounts, config, args):
    """Check who has access"""
    print(args.resource_arn)
    resource_type = parliament.get_resource_type_from_arn(args.resource_arn)


def run(arguments):
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--resource_arn",
        help="The resource to be looked at, such as arn:aws:s3:::mybucket",
        required=True
    )
    parser.add_argument(
        "--privilege",
        help="The privilege in question (ex. s3:GetObject)"
    )
    args, accounts, config = parse_arguments(arguments, parser)
    

    access_check_command(accounts, config, args)

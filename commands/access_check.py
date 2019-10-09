import argparse
import yaml
import json
import parliament
from parliament.policy import Policy

from shared.common import parse_arguments, get_current_policy_doc

__description__ = "Check who has access to a resource"


def access_check_command(accounts, config, args):
    """Check who has access"""
    # Find resource types that match the given ARN
    resource_type_matches = parliament.get_resource_type_matches_from_arn(args.resource_arn)
    if len(resource_type_matches) == 0:
        raise Exception("Unknown ARN type for {}".format(args.resource_arn))

    # Find privileges that match this resource type
    privilege_matches = parliament.get_privilege_matches_for_resource_type(resource_type_matches)

    # For each account, see who has these privileges for this resource
    for account in accounts:
        try:
            file_name = "account-data/{}/{}/{}".format(
                account["name"], "us-east-1", "iam-get-account-authorization-details.json"
            )
            iam = json.load(open(file_name))
        except:
            raise Exception("No IAM data for account {}".format(account.name))

        admin_policies = []
        policy_action_counts = {}
        for policy in iam["Policies"]:
            print('--- {}'.format(policy['PolicyName']))
            policy_doc = get_current_policy_doc(policy)
            policy = parliament.policy.Policy(policy_doc)
            policy.analyze()

            for privilege_match in privilege_matches:
                references = policy.get_references(privilege_match['privilege_prefix'], privilege_match['privilege_name'])
                if len(references) == 0:
                    continue
                statements_for_resource = []
                for reference in references:
                    if parliament.is_arn_match(privilege_match['resource_type'], reference, args.resource_arn):
                        statements_for_resource.append(references[reference])
                        print('{}:{} - {}'.format(privilege_match['privilege_prefix'], privilege_match['privilege_name'], reference))





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

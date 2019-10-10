import argparse
import yaml
import json
import parliament
from parliament.policy import Policy

from shared.common import parse_arguments, get_current_policy_doc

__description__ = "Check who has access to a resource"


def get_privilege_statements(policy_doc, privilege_matches, resource_arn):
    policy = parliament.policy.Policy(policy_doc)
    policy.analyze()

    policy_privilege_matches = []

    for privilege_match in privilege_matches:
        references = policy.get_references(
            privilege_match["privilege_prefix"], privilege_match["privilege_name"]
        )

        statements_for_resource = []
        for reference in references:
            if parliament.is_arn_match(
                privilege_match["resource_type"], reference, resource_arn
            ):
                statements_for_resource.extend(references[reference])
        if len(statements_for_resource) == 0:
            continue

        policy_privilege_matches.append(
            {
                "privilege": privilege_match,
                "matching_statements": statements_for_resource,
            }
        )
        # print('{}:{} - {}'.format(privilege_match['privilege_prefix'], privilege_match['privilege_name'], reference))

    return policy_privilege_matches


def access_check_command(accounts, config, args):
    """Check who has access"""
    # Find resource types that match the given ARN
    resource_type_matches = parliament.get_resource_type_matches_from_arn(
        args.resource_arn
    )
    if len(resource_type_matches) == 0:
        raise Exception("Unknown ARN type for {}".format(args.resource_arn))

    # Find privileges that match this resource type
    privilege_matches = parliament.get_privilege_matches_for_resource_type(
        resource_type_matches
    )

    # Check if we were given a privilege
    if args.privilege is not None:
        # Confirm these privileges exist
        expanded_actions = parliament.expand_action(args.privilege)
        if len(expanded_actions) == 0:
            raise Exception("Unknown privilege {}".format(args.privilege))

        new_privilege_matches = []
        for action in expanded_actions:
            for privilege in privilege_matches:
                if (
                    action["service"] == privilege["privilege_prefix"]
                    and action["action"] == privilege["privilege_name"]
                ):
                    new_privilege_matches.append(privilege)
        privilege_matches = new_privilege_matches

    if len(privilege_matches) == 0:
        raise Exception("No privileges exist for the given argument set")

    # For each account, see who has these privileges for this resource
    for account in accounts:
        try:
            file_name = "account-data/{}/{}/{}".format(
                account["name"],
                "us-east-1",
                "iam-get-account-authorization-details.json",
            )
            iam = json.load(open(file_name))
        except:
            raise Exception("No IAM data for account {}".format(account.name))

        # Check the roles
        for role in iam["RoleDetailList"]:
            privileged_statements = []

            # Get the managed policies
            for policy in role["AttachedManagedPolicies"]:
                policy_doc = get_managed_policy(iam, policy['PolicyArn'])
                privileged_statements.extend(get_privilege_statements(
                    policy_doc, privilege_matches, args.resource_arn
                ))

            # Get the inline policies
            for policy in role.get("RolePolicyList", []):
                policy_doc = policy["PolicyDocument"]
                privileged_statements.extend(
                    get_privilege_statements(
                        policy_doc, privilege_matches, args.resource_arn
                    )
                )

            # Find the allowed privileges
            allowed_privileges = get_allowed_privileges(
                privilege_matches, privileged_statements
            )
            for priv in allowed_privileges:
                print(
                    "{} - {}:{}".format(
                        role["Arn"], priv["privilege_prefix"], priv["privilege_name"]
                    )
                )

        # Check the users
        for user in iam["UserDetailList"]:
            privileged_statements = []

            # Get the managed policies
            for policy in user["AttachedManagedPolicies"]:
                policy_doc = get_managed_policy(iam, policy['PolicyArn'])
                privileged_statements.extend(get_privilege_statements(
                    policy_doc, privilege_matches, args.resource_arn
                ))

            # Get the inline policies
            for policy in user.get("UserPolicyList", []):
                policy_doc = policy["PolicyDocument"]
                privileged_statements.extend(
                    get_privilege_statements(
                        policy_doc, privilege_matches, args.resource_arn
                    )
                )

            # Get the group policies            
            for group_name in user.get("GroupList", []):
                for group in iam["GroupDetailList"]:
                    if group_name == group["GroupName"]:

                        for policy in group["AttachedManagedPolicies"]:
                            policy_doc = get_managed_policy(iam, policy['PolicyArn'])
                            privileged_statements.extend(get_privilege_statements(
                                policy_doc, privilege_matches, args.resource_arn
                            ))
                        
                        for policy in group["GroupPolicyList"]:
                            policy_doc = policy["PolicyDocument"]
                            privileged_statements.extend(
                                get_privilege_statements(
                                    policy_doc, privilege_matches, args.resource_arn
                                )
                            )
            
            # Get the IAM Boundary
            # TODO

            # Find the allowed privileges
            allowed_privileges = get_allowed_privileges(
                privilege_matches, privileged_statements
            )
            for priv in allowed_privileges:
                print(
                    "{} - {}:{}".format(
                        user["Arn"], priv["privilege_prefix"], priv["privilege_name"]
                    )
                )


def get_managed_policy(iam, policy_arn):
    for policy in iam["Policies"]:
        if policy_arn == policy["Arn"]:
            return get_current_policy_doc(policy)
    raise Exception("Policy not found: {}".format(policy_arn))


def get_allowed_privileges(privilege_matches, privileged_statements):
    """
    """
    allowed_privileges = []
    for privilege in privilege_matches:
        stmts_for_privilege = []
        # Find all statements that use this privilege
        for privileged_statement in privileged_statements:
            if (
                privileged_statement["privilege"]["privilege_prefix"]
                == privilege["privilege_prefix"]
                and privileged_statement["privilege"]["privilege_name"]
                == privilege["privilege_name"]
            ):
                stmts_for_privilege.extend(privileged_statement["matching_statements"])

        # Ensure we have at least one statement which could be an allow
        if len(stmts_for_privilege) > 0:
            # Ensure we have no denies
            is_allowed = True
            for stmt in stmts_for_privilege:
                if not stmt.effect_allow:
                    is_allowed = False

            if is_allowed:
                allowed_privileges.append(privilege)
    return allowed_privileges


def run(arguments):
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--resource_arn",
        help="The resource to be looked at, such as arn:aws:s3:::mybucket",
        required=True,
    )
    parser.add_argument(
        "--privilege", help="The privilege in question (ex. s3:GetObject)"
    )
    args, accounts, config = parse_arguments(arguments, parser)

    access_check_command(accounts, config, args)

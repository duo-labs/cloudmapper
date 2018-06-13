import os.path
import json
import re
from policyuniverse.policy import Policy
from shared.common import parse_arguments, make_list, log_info, log_warning

__description__ = "Find admins in accounts"

def get_current_policy_doc(policy):
    for doc in policy['PolicyVersionList']:
        if doc['IsDefaultVersion']:
            return doc['Document']
    raise Exception('No default document version in policy {}'.format(policy['Arn']))


def action_matches(action_from_policy, actions_to_match_against):
    action_from_policy = action_from_policy.lower()
    action = '^' + action_from_policy.replace('*', '.*') + '$'
    for action_to_match_against in actions_to_match_against:
        action_to_match_against = action_to_match_against.lower()
        if re.match(action, action_to_match_against):
            return True
    return False


def policy_action_count(policy_doc, location):
    # Counts how many unrestricted actions a policy grants
    policy = Policy(policy_doc)
    actions_count = 0
    for stmt in policy.statements:
        if (stmt.effect == 'Allow' and
                len(stmt.condition_entries) == 0 and
                stmt.resources == set('*')):
            actions_count += len(stmt.actions_expanded)
    return actions_count


def is_admin_policy(policy_doc, location):
    # This attempts to identify policies that directly allow admin privs, or indirectly through possible
    # privilege escalation (ex. iam:PutRolePolicy to add an admin policy to itself).
    # It is a best effort. It will have false negatives, meaning it may not identify an admin policy
    # when it should, and may have false positives.
    for stmt in make_list(policy_doc['Statement']):
        if stmt['Effect'] == 'Allow':
            # Check for use of NotAction, if they are allowing everything except a set, with no restrictions,
            # this is bad.
            not_actions = make_list(stmt.get('NotAction', []))
            if not_actions != [] and stmt.get('Resource', '') == '*' and stmt.get('Condition', '') == '':
                if 'iam:*' in not_actions:
                    # This is used for PowerUsers, where they can do everything except IAM actions
                    return False
                log_warning('Use of Allow and NotAction on Resource * is likely unwanted', location, [stmt])
                return True

            actions = make_list(stmt.get('Action', []))
            for action in actions:
                if action == '*' or action == '*:*' or action == 'iam:*':
                    if stmt.get('Resource', '') != '*':
                        log_warning('Admin policy not using a Resource of *', location, [stmt.get('Resource', '')])
                    return True
                # Look for privilege escalations
                if stmt.get('Resource', '') == '*' and stmt.get('Condition', '') == '' and (
                    action_matches(action, [
                        'iam:PutRolePolicy',
                        'iam:AddUserToGroup',
                        'iam:AddRoleToInstanceProfile',
                        'iam:AttachGroupPolicy',
                        'iam:AttachRolePolicy',
                        'iam:AttachUserPolicy',
                        'iam:ChangePassword',
                        'iam:CreateAccessKey',
                        # Check for the rare possibility that an actor has a Deny policy on themselves,
                        # so they try to escalate privs by removing that policy
                        'iam:DeleteUserPolicy',
                        'iam:DetachGroupPolicy',
                        'iam:DetachRolePolicy',
                        'iam:DetachUserPolicy']
                    )
                ):
                    return True

    return False


def record_admin(admins, account_name, actor_type, actor_name):
    admins.append({'account': account_name, 'type': actor_type, 'name': actor_name})

def find_admins(accounts, config):
    admins = []
    for account in accounts:
        location = {'account': account['name']}

        try:
            file_name = 'account-data/{}/{}/{}'.format(
                    account['name'],
                    'us-east-1',
                    'iam-get-account-authorization-details.json')
            iam = json.load(open(file_name))
        except:
            if not os.path.exists('account-data/{}/'.format(account['name'])):
                # Account has not been collected from, so silently skip it
                continue
            log_error('Problem opening iam data, skipping account', location, [file_name])
            continue

        admin_policies = []
        policy_action_counts = {}
        for policy in iam['Policies']:
            location['policy'] = policy['Arn']
            policy_doc = get_current_policy_doc(policy)
            policy_action_counts[policy['Arn']] = policy_action_count(policy_doc, location)

            if is_admin_policy(policy_doc, location):
                admin_policies.append(policy['Arn'])
                if ('arn:aws:iam::aws:policy/AdministratorAccess' in policy['Arn'] or
                    'arn:aws:iam::aws:policy/IAMFullAccess' in policy['Arn']):
                    # Ignore the admin policies that are obviously admin
                    continue
                if 'arn:aws:iam::aws:policy' in policy['Arn']:
                    # Detects the deprecated `AmazonElasticTranscoderFullAccess`
                    log_warning('AWS managed policy allows admin', location, [policy_doc])
                    continue
                log_warning('Custom policy allows admin', location, [policy_doc])
        location.pop('policy', None)

        # Identify roles that allow admin access
        for role in iam['RoleDetailList']:
            location['role'] = role['Arn']
            reasons = []

            # Check if this role is an admin
            for policy in role['AttachedManagedPolicies']:
                if policy['PolicyArn'] in admin_policies:
                    reasons.append('Attached managed policy: {}'.format(policy['PolicyArn']))
            for policy in role['RolePolicyList']:
                policy_doc = policy['PolicyDocument']
                if is_admin_policy(policy_doc, location):
                    reasons.append('Custom policy: {}'.format(policy['PolicyName']))
                    log_warning('Role has custom policy allowing admin', location, [policy_doc])

            if len(reasons) != 0:
                for stmt in role['AssumeRolePolicyDocument']['Statement']:
                    if stmt['Effect'] != 'Allow':
                        log_warning('Unexpected Effect in AssumeRolePolicyDocument', location, [stmt])
                        continue

                    if stmt['Action'] == 'sts:AssumeRole':
                        if 'AWS' not in stmt['Principal'] or len(stmt['Principal']) != 1:
                            log_warning('Unexpected Principal in AssumeRolePolicyDocument', location, [stmt['Principal']])
                    elif stmt['Action'] == 'sts:AssumeRoleWithSAML':
                        continue
                    else:
                        log_warning('Unexpected Action in AssumeRolePolicyDocument', location, [stmt])
                log_info('Role is admin', location, reasons)
                record_admin(admins, account['name'], 'role', role['RoleName'])
            # TODO Should check users or other roles allowed to assume this role to show they are admins
        location.pop('role', None)

        # Identify groups that allow admin access
        admin_groups = []
        for group in iam['GroupDetailList']:
            location['group'] = group['Arn']
            is_admin = False
            for policy in group['AttachedManagedPolicies']:
                if policy['PolicyArn'] in admin_policies:
                    is_admin = True
                    if 'admin' not in group['Arn'].lower():
                        log_warning('Group is admin, but name does not indicate it is', location)
            for policy in group['GroupPolicyList']:
                policy_doc = policy['PolicyDocument']
                if is_admin_policy(policy_doc, location):
                    is_admin = True
                    log_warning('Group has custom policy allowing admin', location, [policy_doc])
            if is_admin:
                admin_groups.append(group['GroupName'])
        location.pop('group', None)

        # Check users
        for user in iam['UserDetailList']:
            location['user'] = user['UserName']
            reasons = []

            # Check the different ways in which the user could be an admin
            for policy in user['AttachedManagedPolicies']:
                if policy['PolicyArn'] in admin_policies:
                    reasons.append('Attached managed policy: {}'.format(policy['PolicyArn']))
            for policy in user.get('UserPolicyList', []):
                policy_doc = policy['PolicyDocument']
                if is_admin_policy(policy_doc, location):
                    reasons.append('Custom user policy: {}'.format(policy['PolicyName']))
                    log_warning('User has custom policy allowing admin', location)
            for group in user['GroupList']:
                if group in admin_groups:
                    reasons.append('In admin group: {}'.format(group))

            # Log them if they are an admin
            if len(reasons) != 0:
                log_info('User is admin', location, reasons)
                record_admin(admins, account['name'], 'user', user['UserName'])

        location.pop('user', None)
    return admins


def get_account_name_from_id(accounts, account_id):
    for a in accounts:
        if account_id == a['id']:
            return a['name']
    return None


def run(arguments):
    _, accounts, config = parse_arguments(arguments)
    admins = find_admins(accounts, config)

    for admin in admins:
        print("{}\t{}\t{}".format(admin['account'], admin['type'], admin['name']))

import json
from datetime import datetime
import pyjq
import traceback
import re
import os.path

from policyuniverse.policy import Policy

from netaddr import IPNetwork
from shared.common import Finding, make_list, get_us_east_1
from shared.query import query_aws, get_parameter_file
from shared.nodes import Account, Region


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


def is_admin_policy(policy_doc, location, findings, region):
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
                findings.add(Finding(
                    region,
                    'IAM_NOTACTION_ALLOW',
                    location,
                    resource_details={'Statement': stmt}))
                return True

            actions = make_list(stmt.get('Action', []))
            for action in actions:
                if action == '*' or action == '*:*' or action == 'iam:*':
                    if stmt.get('Resource', '') != '*':
                        findings.add(Finding(
                            region,
                            'IAM_UNEXPECTED_FORMAT',
                            location,
                            resource_details={
                                'comment': 'This policy is oddly allowing all actions, but is restricted to a specific resource. This is a confusing way of restricting access that may be more privileged than expected.',
                                'statement': stmt}))
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


def check_for_bad_policy(findings, region, arn, policy_text):
    for statement in make_list(policy_text['Statement']):
        # Checking for signatures of the bad MFA policy from
        # https://web.archive.org/web/20170602002425/https://docs.aws.amazon.com/IAM/latest/UserGuide/tutorial_users-self-manage-mfa-and-creds.html
        # and
        # https://github.com/awsdocs/iam-user-guide/blob/cfe14c674c494d07ba0ab952fe546fdd587da65d/doc_source/id_credentials_mfa_enable_virtual.md#permissions-required
        if statement.get('Sid', '') == 'AllowIndividualUserToManageTheirOwnMFA' or statement.get('Sid', '') == 'AllowIndividualUserToViewAndManageTheirOwnMFA':
            if 'iam:DeactivateMFADevice' in make_list(statement.get('Action', [])):
                findings.add(Finding(
                    region,
                    'BAD_MFA_POLICY',
                    arn,
                    policy_text))
                return
        elif statement.get('Sid', '') == 'BlockAnyAccessOtherThanAboveUnlessSignedInWithMFA':
            if 'iam:*' in make_list(statement.get('NotAction', [])):
                findings.add(Finding(
                    region,
                    'BAD_MFA_POLICY',
                    arn,
                    policy_text))
                return


def find_admins(accounts, findings):
    admins = []
    for account in accounts:
        account = Account(None, account)
        region = get_us_east_1(account)
        admins.extend(find_admins_in_account(region, findings))

    return admins


def find_admins_in_account(region, findings):
    account = region.account
    location = {'account': account.name}

    admins = []

    try:
        file_name = 'account-data/{}/{}/{}'.format(
            account.name,
            'us-east-1',
            'iam-get-account-authorization-details.json')
        iam = json.load(open(file_name))
    except:
        raise Exception('No IAM data for account {}'.format(account.name))

    admin_policies = []
    policy_action_counts = {}
    for policy in iam['Policies']:
        location['policy'] = policy['Arn']
        policy_doc = get_current_policy_doc(policy)

        check_for_bad_policy(findings, region, policy['Arn'], policy_doc)

        policy_action_counts[policy['Arn']] = policy_action_count(policy_doc, location)

        if is_admin_policy(policy_doc, location, findings, region):
            admin_policies.append(policy['Arn'])
            if ('arn:aws:iam::aws:policy/AdministratorAccess' in policy['Arn'] or
                    'arn:aws:iam::aws:policy/IAMFullAccess' in policy['Arn']):
                # Ignore the admin policies that are obviously admin
                continue
            if 'arn:aws:iam::aws:policy' in policy['Arn']:
                # Detects the deprecated `AmazonElasticTranscoderFullAccess`
                findings.add(Finding(
                    region,
                    'IAM_MANAGED_POLICY_UNINTENTIONALLY_ALLOWING_ADMIN',
                    policy['Arn'],
                    resource_details={'policy': policy_doc}))
                continue
            findings.add(Finding(
                region,
                'IAM_CUSTOM_POLICY_ALLOWS_ADMIN',
                policy['Arn'],
                resource_details={'policy': policy_doc}))
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
            if is_admin_policy(policy_doc, location, findings, region):
                reasons.append('Custom policy: {}'.format(policy['PolicyName']))
                findings.add(Finding(
                    region,
                    'IAM_CUSTOM_POLICY_ALLOWS_ADMIN',
                    role['Arn'],
                    resource_details={
                        'comment': 'Role has custom policy allowing admin',
                        'policy': policy_doc}))

        if len(reasons) != 0:
            for stmt in role['AssumeRolePolicyDocument']['Statement']:
                if stmt['Effect'] != 'Allow':
                    findings.add(Finding(
                        region,
                        'IAM_UNEXPECTED_FORMAT',
                        role['Arn'],
                        resource_details={
                            'comment': 'Unexpected Effect in AssumeRolePolicyDocument',
                            'statement': stmt}))
                    continue

                if stmt['Action'] == 'sts:AssumeRole':
                    if 'AWS' not in stmt['Principal'] or len(stmt['Principal']) != 1:
                        findings.add(Finding(
                            region,
                            'IAM_UNEXPECTED_FORMAT',
                            role['Arn'],
                            resource_details={
                                'comment': 'Unexpected Principal in AssumeRolePolicyDocument',
                                'Principal': stmt['Principal']}))
                elif stmt['Action'] == 'sts:AssumeRoleWithSAML':
                    continue
                else:
                    findings.add(Finding(
                        region,
                        'IAM_UNEXPECTED_FORMAT',
                        role['Arn'],
                        resource_details={
                            'comment': 'Unexpected Action in AssumeRolePolicyDocument',
                            'statement': [stmt]}))

            record_admin(admins, account.name, 'role', role['RoleName'])
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
                    findings.add(Finding(
                        region,
                        'IAM_NAME_DOES_NOT_INDICATE_ADMIN',
                        group['Arn'],
                        None))
        for policy in group['GroupPolicyList']:
            policy_doc = policy['PolicyDocument']
            if is_admin_policy(policy_doc, location, findings, region):
                is_admin = True
                findings.add(Finding(
                    region,
                    'IAM_CUSTOM_POLICY_ALLOWS_ADMIN',
                    group['Arn'],
                    resource_details={
                        'comment': 'Group has custom policy allowing admin',
                        'policy': policy_doc}))
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
            if is_admin_policy(policy_doc, location, findings, region):
                reasons.append('Custom user policy: {}'.format(policy['PolicyName']))
                findings.add(Finding(
                    region,
                    'IAM_CUSTOM_POLICY_ALLOWS_ADMIN',
                    user['UserName'],
                    resource_details={
                        'comment': 'User has custom policy allowing admin',
                        'policy': policy_doc}))
        for group in user['GroupList']:
            if group in admin_groups:
                reasons.append('In admin group: {}'.format(group))

        # Log them if they are an admin
        if len(reasons) != 0:
            # log_info('User is admin', location, reasons)
            record_admin(admins, account.name, 'user', user['UserName'])

    location.pop('user', None)
    return admins

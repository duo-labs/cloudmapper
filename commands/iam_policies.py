from __future__ import print_function

import argparse
import json
from urllib.parse import unquote

__description__ = "Print all collected IAM policies for a principal"


def _policy_document(policy):
    """Return the default-version document from a collected managed policy."""
    for version in policy.get("PolicyVersionList", []):
        if version.get("IsDefaultVersion") or version.get("VersionId") == policy.get(
            "DefaultVersionId"
        ):
            document = version.get("Document")
            if isinstance(document, str):
                try:
                    return json.loads(unquote(document))
                except ValueError:
                    return document
            return document
    return None


def _principal_name(principal):
    return principal.get("UserName") or principal.get("RoleName")


def _matches_principal(principal, requested):
    requested = requested.rstrip("/")
    candidates = {
        principal.get("Arn", "").rstrip("/"),
        principal.get("UserName", ""),
        principal.get("RoleName", ""),
    }
    return requested in candidates


def _managed_policy(policy_ref, managed_by_arn, source):
    policy = managed_by_arn.get(policy_ref.get("PolicyArn"), {})
    return {
        "source": source,
        "name": policy_ref.get("PolicyName") or policy.get("PolicyName"),
        "arn": policy_ref.get("PolicyArn") or policy.get("Arn"),
        "document": _policy_document(policy) if policy else None,
    }


def _inline_policies(principal, policy_key, source):
    policies = []
    for policy in principal.get(policy_key, []):
        policies.append(
            {
                "source": source,
                "name": policy.get("PolicyName"),
                "arn": None,
                "document": policy.get("PolicyDocument"),
            }
        )
    return policies


def build_principal_policy_report(auth_details, requested):
    """Build a JSON-serializable policy report from IAM auth details.

    The input is the response saved by CloudMapper's collect command. No AWS
    calls are made here, which keeps the policy attribution logic testable.
    """
    managed_by_arn = {
        policy.get("Arn"): policy
        for policy in auth_details.get("Policies", [])
        if policy.get("Arn")
    }
    principals = [
        ("user", principal, "UserPolicyList")
        for principal in auth_details.get("UserDetailList", [])
    ] + [
        ("role", principal, "RolePolicyList")
        for principal in auth_details.get("RoleDetailList", [])
    ]
    matches = [entry for entry in principals if _matches_principal(entry[1], requested)]
    if not matches:
        raise ValueError("Principal {!r} was not found in collected IAM data".format(requested))

    groups_by_name = {
        group.get("GroupName"): group
        for group in auth_details.get("GroupDetailList", [])
        if group.get("GroupName")
    }
    reports = []
    for principal_type, principal, inline_key in matches:
        policies = _inline_policies(principal, inline_key, "inline:principal")
        for policy_ref in principal.get("AttachedManagedPolicies", []):
            policies.append(_managed_policy(policy_ref, managed_by_arn, "managed:principal"))

        for group_name in principal.get("GroupList", []):
            group = groups_by_name.get(group_name)
            if not group:
                continue
            policies.extend(_inline_policies(group, "GroupPolicyList", "inline:group"))
            for policy_ref in group.get("AttachedManagedPolicies", []):
                policy = _managed_policy(policy_ref, managed_by_arn, "managed:group")
                policy["group"] = group_name
                policies.append(policy)

        reports.append(
            {
                "principal": {
                    "type": principal_type,
                    "name": _principal_name(principal),
                    "arn": principal.get("Arn"),
                },
                "policies": policies,
            }
        )
    return reports


def run(arguments):
    from shared.common import custom_serializer, get_us_east_1, parse_arguments
    from shared.nodes import Account
    from shared.query import query_aws

    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--principal",
        required=True,
        help="IAM user or role name or ARN to inspect",
    )
    args, accounts, _ = parse_arguments(arguments, parser)

    for account_data in accounts:
        account = Account(None, account_data)
        region = get_us_east_1(account)
        auth_details = query_aws(
            account, "iam-get-account-authorization-details", region
        )
        try:
            reports = build_principal_policy_report(auth_details, args.principal)
        except ValueError as error:
            parser.error("{} in account {}".format(error, account.name))
        print(
            json.dumps(
                {
                    "account": account.name,
                    "principal_query": args.principal,
                    "results": reports,
                },
                indent=2,
                sort_keys=True,
                default=custom_serializer,
            )
        )

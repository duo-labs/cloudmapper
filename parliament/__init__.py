"""
This library is a linter for AWS IAM policies.
"""
__version__ = "0.2.1"

import os
import json
import re
import fnmatch

# On initialization, load the IAM data
iam_definition_path = os.path.join(
    os.path.dirname(os.path.realpath(__file__)), "iam_definition.json"
)
iam_definition = json.load(open(iam_definition_path, "r"))


def analyze_policy_string(policy_str, filepath=None):
    """Given a string reperesenting a policy, convert it to a Policy object with findings"""

    try:
        # TODO Need to write my own json parser so I can track line numbers. See https://stackoverflow.com/questions/7225056/python-json-decoding-library-which-can-associate-decoded-items-with-original-li
        policy_json = json.loads(policy_str)
    except ValueError as e:
        policy = Policy(None)
        policy.add_finding("json parsing error: {}".format(e), severity.MALFORMED)
        return policy

    policy = Policy(policy_json, filepath)
    policy.analyze()
    return policy


def is_arn_match(resource_type, arn_format, resource):
    """
    Match the arn_format specified in the docs, with the resource
    given in the IAM policy.  These can each be strings with globbing. For example, we
    want to match the following two strings:
    - arn:*:s3:::*/*
    - arn:aws:s3:::*personalize*

    That should return true because you could have "arn:aws:s3:::personalize/" which matches both.

    Input:
    - resource_type: Example "bucket", this is only used to identify special cases.
    - arn_format: ARN regex from the docs
    - resource: ARN regex from IAM policy

    Notes:

    This problem is known as finding the intersection of two regexes.
    There is a library for this here https://github.com/qntm/greenery but it is far too slow,
    taking over two minutes for that example before I killed the process.
    The problem can be simplified because we only care about globbed strings, not full regexes,
    but there are no Python libraries, but here is one in Go: https://github.com/Pathgather/glob-intersection

    We can some cheat because after the first sections of the arn match, meaning until the 5th colon (with some
    rules there to allow empty or asterisk sections), we only need to match the ID part.
    So the above is simplified to "*/*" and "*personalize*".

    Let's look at some examples and if these should be marked as a match:
    "*/*" and "*personalize*" -> True
    "*", "mybucket" -> True
    "mybucket", "*" -> True
    "*/*", "mybucket" -> False
    "*/*", "mybucket*" -> True
    "*mybucket", "*myotherthing" -> False
    """
    if arn_format == "*" or resource == "*":
        return True

    if "bucket" in resource_type:
        # We have to do a special case here for S3 buckets
        if "/" in resource:
            return False

    arn_parts = arn_format.split(":")
    if len(arn_parts) < 6:
        raise Exception("Unexpected format for ARN: {}".format(arn_format))
    resource_parts = resource.split(":")
    if len(resource_parts) < 6:
        raise Exception("Unexpected format for resource: {}".format(resource))
    for position in range(0, 5):
        if arn_parts[position] == "*" or arn_parts[position] == "":
            continue
        elif resource_parts[position] == "*" or resource_parts[position] == "":
            continue
        elif arn_parts[position] == resource_parts[position]:
            continue
        else:
            return False

    arn_id = "".join(arn_parts[5:])
    resource_id = "".join(resource_parts[5:])

    # At this point we might have something like:
    # log-group:* for arn_id and
    # log-group:/aws/elasticbeanstalk* for resource_id

    # Look for exact match
    # Examples:
    # "mybucket", "mybucket" -> True
    # "*", "*" -> True
    if arn_id == resource_id:
        return True

    # Some of the arn_id's contain regexes of the form "[key]" so replace those with "*"
    arn_id = re.sub(r"\[.+?\]", "*", arn_id)

    # If neither contain an asterisk they can't match
    # Example:
    # "mybucket", "mybucketotherthing" -> False
    if "*" not in arn_id and "*" not in resource_id:
        return False

    # If either is an asterisk it matches
    # Examples:
    # "*", "mybucket" -> True
    # "mybucket", "*" -> True
    if arn_id == "*" or resource_id == "*":
        return True

    # We already checked if they are equal, so we know both aren't "", but if one is, and the other is not,
    # and the other is not "*" (which we just checked), then these do not match
    # Examples:
    # "", "mybucket" -> False
    if arn_id == "" or resource_id == "":
        return False

    # If one begins with an asterisk and the other ends with one, it should match
    # Examples:
    # "*/*" and "*personalize*" -> True
    if (arn_id[0] == "*" and resource_id[-1] == "*") or (
        arn_id[-1] == "*" and resource_id[0] == "*"
    ):
        return True

    # At this point, we are trying to check the following
    # "*/*", "mybucket" -> False
    # "*/*", "mybucket/abc" -> True
    # "mybucket*", "mybucketotherthing" -> True
    # "*mybucket", "*myotherthing" -> False

    # We are going to cheat and miss some possible situations, because writing something
    # to do this correctly by generating a state machine seems much harder.

    # Check situation where it begins and ends with asterisks, such as "*/*"
    if arn_id[0] == "*" and arn_id[-1] == "*":
        if arn_id[1:-1] in resource_id:
            return True
    if resource_id[0] == "*" and resource_id[-1] == "*":
        if resource_id[1:-1] in arn_id:
            return True

    # Check where one ends with an asterisk
    if arn_id[-1] == "*":
        if resource_id[: len(arn_id) - 1] == arn_id[:-1]:
            return True
    if resource_id[-1] == "*":
        if arn_id[: len(resource_id) - 1] == resource_id[:-1]:
            return True

    return False


def expand_action(action, raise_exceptions=True):
    """
    Converts "iam:*List*" to
    [
      {'service':'iam', 'action': 'ListAccessKeys'},
      {'service':'iam', 'action': 'ListUsers'}, ...
    ]
    """
    parts = action.split(":")
    if len(parts) != 2:
        raise ValueError("Action should be in form service:action")
    prefix = parts[0]
    unexpanded_action = parts[1]

    actions = []
    service_match = None
    for service in iam_definition:
        if service["prefix"] == prefix.lower():
            service_match = service

            for privilege in service["privileges"]:
                if fnmatch.fnmatchcase(
                    privilege["privilege"].lower(), unexpanded_action.lower()
                ):
                    actions.append(
                        {
                            "service": service_match["prefix"],
                            "action": privilege["privilege"],
                        }
                    )

    if not service_match and raise_exceptions:
        raise ValueError("Unknown prefix {}".format(prefix))

    if len(actions) == 0 and raise_exceptions:
        raise ValueError("Unknown action {}:{}".format(prefix, unexpanded_action))

    return actions


def get_resource_type_matches_from_arn(arn):
    """ Given an ARN such as "arn:aws:s3:::mybucket", find resource types that match it.
        This would return:
        [
            "resource": {
                "arn": "arn:${Partition}:s3:::${BucketName}",
                "condition_keys": [],
                "resource": "bucket"
            },
            "service": {
                "service_name": "Amazon S3",
                "privileges": [...]
                ...
            }
        ]
    """
    matches = []
    for service in iam_definition:
        for resource in service["resources"]:
            arn_format = re.sub(r"\$\{.*?\}", "*", resource["arn"])
            if is_arn_match(resource["resource"], arn, arn_format):
                matches.append({"resource": resource, "service": service})
    return matches


def get_privilege_matches_for_resource_type(resource_type_matches):
    """ Given the response from get_resource_type_matches_from_arn(...), this will identify the relevant privileges.
    """
    privilege_matches = []
    for match in resource_type_matches:
        for privilege in match["service"]["privileges"]:
            for resource_type_dict in privilege["resource_types"]:
                resource_type = resource_type_dict["resource_type"].replace("*", "")
                if resource_type == match["resource"]["resource"]:
                    privilege_matches.append(
                        {
                            "privilege_prefix": match["service"]["prefix"],
                            "privilege_name": privilege["privilege"],
                            "resource_type": resource_type
                        }
                    )

    return privilege_matches

# Import moved here to deal with cyclic dependency
from .policy import Policy
from .finding import severity
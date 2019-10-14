import argparse
import unittest
import json
from nose.tools import assert_equal, assert_true, assert_false

from shared.common import parse_arguments
from commands.access_check import (
    replace_principal_variables,
    Principal,
    get_privilege_statements,
    get_allowed_privileges,
    access_check_command,
)


class TestAccessCheck(unittest.TestCase):
    def test_replace_principal_variables(self):
        principal = Principal(
            "AssumedRole",
            [{"Key": "project", "Value": "prod"}, {"Key": "color", "Value": "blue"}],
            username="role",
            userid="",
        )

        assert_equal(replace_principal_variables("*", principal), "*")
        # Ensure replacement works
        assert_equal(
            replace_principal_variables(
                "arn:aws:sns:*:*:${aws:PrincipalTag/project}", principal
            ),
            "arn:aws:sns:*:*:prod",
        )
        # Ensure case insensitive replacement works
        assert_equal(
            replace_principal_variables(
                "arn:aws:sns:*:*:${aws:principaltag/project}", principal
            ),
            "arn:aws:sns:*:*:prod",
        )
        # Ensure we don't replace unknown variables
        assert_equal(
            replace_principal_variables(
                "arn:aws:sns:*:*:${aws:principaltag/app}", principal
            ),
            "arn:aws:sns:*:*:${aws:principaltag/app}",
        )
        # Ensure multiple replacements works
        assert_equal(
            replace_principal_variables(
                "arn:aws:sns:*:*:${aws:PrincipalTag/project}-${aws:PrincipalTag/color}",
                principal,
            ),
            "arn:aws:sns:*:*:prod-blue",
        )

    def test_get_privilege_statements(self):
        principal = Principal(
            "AssumedRole",
            [{"Key": "project", "Value": "prod"}, {"Key": "color", "Value": "blue"}],
            username="role",
            userid="",
        )

        policy_doc = """
        {
            "Statement": [
                {
                    "Action": "s3:GetObject",
                    "Effect": "Allow",
                    "Resource": "*"
                },
                {
                    "Sid": "AllowSNSAccessBasedOnArnMatching",
                    "Effect": "Allow",
                    "Action": [
                        "sns:Publish"
                    ],
                    "Resource": [
                        "arn:aws:sns:*:*:${aws:PrincipalTag/project}-*"
                    ]
                }
            ],
            "Version": "2012-10-17"
        }"""
        policy_doc = json.loads(policy_doc)

        # Ensure this works at all
        privilege_matches = [
            {
                "privilege_prefix": "s3",
                "privilege_name": "GetObject",
                "resource_type": "object",
            }
        ]
        assert_true(
            len(get_privilege_statements(policy_doc, privilege_matches, "*", principal))
            > 0
        )

        # Ensure it doesn't return anything when we check for a privilege we don't have (s3:PutObject)
        privilege_matches = [
            {
                "privilege_prefix": "s3",
                "privilege_name": "PutObject",
                "resource_type": "object",
            }
        ]
        assert_true(
            len(get_privilege_statements(policy_doc, privilege_matches, "*", principal))
            == 0
        )

        # Check the SNS privilege
        privilege_matches = [
            {
                "privilege_prefix": "sns",
                "privilege_name": "Publish",
                "resource_type": "topic",
            }
        ]
        assert_true(
            len(get_privilege_statements(policy_doc, privilege_matches, "*", principal))
            > 0
        )

        # Check it against a specific resource
        assert_true(
            len(
                get_privilege_statements(
                    policy_doc, privilege_matches, "arn:aws:sns:*:*:prod-*", principal
                )
            )
            > 0
        )
        # Ensure we get zero when we use a different resource
        assert_true(
            len(
                get_privilege_statements(
                    policy_doc, privilege_matches, "arn:aws:sns:*:*:dev-*", principal
                )
            )
            == 0
        )

    def test_get_allowed_privileges(self):
        principal = Principal(
            "AssumedRole",
            [{"Key": "project", "Value": "prod"}, {"Key": "color", "Value": "blue"}],
            username="role",
            userid="",
        )

        policy_doc = """
        {
            "Statement": [
                {
                    "Action": "s3:GetObject",
                    "Effect": "Allow",
                    "Resource": "*"
                },
                {
                    "Sid": "AllowSNSAccessBasedOnArnMatching",
                    "Effect": "Allow",
                    "Action": [
                        "sns:Publish"
                    ],
                    "Resource": [
                        "arn:aws:sns:*:*:${aws:PrincipalTag/project}-*"
                    ]
                }
            ],
            "Version": "2012-10-17"
        }"""
        policy_doc = json.loads(policy_doc)

        privilege_matches = [
            {
                "privilege_prefix": "s3",
                "privilege_name": "GetObject",
                "resource_type": "object",
            }
        ]
        stmts = get_privilege_statements(policy_doc, privilege_matches, "*", principal)

        # Ensure we have allowed statements when there is no boundary
        assert_true(len(get_allowed_privileges(privilege_matches, stmts, None)) > 0)

        # Ensure we have allowed statements when the boundary matches what was allowed
        assert_true(len(get_allowed_privileges(privilege_matches, stmts, stmts)) > 0)

        policy_doc = """
        {
            "Statement": [
                {
                    "Action": "*",
                    "Effect": "Deny",
                    "Resource": "*"
                }
            ],
            "Version": "2012-10-17"
        }"""
        policy_doc = json.loads(policy_doc)
        boundary = get_privilege_statements(
            policy_doc, privilege_matches, "*", principal
        )

        # Ensure nothing is allowed when the boundary denies all
        assert_true(
            len(get_allowed_privileges(privilege_matches, stmts, boundary)) == 0
        )

    def test_access_check(self):
        # TODO This parsing code should not be here
        parser = argparse.ArgumentParser()
        parser.add_argument(
            "--resource_arn",
            help="The resource to be looked at, such as arn:aws:s3:::mybucket",
            required=True,
        )
        parser.add_argument(
            "--privilege", help="The privilege in question (ex. s3:GetObject)"
        )
        args, accounts, config = parse_arguments(
            [
                "--accounts",
                "demo",
                "--config",
                "config.json.demo",
                "--resource_arn",
                "arn:aws:sns:*:*:prod-*",
            ],
            parser,
        )
        access_check_command(accounts, config, args)
        # TODO Have that function return results that can be tested
